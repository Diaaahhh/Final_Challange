const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. GET Current Settings
router.get('/', (req, res) => {
    // Select all the columns from the settings table
    const sql = `
        SELECT 
            company_code, 
            delivery_charge, 
            rest_open, 
            rest_close, 
            table_prelock_duration 
        FROM settings 
        WHERE id = 1
    `;
    
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        
        // Provide sensible defaults if the row doesn't exist yet
        return res.json(result[0] || { 
            company_code: '', 
            delivery_charge: 100,
            rest_open: '10:00:00',
            rest_close: '22:00:00',
            table_prelock_duration: 30
        });
    });
});

// 2. UPDATE or INSERT Settings 
router.post('/update', (req, res) => {
    const { 
        company_code, 
        delivery_charge, 
        rest_open, 
        rest_close, 
        table_prelock_duration 
    } = req.body;
    
    // Default delivery charge to 0 if an empty string or invalid number is passed
    const safeDeliveryCharge = parseInt(delivery_charge, 10) || 0;
    
    // Default prelock duration to 30 mins if empty or invalid
    const safeTablePrelock = parseInt(table_prelock_duration, 10) || 0;

    // This logic updates all 5 fields
    const sql = `
        INSERT INTO settings (
            id, 
            company_code, 
            delivery_charge, 
            rest_open, 
            rest_close, 
            table_prelock_duration
        ) 
        VALUES (1, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
            company_code = VALUES(company_code),
            delivery_charge = VALUES(delivery_charge),
            rest_open = VALUES(rest_open),
            rest_close = VALUES(rest_close),
            table_prelock_duration = VALUES(table_prelock_duration)
    `;
    
    const values = [
        company_code, 
        safeDeliveryCharge, 
        rest_open, 
        rest_close, 
        safeTablePrelock
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json(err);
        }
        return res.json({ message: "Settings updated successfully" });
    });
});

module.exports = router;