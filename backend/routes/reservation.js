const express = require('express');
const router = express.Router();
const db = require('../db'); 
const axios = require('axios');

// Helper function to wrap db.query in Promises for clean async/await syntax
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// --- HELPER: Get Company Code ---
const getCompanyCode = () => {
    return new Promise((resolve, reject) => {
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";
        db.query(settingsSql, (err, result) => {
            if (err) return reject(err);
            const code = result[0]?.company_code || '26672691'; 
            resolve(code);
        });
    });
};

// ==========================================
// 1. GET User by Phone Number 
// ==========================================
router.get('/get-user-by-phone/:phone', async (req, res) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    try {
        const dataUsers = await queryPromise("SELECT * FROM users WHERE phone = ?", [phone]);
        if (dataUsers.length > 0) return res.status(200).json(dataUsers[0]);

        const dataCustomers = await queryPromise("SELECT * FROM customers WHERE phone = ?", [phone]);
        if (dataCustomers.length > 0) return res.status(200).json(dataCustomers[0]);

        return res.status(404).json({ message: "User not found" });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// ==========================================
// 2. GET BRANCH LIST
// ==========================================
router.get('/branches', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
        const response = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' } });
        
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            throw new Error("Laravel block");
        }

        let branches = [];
        if (response.data && response.data.data && response.data.data.branches) {
            branches = response.data.data.branches;
        } else if (response.data && Array.isArray(response.data.data)) {
            // ---> THIS is the missing check! It grabs the array from the 'data' key <---
            branches = response.data.data;
        } else if (Array.isArray(response.data)) {
            branches = response.data;
        }

        res.json(branches);
    } catch (error) {
        res.json([]);
    }
});

