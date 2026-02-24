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
            // Default to '26672691' if DB is empty based on previous config
            const code = result[0]?.company_code || '26672691'; 
            resolve(code);
        });
    });
};

// ==========================================
// 1. GET User by Phone Number (NEW)
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
        console.error("Database Error:", err);
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
        const response = await axios.get(apiUrl);
        
        let branches = [];
        if (response.data && response.data.data && response.data.data.branches) {
            branches = response.data.data.branches;
        } else if (Array.isArray(response.data)) {
            branches = response.data;
        }
        res.json(branches);
    } catch (error) {
        console.error("Branch Fetch Error:", error.message);
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
        console.error("Table Fetch Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// 4. CREATE NEW RESERVATION
// ==========================================
router.post('/create', (req, res) => {
    const { name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

    if (!name || !phone || !date || !time || !guest_number) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }

    let tableStr = null;
    if (table_number) {
        tableStr = Array.isArray(table_number) ? table_number.join(", ") : table_number;
    }

    const sql = `INSERT INTO reservation (name, phone, guest_number, event_name, notes, date, time, table_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [name, phone, guest_number, event_name, notes, date, time, tableStr];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Reservation created successfully", id: result.insertId });
    });
});

// ==========================================
// 5. READ ALL RESERVATIONS
// ==========================================
router.get('/list', (req, res) => {
    const sql = "SELECT * FROM reservation ORDER BY date DESC, time ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// 6. DELETE RESERVATION
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
// 7. UPDATE RESERVATION
// ==========================================
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

    let tableStr = null;
    if (table_number) {
        tableStr = Array.isArray(table_number) ? table_number.join(", ") : table_number;
    }

    const sql = `
        UPDATE reservation 
        SET name=?, phone=?, guest_number=?, event_name=?, notes=?, date=?, time=?, table_number=?
        WHERE id=?`;
    const values = [name, phone, guest_number, event_name, notes, date, time, tableStr, id];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated successfully" });
    });
});

module.exports = router;