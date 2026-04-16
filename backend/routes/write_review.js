const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection file

// Endpoint: POST /api/write-review
router.post('/write-review', (req, res) => {
    const { name, review_text, rating } = req.body;

    // Simple Validation
    if (!review_text || !rating) {
        return res.status(400).json({ message: "Review text and rating are required." });
    }

    // STEP 0: Fetch company_code from the settings table
    const settingsSql = "SELECT company_code FROM settings LIMIT 1";

    db.query(settingsSql, (settingsErr, settingsResult) => {
        if (settingsErr) {
            console.error("Settings Fetch Error:", settingsErr);
            return res.status(500).json({ message: "Database error while fetching settings" });
        }

        // Safely extract the company code (default to null if settings is empty)
        const companyCode = settingsResult.length > 0 ? settingsResult[0].company_code : null;

        // STEP 1: Insert the new review including the fetched company_code
        const sql = "INSERT INTO review (company_code, name, review_text, rating) VALUES (?, ?, ?, ?)";
        const values = [companyCode, name || "Anonymous", review_text, rating];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error saving review:", err);
                return res.status(500).json({ message: "Database error" });
            }
            return res.status(201).json({ message: "Review submitted successfully!" });
        });
    });
});

module.exports = router;