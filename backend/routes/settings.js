const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. GET Current Company Code
router.get('/', (req, res) => {
    const sql = "SELECT company_code FROM settings WHERE id = 1";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result[0] || { company_code: '' });
    });
});

// 2. UPDATE or INSERT Company Code (Fixes the issue)
router.post('/update', (req, res) => {
    const { company_code } = req.body;
    
    // This logic says: "Try to insert ID 1. If ID 1 already exists, just update the company_code."
    const sql = `
        INSERT INTO settings (id, company_code) 
        VALUES (1, ?) 
        ON DUPLICATE KEY UPDATE company_code = VALUES(company_code)
    `;
    
    db.query(sql, [company_code], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ message: "Company Code saved successfully!" });
    });
});

module.exports = router;