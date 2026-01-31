// routes/branches.js
const express = require('express');
const router = express.Router();
const db = require('../db'); 
const axios = require('axios'); // Requires: npm install axios

router.get('/', (req, res) => {
    // 1. Get the Company Code from the 'settings' table
    const sql = "SELECT company_code FROM settings WHERE id = 1";
    
    db.query(sql, async (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        // Check if code exists
        const companyCode = result[0]?.company_code;

        if (!companyCode) {
            return res.status(404).json({ error: "Company Code not set in Settings." });
        }

        try {
            // 2. Call the External API using the code from DB
            const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
            console.log(`Fetching branches from: ${apiUrl}`); // Debug log

            const apiResponse = await axios.get(apiUrl);
            
            // 3. Send the external data back to your frontend
            return res.json(apiResponse.data);

        } catch (apiError) {
            console.error("External API Error:", apiError.message);
            return res.status(502).json({ error: "Failed to fetch data from POS system" });
        }
    });
});

module.exports = router;