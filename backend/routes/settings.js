const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. GET Current Settings
router.get('/', (req, res) => {
    const sql = "SELECT company_code, delivery_charge FROM settings WHERE id = 1";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result[0] || { company_code: '', delivery_charge: 100 });
    });
});

// 2. UPDATE or INSERT Settings 
router.post('/update', (req, res) => {
    const { company_code, delivery_charge } = req.body;
    
    // Default delivery charge to 0 if an empty string or invalid number is passed
    const safeDeliveryCharge = parseInt(delivery_charge, 10) || 0;

    // This logic updates both the company code and the delivery charge
    const sql = `
        INSERT INTO settings (id, company_code, delivery_charge) 
        VALUES (1, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        company_code = VALUES(company_code),
        delivery_charge = VALUES(delivery_charge)
    `;
    
    db.query(sql, [company_code, safeDeliveryCharge], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ message: "Settings saved successfully!" });
    });
});

module.exports = router;