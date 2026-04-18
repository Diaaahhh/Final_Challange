const express = require('express');
const router = express.Router();
const db = require('../db'); 

// Helper function to wrap db.query in Promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
// 1. GET Current Settings
router.get('/', (req, res) => {
    // Select all the columns from the settings table
    const sql = `
        SELECT 
            company_code,
            branch_id, 
            delivery_charge, 
            rest_open, 
            rest_close, 
            table_prelock_duration,
            otp,
            captcha, 
            api_key 
        FROM settings 
        WHERE id = 1
    `;
    
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        
        // Provide sensible defaults if the row doesn't exist yet
        return res.json(result[0] || { 
            company_code: '', 
            branch_id: '',
            delivery_charge: 100,
            rest_open: '10:00:00',
            rest_close: '22:00:00',
            table_prelock_duration: 30,
            otp: 0,
            captcha: 0
        });
    });
});

// 2. UPDATE or INSERT Settings 
router.post('/update', (req, res) => {
    const { 
        branch_id,
        delivery_charge, 
        rest_open, 
        rest_close, 
        table_prelock_duration,
        otp,
        captcha,
        api_key   
    } = req.body;
    
    // Default delivery charge to 0 if an empty string or invalid number is passed
    const safeDeliveryCharge = parseInt(delivery_charge, 10) || 0;
    
    // Default prelock duration to 30 mins if empty or invalid
    const safeTablePrelock = parseInt(table_prelock_duration, 10) || 0;

    // Ensure OTP and Captcha are strictly 0 or 1 before hitting the DB
    const safeOtp = otp === 1 ? 1 : 0;
    const safeCaptcha = captcha === 1 ? 1 : 0;

    // Notice: company_code is completely removed. 
    // This safely updates all other fields while leaving company_code completely untouched!
    const sql = `
        INSERT INTO settings (
            id, 
            branch_id,
            delivery_charge, 
            rest_open, 
            rest_close, 
            table_prelock_duration,
            otp,
            captcha, 
            api_key
        ) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
            branch_id = VALUES(branch_id),
            delivery_charge = VALUES(delivery_charge),
            rest_open = VALUES(rest_open),
            rest_close = VALUES(rest_close),
            table_prelock_duration = VALUES(table_prelock_duration),
            otp = VALUES(otp),
            captcha = VALUES(captcha),
            api_key = VALUES(api_key)
    `;
    
    // Exactly 8 values to match the 8 question mark (?) placeholders above
    const values = [
        branch_id,
        safeDeliveryCharge, 
        rest_open, 
        rest_close, 
        safeTablePrelock,
        safeOtp,
        safeCaptcha,
        api_key   
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json(err);
        }
        return res.json({ message: "Settings updated successfully" });
    });
});

// GET Theme Setting
router.get('/get-theme', async (req, res) => {
    try {
        const sql = "SELECT theme_id FROM settings WHERE id = 1";
        const result = await queryPromise(sql);
        
        if (result && result.length > 0) {
            res.json({ success: true, theme_id: result[0].theme_id });
        } else {
            res.json({ success: true, theme_id: 1 }); // Default fallback
        }
    } catch (error) {
        console.error("Error fetching theme:", error);
        res.status(500).json({ success: false, theme_id: 1 });
    }
});
module.exports = router;