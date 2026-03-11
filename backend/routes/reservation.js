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
// 3. GET TABLES BY BRANCH ID
// ==========================================
router.get('/tables/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;
        const companyCode = await getCompanyCode();
        
        const sql = "SELECT * FROM tables WHERE company_id = ? AND branch_id = ?";
        db.query(sql, [companyCode, branch_id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// 4. GET OCCUPIED TABLES (QUEUE + RESERVATION)
// ==========================================
router.get('/occupied-tables/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;
        const companyCode = await getCompanyCode();

        const queueSql = `
            SELECT table_no 
            FROM customer_order_queues 
            WHERE company_id = ? AND branch_id = ? 
              AND table_no IS NOT NULL 
              AND table_no != 'Home delivery' 
              AND table_no != 'Take a way' 
              AND table_no != 'Parcel'
        `;
        const queueResults = await queryPromise(queueSql, [companyCode, branch_id]);

        const reserveSql = `
            SELECT table_number 
            FROM reservation 
            WHERE branch_id = ? 
              AND table_number IS NOT NULL 
              AND table_number != ''
        `;
        const reserveResults = await queryPromise(reserveSql, [branch_id]);

        const occupiedSet = new Set();

        queueResults.forEach(row => {
            if (row.table_no) {
                String(row.table_no).split(',').forEach(t => {
                    const trimmed = t.trim();
                    if (trimmed) occupiedSet.add(trimmed);
                });
            }
        });

        reserveResults.forEach(row => {
            if (row.table_number) {
                String(row.table_number).split(',').forEach(t => {
                    const trimmed = t.trim();
                    if (trimmed) occupiedSet.add(trimmed);
                });
            }
        });

        res.status(200).json(Array.from(occupiedSet));
    } catch (error) {
        console.error("Error fetching occupied tables:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
        const { branch_id, name, phone, address, guest_number, event_name, notes, date, time, table_number } = req.body;

        if (!branch_id || !name || !phone || !date || !time || !guest_number || !address) {
            return res.status(400).json({ error: "Please fill in all required fields." });
        }

        const companyCode = await getCompanyCode();

        await checkAndCreateCustomer(companyCode, branch_id, name, phone, address);

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : table_number;
        }

        const sql = `INSERT INTO reservation (branch_id, name, phone, guest_number, event_name, notes, date, time, table_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [branch_id, name, phone, guest_number, event_name, notes, date, time, tableStr];

        const result = await queryPromise(sql, values);
        
        res.json({ message: "Reservation created successfully", id: result.insertId });

    } catch (error) {
        console.error("Reservation DB Error:", error);
        res.status(500).json({ error: error.message });
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