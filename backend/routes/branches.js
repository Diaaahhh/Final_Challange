const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios'); // Requires: npm install axios

router.get('/', (req, res) => {
    const sql = "SELECT * FROM settings WHERE id = 1";

    db.query(sql, async (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        if (!result || result.length === 0) {
            return res.json({ status: false, message: "Settings not found" });
        }

        const branchId = result[0].branch_id;
        const soft_api_key = result[0].api_key;

        if (!soft_api_key) {
            return res.json({ status: false, message: "API Key missing" });
        }

        try {
            // If branchId exists, get that specific branch. Otherwise get all branches for the company.
            const urlPath = branchId ? `/${branchId}` : '';
            const apiUrl = `https://pos.chulkani.com/company/all-branch-list${urlPath}?soft_api_key=${soft_api_key}`;

            const apiResponse = await axios.get(apiUrl);
            return res.json(apiResponse.data);

        } catch (error) {
            console.error("External API Error:", error.message);
            return res.status(502).json({ status: false, message: "External API error" });
        }
    });
});
// Changed to POST to receive inputs from the frontend
router.post('/verify', async (req, res) => {
    const { api_key, code } = req.body;

    if (!api_key) {
        return res.json({
            status: false,
            message: "API Key is required"
        });
    }

    try {
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list?soft_api_key=${api_key}`;
        const apiResponse = await axios.get(apiUrl);
        const data = apiResponse.data;

        // ❌ External API rejected the request
        if (data.status !== true) {
            return res.json({
                status: false,
                message: data.message,
                data: []
            });
        }

        // ✅ External API returned success
            if (data.status === true && data.data) {
                let isMatch = false;
                let finalBranchId = null;
                let finalCompanyCode = null;

                // 1. If type is "branch"
                if (data.type === "branch") {
                    // CHANGED: If code is empty (!code) OR if it matches, accept it
                    if (!code || String(code) === String(data.data.branch_id)) {
                        isMatch = true;
                        finalBranchId = data.data.branch_id; 
                        finalCompanyCode = data.data.company_id;
                    }
                } 
               // 2. If type is "company"
            else if (data.type === "company") {
                // Safely extract company ID if data is an array
                let compId = null;
                if (Array.isArray(data.data) && data.data.length > 0) {
                    compId = data.data[0].company_id || data.data[0].id;
                } else if (!Array.isArray(data.data)) {
                    compId = data.data.company_id || data.data.id;
                }

                // If code is empty (!code) OR if it matches, accept it
                if (!code || String(code) === String(compId)) {
                    isMatch = true;
                    finalBranchId = null; 
                    finalCompanyCode = compId;
                }
            }

               // 🔥 MATCH FOUND: Update Local Database
                if (isMatch) {
                    // Upgraded to UPSERT so it saves even if the database table is completely empty
                    const updateSql = `
                        INSERT INTO settings (id, api_key, branch_id, company_code)
                        VALUES (1, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            api_key = VALUES(api_key), 
                            branch_id = VALUES(branch_id), 
                            company_code = VALUES(company_code)
                    `;

                    db.query(updateSql, [api_key, finalBranchId, finalCompanyCode], (err) => {
                        if (err) console.error("DB update error:", err);
                    });

                    return res.json({
                        status: true,
                        message: "Connected", // Success message
                        data: data.data
                    });
                }
                // ❌ MATCH FAILED
                else {
                    return res.json({
                        status: false,
                        message: "wrong company code or branch id"
                    });
                }
            }

    } catch (error) {
        console.error("External API Error:", error.message);
        return res.status(502).json({
            status: false,
            message: "External API error"
        });
    }
});

module.exports = router;