// ==========================================
// 3. GET TABLES & AVAILABILITY BY BRANCH ID
// ==========================================
router.get('/tables/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;
        // Capture the chosen date and time from the frontend request
        const { date: chosenDate, time: chosenTime } = req.query;

        if (!chosenDate || !chosenTime) {
            return res.status(400).json({ error: "Date and Time are required to check table availability." });
        }

        const companyCode = await getCompanyCode();

        // 1. Fetch ALL physical tables from External API
        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${companyCode}&branch_id=${branch_id}`);
        
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 2. Fetch LOCAL reservations for this branch
        const reservations = await queryPromise("SELECT * FROM reservation WHERE branch_id = ?", [branch_id]);

        // 3. Convert chosenTime to hours for easy math (e.g., 14:30 becomes 14.5)
        let userTimeInHours = 0;
        if (chosenTime && typeof chosenTime === 'string') {
            const parts = chosenTime.split(':');
            userTimeInHours = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
        }

        // 4. Process each table according to your NEW logic
        const processedTables = tables.map(table => {
            let { id, table_no, capacity, person_no } = table;
            const stringTableNo = String(table_no).trim();
            
            // Assume table is available by default
            let isAvailable = true;
            let bookingMessage = null;

            // Find all local reservations belonging to this specific table
            const tableReservations = reservations.filter(res => {
                if (!res.table_number) return false;
                const resTables = String(res.table_number).split(',').map(t => t.trim());
                return resTables.includes(stringTableNo);
            });

            // Loop through the reservations to check for conflicts
            for (const res of tableReservations) {
                let resDate = res.date;
                
                // Format database date safely to YYYY-MM-DD for accurate comparison
                if (resDate instanceof Date) {
                    const y = resDate.getFullYear();
                    const m = String(resDate.getMonth() + 1).padStart(2, '0');
                    const d = String(resDate.getDate()).padStart(2, '0');
                    resDate = `${y}-${m}-${d}`;
                } else if (resDate && resDate.includes('T')) {
                    resDate = resDate.split('T')[0];
                }

                // LOGIC: At first compare the column "date" to the chosen date
                if (resDate === chosenDate) {
                    // They get matched! Now compare the column "time" to the chosen time.
                    let resTimeInHours = 0;
                    if (res.time && typeof res.time === 'string') {
                        const parts = res.time.split(':');
                        resTimeInHours = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
                    }

                    // LOGIC: If the chosen time + 60 minutes is equal or greater than column "time"
                    // (Adding 1 to userTimeInHours effectively adds 60 minutes)
                    if ((userTimeInHours + 1) >= resTimeInHours) {
                        isAvailable = false;
                        bookingMessage = `Reserved later today at ${res.time}`;
                        break; // Stop checking further reservations, this table is already blocked!
                    }
                }
            }

            return {
                id,
                table_no: stringTableNo,
                person_no: person_no,
                capacity: capacity,
                isAvailable,
                bookingMessage
            };
        });

        // Return the clean data to the frontend
        res.status(200).json(processedTables);

    } catch (error) {
        console.error("Error processing reservation tables:", error);
        res.status(500).json({ error: "Server error calculating table logic." });
    }
});


// ==========================================
// --- HELPER: CHECK AND CREATE CUSTOMER
// ==========================================
async function checkAndCreateCustomer(companyCode, branch_id, name, phone, address) {
    const checkCustSql = `SELECT id FROM customers WHERE company_id = ? AND phone = ?`;
    const checkRows = await queryPromise(checkCustSql, [companyCode, phone]);

    if (!checkRows || checkRows.length === 0) {
        console.log("Customer not found. Creating new customer record for reservation...");

        const descResult = await queryPromise("DESCRIBE customers");
        const columns = descResult.map(col => col.Field);

        const insertFields = [];
        const insertValues = [];
        const placeholders = [];

        if (columns.includes('company_id')) {
            insertFields.push('company_id');
            insertValues.push(companyCode);
            placeholders.push('?');
        }

        const otherFields = {
            'branch_id': branch_id,
            'name': name,
            'phone': phone,
            'address': address || null,
            'is_guest': 1, 
            'created_at': 'NOW()',
            'updated_at': 'NOW()'
        };

        for (const [field, value] of Object.entries(otherFields)) {
            if (columns.includes(field) && !insertFields.includes(field)) {
                insertFields.push(field);
                if (value === 'NOW()') {
                    insertValues.push('NOW()');
                    placeholders.push('NOW()');
                } else {
                    insertValues.push(value !== undefined ? value : null);
                    placeholders.push('?');
                }
            }
        }

        let nextCustId = null;
        if (columns.includes('cust_id') && !insertFields.includes('cust_id')) {
            const maxRows = await queryPromise("SELECT MAX(cust_id) as maxId FROM customers WHERE company_id = ?", [companyCode]);
            nextCustId = 1;
            if (maxRows && maxRows.length > 0 && maxRows[0].maxId) {
                nextCustId = parseInt(maxRows[0].maxId) + 1;
            }
            insertFields.unshift('cust_id');
            insertValues.unshift(nextCustId);
            placeholders.unshift('?');
        }

        const safeValues = insertValues.filter(v => v !== 'NOW()');
        const insertSql = `INSERT INTO customers (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await queryPromise(insertSql, safeValues);
    }
}

