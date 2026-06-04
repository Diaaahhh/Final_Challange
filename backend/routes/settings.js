const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const db = require('../db'); 
const syncTables= require('./Cron Jobs/tables_cron')
const syncBranches = require('./Cron Jobs/branch_cron')
const syncMenus = require('./Cron Jobs/menu_cron');

// Helper function to wrap db.query in Promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
// Upload directory
const uploadDir = path.join(__dirname, '../public/uploads/logo'); 
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// POST route to upload logo
router.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filename = req.file.filename;

    // Save filename to database
    db.query("UPDATE settings SET logo = ? WHERE id = 1", [filename], (err) => {
        if (err) {
            console.error("DB Error saving logo:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Logo updated successfully", logo: filename });
    });
});

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
router.post('/update', async (req, res) => {
    await syncTables();
    await syncBranches();
        await syncMenus();
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

    // Notice: branch_id and api_key have been REMOVED from the UPDATE clause.
    // This stops the manual "Save" button from erasing your verified credentials!
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
            delivery_charge = VALUES(delivery_charge),
            rest_open = VALUES(rest_open),
            rest_close = VALUES(rest_close),
            table_prelock_duration = VALUES(table_prelock_duration),
            otp = VALUES(otp),
            captcha = VALUES(captcha)
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