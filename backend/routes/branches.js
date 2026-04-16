const express = require('express');

const router = express.Router();

const db = require('../db');

const axios = require('axios'); // Requires: npm install axios



router.get('/', (req, res) => {

    const sql = "SELECT * FROM settings WHERE id = 1";

    db.query(sql, async (err, result) => {

        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        const branchId = result[0]?.branch_id;
        const soft_api_key = result[0]?.api_key;

        if (!branchId || !soft_api_key) {
            return res.json({
                status: false,
                message: "Branch ID or API Key missing"
            });
        }

        try {
            const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${branchId}?soft_api_key=${soft_api_key}`;

            const apiResponse = await axios.get(apiUrl);
            const data = apiResponse.data;

            // ❌ Invalid API or ID
            if (!data.status) {
                return res.json({
                    status: false,
                    message: data.message,
                    data: []
                });
            }

            // ✅ SUCCESS CASE
            if (data.status === true && data.data) {

                const branchData = data.data;

                const branch_id = branchData.branch_id;
                const company_id = branchData.company_id;

                // 🔥 UPDATE DB WITH VERIFIED DATA
                const updateSql = `
                    UPDATE settings 
                    SET branch_id = ?, company_code = ?
                    WHERE id = 1
                `;

                db.query(updateSql, [branch_id, company_id], (err) => {
    if (err) {
        console.error("DB update error:", err);
    }
});

                return res.json({
                    status: true,
                    message: data.message,
                    data: branchData
                });
            }

        } catch (error) {
            return res.status(502).json({
                status: false,
                message: "External API error"
            });
        }
    });
});



module.exports = router;