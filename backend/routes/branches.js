const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios'); // Requires: npm install axios

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

        // --------------------------------------------------
        // STEP 1: SETTINGS
        // --------------------------------------------------

        const settingsRows = await queryDb(
            "SELECT * FROM settings WHERE id = 1"
        );

        if (!settingsRows.length) {
            return res.json({
                status: false,
                message: "Settings not found"
            });
        }

        const settings = settingsRows[0];

        const soft_api_key = settings.api_key;
        const branchId = settings.branch_id;
        const companyCode = settings.company_code;

        if (!soft_api_key) {
            return res.json({
                status: false,
                message: "API Key missing"
            });
        }

        // --------------------------------------------------
        // STEP 2: CALL POS
        // --------------------------------------------------

        const urlPath = branchId
            ? `/${branchId}`
            : "";

        const apiUrl =
            `https://pos.khabartable.com/company/all-branch-list${urlPath}?soft_api_key=${soft_api_key}`;

        const apiResponse = await axios.get(apiUrl);

        // --------------------------------------------------
        // STEP 3: HTML RESPONSE
        // --------------------------------------------------

        if (
            typeof apiResponse.data === "string" &&
            apiResponse.data.includes("<!doctype html>")
        ) {
            return res.send(apiResponse.data);
        }

        // --------------------------------------------------
        // STEP 4: VALID JSON
        // --------------------------------------------------

        const apiBranches =
            apiResponse.data?.data?.branches || [];

        // --------------------------------------------------
        // STEP 5: LOAD LOCAL DB
        // --------------------------------------------------

        const localBranches = await queryDb(
            `
            SELECT
                branch_id,
                branch_name,
                name,
                email,
                phone,
                status,
                company_id
            FROM branches
            `
        );

        const localMap = new Map();

        localBranches.forEach(branch => {
            localMap.set(
                Number(branch.branch_id),
                branch
            );
        });

        const insertValues = [];
        const updateQueries = [];

        // --------------------------------------------------
        // STEP 6: SYNC
        // --------------------------------------------------

        for (const branch of apiBranches) {

            const branchIdNum =
                Number(branch.branch_id);

            if (!localMap.has(branchIdNum)) {

                insertValues.push([
                    branch.branch_id,
                    branch.branch_name,
                    branch.name,
                    branch.email,
                    branch.phone,
                    branch.status,
                    branch.company_id
                ]);

            } else {

                const dbBranch =
                    localMap.get(branchIdNum);

                const needsUpdate =
                    dbBranch.branch_name !== branch.branch_name ||
                    dbBranch.name !== branch.name ||
                    dbBranch.email !== branch.email ||
                    dbBranch.phone !== branch.phone ||
                    Number(dbBranch.status) !== Number(branch.status) ||
                    Number(dbBranch.company_id) !== Number(branch.company_id);

                if (needsUpdate) {

                    updateQueries.push({
                        sql: `
                            UPDATE branches
                            SET
                                branch_name = ?,
                                name = ?,
                                email = ?,
                                phone = ?,
                                status = ?,
                                company_id = ?
                            WHERE branch_id = ?
                        `,
                        params: [
                            branch.branch_name,
                            branch.name,
                            branch.email,
                            branch.phone,
                            branch.status,
                            branch.company_id,
                            branch.branch_id
                        ]
                    });

                }
            }
        }

        // --------------------------------------------------
        // STEP 7: INSERT NEW
        // --------------------------------------------------

        if (insertValues.length > 0) {

            await queryDb(
                `
                INSERT INTO branches (
                    branch_id,
                    branch_name,
                    name,
                    email,
                    phone,
                    status,
                    company_id
                )
                VALUES ?
                `,
                [insertValues]
            );

            console.log(
                `[BRANCH SYNC] Inserted ${insertValues.length}`
            );
        }

        // --------------------------------------------------
        // STEP 8: UPDATE OLD
        // --------------------------------------------------

        for (const query of updateQueries) {
            await queryDb(
                query.sql,
                query.params
            );
        }

        if (updateQueries.length > 0) {

            console.log(
                `[BRANCH SYNC] Updated ${updateQueries.length}`
            );
        }

        // --------------------------------------------------
        // STEP 9: SEND LOCAL DB
        // --------------------------------------------------

        const finalData = await queryDb(
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

        return res.json(finalData);

    } catch (error) {

        console.error(
            "[BRANCH SYNC ERROR]",
            error.message
        );

        try {

            const settingsRows = await queryDb(
                "SELECT company_code FROM settings WHERE id = 1"
            );

            const companyCode =
                settingsRows[0]?.company_code;

            const fallbackData = await queryDb(
                `
                SELECT *
                FROM branches
                WHERE company_id = ?
                ORDER BY branch_name ASC
                `,
                [companyCode]
            );

            return res.json(fallbackData);

        } catch (dbError) {

            console.error(
                "[BRANCH DB ERROR]",
                dbError.message
            );

            return res.json([]);
        }
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