// ==========================================
// 5. CREATE NEW RESERVATION
// ==========================================
router.post('/create', async (req, res) => {
    try {
        const { branch_id, name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        // Extremely strictly cast integers to prevent strict mode crashes in MySQL
        const safeBranchId = (branch_id === "" || branch_id === null) ? null : parseInt(branch_id);
        const safeGuestNum = (guest_number === "" || guest_number === null) ? 0 : parseInt(guest_number);

        // FIX: Ensure time has seconds appended (HH:MM -> HH:MM:SS) for Laravel validation
        let formattedTime = time;
        if (formattedTime && formattedTime.split(':').length === 2) {
            formattedTime = `${formattedTime}:00`;
        }

        const sql = `
            INSERT INTO reservation (branch_id, name, phone, guest_number, event_name, notes, date, time, table_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Use the originally submitted time for local DB (or formatted, both work)
        const values = [safeBranchId, name, phone, safeGuestNum, event_name, notes, date, formattedTime, tableStr];

        // 1. Save to local database
        await queryPromise(sql, values);

        // ==========================================
        // 2. UPDATE EXTERNAL 'tables' STATUS TO 2 (RESERVED)
        // ==========================================
        if (tableStr) {
            try {
                const companyCode = await getCompanyCode();
                
                // Split selected tables into an array (e.g. "10, 20" -> ['10', '20'])
                const tableArray = String(tableStr).split(',').map(t => t.trim());
                
                // Fetch ALL tables from the external API to find the exact 'id's
                const getTablesUrl = `https://pos.chulkani.com/branch/order/website/table?company_id=${companyCode}&branch_id=${parseInt(branch_id || 1)}`;
                const externalTablesRes = await axios.get(getTablesUrl);
                
                let tableRecords = [];
                if (externalTablesRes.data && externalTablesRes.data.status === true) {
                    const allExternalTables = externalTablesRes.data.data || [];
                    
                    // Filter the API response to only keep the tables the user reserved
                    tableRecords = allExternalTables.filter(apiTable => 
                        tableArray.includes(String(apiTable.table_no).trim())
                    );
                }

                // Create an array of API requests using the fetched IDs
                const updatePromises = tableRecords.map(record => {
                    // Send payload with chosen date, time, and status 2
                    const tablePayload = {
                        company_id: companyCode,
                        branch_id: parseInt(branch_id || 1),
                        table_no: record.table_no,
                        person_no: record.person_no || null,
                        status: 2,               
                        date: date,              
                        time: formattedTime      // FIX: Using the formatted time with seconds
                    };

                    // Dynamically inject the fetched table ID into the URL
                    const updateApiUrl = `https://pos.chulkani.com/branch/order/website/table/update/${record.id}`;

                    // Using POST to hit the update endpoint
                    return axios.post(
                        updateApiUrl, 
                        tablePayload,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            timeout: 15000
                        }
                    );
                });

                // Execute all table update requests simultaneously
                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                    console.log(`External API: Tables [${tableRecords.map(t => t.table_no).join(', ')}] status updated to 2 via /update/<id> endpoint.`);
                } else {
                    console.warn(`Could not find external IDs for tables: ${tableStr}`);
                }

            } catch (apiError) {
                // To help debug if it fails, log the exact validation errors from Laravel
                if (apiError.response && apiError.response.data) {
                    console.error("Error updating external tables API (422 Details):", JSON.stringify(apiError.response.data, null, 2));
                } else {
                    console.error("Error updating external tables API:", apiError.message);
                }
            }
        }

        // Respond success to the frontend
        res.status(201).json({ message: "Reservation created successfully" });

    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==========================================
// 6. READ ALL RESERVATIONS
// ==========================================
router.get('/list', (req, res) => {
    const sql = "SELECT * FROM reservation ORDER BY date DESC, time ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// 7. DELETE RESERVATION
// ==========================================
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM reservation WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

// ==========================================
// 8. UPDATE RESERVATION (FIXED WITH DB SANITIZATION)
// ==========================================
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_id, name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        // Extremely strictly cast integers to prevent strict mode crashes in MySQL
        const safeBranchId = (branch_id === "" || branch_id === null) ? null : parseInt(branch_id);
        const safeGuestNum = (guest_number === "" || guest_number === null) ? 0 : parseInt(guest_number);

        const sql = `
            UPDATE reservation 
            SET branch_id=?, name=?, phone=?, guest_number=?, event_name=?, notes=?, date=?, time=?, table_number=?
            WHERE id=?`;
            
        const values = [safeBranchId, name, phone, safeGuestNum, event_name, notes, date, time, tableStr, id];

        await queryPromise(sql, values);
        res.json({ message: "Updated successfully" });

    } catch (error) {
        console.error("Update DB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;