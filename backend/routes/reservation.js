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

        // 2. We will auto-expire ALL pending reservations older than 30 minutes across the database FIRST
        // This solves the timezone issue by letting MySQL handle the time calculation natively.
        const expireSql = `
            UPDATE reservation 
            SET re_status = 3 
            WHERE re_status = 0 
            AND re_create_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        `;
        await queryPromise(expireSql);

        // 3. NOW fetch LOCAL reservations for this branch (data will be fresh with correct statuses)
        const reservations = await queryPromise(
            "SELECT * FROM reservation WHERE re_com_id = ? AND re_branch_id = ?", 
            [companyCode, branch_id]
        );

        // Normalize chosenTime to guarantee it is strictly "HH:MM" format (e.g., "14:30:00" -> "14:30")
        const normalizedChosenTime = chosenTime.substring(0, 5);

        // 4. Process each table to determine availability
        const processedTables = tables.map(table => {
            let { id, table_no, capacity, person_no } = table;
            const stringTableNo = String(table_no).trim();
            
            // Assume table is available by default
            let isAvailable = true;
            let bookingMessage = null;

            // Find all local reservations belonging to this specific table
            const tableReservations = reservations.filter(res => {
                if (!res.re_table_no) return false;
                const resTables = String(res.re_table_no).split(',').map(t => t.trim());
                return resTables.includes(stringTableNo);
            });

            // Loop through the reservations to check for conflicts
            for (const res of tableReservations) {
                let resDate = "";
                let resTime = "";
                
                // Extract Date and strictly formatted HH:MM Time from the database
                if (res.re_date instanceof Date) {
                    const y = res.re_date.getFullYear();
                    const m = String(res.re_date.getMonth() + 1).padStart(2, '0');
                    const d = String(res.re_date.getDate()).padStart(2, '0');
                    resDate = `${y}-${m}-${d}`;

                    const hr = String(res.re_date.getHours()).padStart(2, '0');
                    const min = String(res.re_date.getMinutes()).padStart(2, '0');
                    resTime = `${hr}:${min}`;
                } else if (res.re_date && typeof res.re_date === 'string') {
                    const parts = res.re_date.split(/T|\s/);
                    resDate = parts[0];
                    if (parts[1]) {
                        resTime = parts[1].substring(0, 5); // Extracts just the "HH:MM"
                    }
                }

                // --- AVAILABILITY CHECK ---
                // We only block the table if status is 0 (Pending) or 1 (Confirmed)
                // AND the normalized date and time match exactly.
                if ((res.re_status === 0 || res.re_status === 1) && resDate === chosenDate && resTime <=normalizedChosenTime) {
                    isAvailable = false;
                    bookingMessage = res.re_status === 0 
                        ? `Pending Confirmation` 
                        : `Reserved`;
                    break; // Conflict found, block the table immediately
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
        const { branch_id, date, time, table_number, customer_id, duration, advance_payment, re_adv_payment } = req.body;

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        // Extremely strictly cast integers to prevent strict mode crashes in MySQL
        const safeBranchId = (branch_id === "" || branch_id === null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration); // Default to 90 mins
        
        // --- NEW: Handle Advance Payment Safely ---
        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        // Ensure time has seconds appended (HH:MM -> HH:MM:SS) for Laravel validation & MySQL DATETIME
        let formattedTime = time;
        if (formattedTime && formattedTime.split(':').length === 2) {
            formattedTime = `${formattedTime}:00`;
        }

        // Combine date and formattedTime for the new DATETIME column `re_date` (e.g., '2026-03-22 14:30:00')
        let dateTimeString = null;
        if (date && formattedTime) {
            dateTimeString = `${date} ${formattedTime}`;
        }

        // We need the company code earlier now because it goes into the local DB
        const companyCode = await getCompanyCode();

        // New SQL Statement matching the updated schema including re_adv_payment
        const sql = `
            INSERT INTO reservation 
            (re_com_id, re_branch_id, re_table_no, re_customer_id, re_date, re_duration, re_status, re_adv_payment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        // Defaulting re_status to 0
        const values = [companyCode, safeBranchId, tableStr, safeCustomerId, dateTimeString, safeDuration, 0, safeAdvPayment];

        // 1. Save to local database
        await queryPromise(sql, values);

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
    // Changed from ORDER BY re_date DESC to ORDER BY id DESC to prevent missing column crashes
    const sql = "SELECT * FROM reservation ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error in /list:", err.message); // This will tell you exactly what MySQL is complaining about
            return res.status(500).json({ error: err.message });
        }
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
        
        // Updated to extract only the fields relevant to the new table structure
const { branch_id, table_number, customer_id, date, time, duration, status, advance_payment, re_adv_payment } = req.body;
        // Process table numbers into a comma-separated string
        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        // Extremely strictly cast integers to prevent strict mode crashes in MySQL
        const safeBranchId = (branch_id === "" || branch_id == null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration);
        const safeStatus = (status === "" || status == null) ? 0 : parseInt(status);

        // --- NEW: Handle Advance Payment Safely ---
        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        // Ensure time has seconds appended (HH:MM -> HH:MM:SS) for MySQL DATETIME compatibility
        let dateTimeString = null;
        if (date && time) {
            let formattedTime = time;
            if (formattedTime.split(':').length === 2) {
                formattedTime = `${formattedTime}:00`;
            }
            // Combine into 'YYYY-MM-DD HH:MM:SS'
            dateTimeString = `${date} ${formattedTime}`;
        }

        // Updated SQL matching the new column names
       const sql = `
            UPDATE reservation 
            SET 
                re_branch_id = ?, 
                re_table_no = ?, 
                re_customer_id = ?, 
                re_date = ?, 
                re_duration = ?, 
                re_status = ?,
                re_adv_payment = ?
            WHERE id = ?`;
            
        const values = [
            safeBranchId, 
            tableStr, 
            safeCustomerId, 
            dateTimeString, 
            safeDuration, 
            safeStatus, 
            safeAdvPayment,
            id
        ];

        await queryPromise(sql, values);
        res.json({ message: "Updated successfully" });

    } catch (error) {
        console.error("Update DB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;