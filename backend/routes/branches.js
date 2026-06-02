const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios'); // Requires: npm install axios
const syncBranches = require('./Cron Jobs/branch_cron')
const queryDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

router.get('/', async (req, res) => {

    try {
 console.log(
        "GET /branches",
        new Date().toISOString()
    );
        await syncBranches();
        const settingsRows = await queryDb(
            "SELECT company_code FROM settings WHERE id = 1"
        );

        if (!settingsRows.length) {
            return res.json([]);
        }

        const companyCode =
            settingsRows[0].company_code;

        const branches =
            await queryDb(
                `
                SELECT
                    id,
                    branch_id,
                    branch_name,
                    name,
                    email,
                    phone,
                    status,
                    company_id
                FROM branches
                WHERE company_id = ?
                ORDER BY branch_name ASC
                `,
                [companyCode]
            );

        return res.json(branches);

    } catch (error) {

        console.error(
            "[BRANCH FETCH ERROR]",
            error.message
        );

        return res.json([]);
    }
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
        const apiUrl = `https://pos.khabartable.com/company/all-branch-list?soft_api_key=${api_key}`;
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
                    if (code && String(code) === String(data.data.branch_id)) {
                        isMatch = true;
                        finalBranchId = data.data.branch_id; 
                        finalCompanyCode = data.data.company_id;
                    }
                } 
               // 2. If type is "company"
            else if (data.type === "company") {
    let compId = null;

    // ✅ Correct extraction
    if (data.data?.company?.company_id) {
        compId = data.data.company.company_id;
    }

    if (code && String(code) === String(compId)) {
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