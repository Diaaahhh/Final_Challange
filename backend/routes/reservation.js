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

        // --- NEW: Fetch table_prelock_duration from settings ---
        const settingsRes = await queryPromise("SELECT table_prelock_duration FROM settings WHERE id = 1");
        let table_prelock_duration = 30; // default 30 mins
        if (settingsRes && settingsRes.length > 0) {
            table_prelock_duration = parseInt(settingsRes[0].table_prelock_duration, 10) || 30;
        }

        // 1. Fetch ALL physical tables from External API
        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${companyCode}&branch_id=${branch_id}`);
        
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 2. We will auto-expire ALL pending reservations older than 30 minutes across the database FIRST
        const expireSql = `
            UPDATE reservation 
            SET re_status = 3 
            WHERE re_status = 0 
            AND re_create_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        `;
        await queryPromise(expireSql);

        // 3. NOW fetch LOCAL reservations for this branch
        const reservations = await queryPromise(
            "SELECT * FROM reservation WHERE re_com_id = ? AND re_branch_id = ?", 
            [companyCode, branch_id]
        );

        // Normalize chosenTime to guarantee it is strictly "HH:MM" format
        const normalizedChosenTime = chosenTime.substring(0, 5);

        // 4. Process each table to determine availability
        const processedTables = tables.map(table => {
            let { id, table_no, capacity, person_no } = table;
            const stringTableNo = String(table_no).trim();
            
            let isAvailable = true;
            let bookingMessage = null;

            const tableReservations = reservations.filter(res => {
                if (!res.re_table_no) return false;
                const resTables = String(res.re_table_no).split(',').map(t => t.trim());
                return resTables.includes(stringTableNo);
            });

            for (const res of tableReservations) {
                let resDate = "";
                let resTime = "";
                
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
                        resTime = parts[1].substring(0, 5);
                    }
                }

                // We only block the table if status is 0 or 1
                if ((res.re_status === 0 || res.re_status === 1) && resDate === chosenDate) {
                    
                    // --- NEW: Convert strings to minutes for mathematical comparison ---
                    const [resH, resM] = resTime.split(':').map(Number);
                    const resTimeMins = (resH * 60) + resM;
                    
                    const [choH, choM] = normalizedChosenTime.split(':').map(Number);
                    const chosenTimeMins = (choH * 60) + choM;

                    // Execute exactly your required logic converted to total minutes
                    if (resTimeMins - table_prelock_duration <= chosenTimeMins) {
                        isAvailable = false;
                        bookingMessage = res.re_status === 0 
                            ? `Pending Confirmation` 
                            : `Reserved`;
                        break;
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

        const companyCode = await getCompanyCode();

        // --- NEW: Time Validation against Settings API security fallback ---
        const settingsSql = "SELECT rest_open, rest_close FROM settings WHERE id = 1";
        const settingsResult = await queryPromise(settingsSql);
        
        if (settingsResult && settingsResult.length > 0) {
            const { rest_open, rest_close } = settingsResult[0];
            
            if (rest_open && rest_close) {
                const now = new Date();
                const currentTotal = now.getHours() * 60 + now.getMinutes();

                const [openH, openM] = rest_open.split(':').map(Number);
                const openTotal = openH * 60 + openM;

                const [closeH, closeM] = rest_close.split(':').map(Number);
                const closeTotal = closeH * 60 + closeM;

                let isOpen = false;
                if (closeTotal > openTotal) {
                    isOpen = currentTotal >= openTotal && currentTotal <= closeTotal;
                } else {
                    isOpen = currentTotal >= openTotal || currentTotal <= closeTotal;
                }

                if (!isOpen) {
                   // NEW: Formats "13:00:00" to "1:00 pm"
                    const formatTimeAMPM = (timeString) => {
                        const [hourString, minute] = timeString.split(':');
                        let hour = parseInt(hourString, 10);
                        const ampm = hour >= 12 ? 'pm' : 'am';
                        hour = hour % 12 || 12; // Convert 0 to 12
                        return `${hour}:${minute} ${ampm}`;
                    };

                    return res.status(400).json({ 
                        error: `The restaurant remains open from ${formatTimeAMPM(rest_open)} to ${formatTimeAMPM(rest_close)}` 
                    });
                }
            }
        }

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        const safeBranchId = (branch_id === "" || branch_id === null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration);
        
        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        let formattedTime = time;
        if (formattedTime && formattedTime.split(':').length === 2) {
            formattedTime = `${formattedTime}:00`;
        }

        let dateTimeString = null;
        if (date && formattedTime) {
            dateTimeString = `${date} ${formattedTime}`;
        }

        const sql = `
            INSERT INTO reservation 
            (re_com_id, re_branch_id, re_table_no, re_customer_id, re_date, re_duration, re_status, re_adv_payment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [companyCode, safeBranchId, tableStr, safeCustomerId, dateTimeString, safeDuration, 0, safeAdvPayment];

        await queryPromise(sql, values);

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
    const sql = "SELECT * FROM reservation ORDER BY id DESC";
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
        
        const { branch_id, table_number, customer_id, date, time, duration, status, advance_payment, re_adv_payment } = req.body;

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        const safeBranchId = (branch_id === "" || branch_id == null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration);
        const safeStatus = (status === "" || status == null) ? 0 : parseInt(status);

        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        let dateTimeString = null;
        if (date && time) {
            let formattedTime = time;
            if (formattedTime.split(':').length === 2) {
                formattedTime = `${formattedTime}:00`;
            }
            dateTimeString = `${date} ${formattedTime}`;
        }

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