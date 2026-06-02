const axios = require("axios");
const db = require("../../db");

// ==========================================
// GET SETTINGS
// ==========================================
const getSettings = () => {
    return new Promise((resolve, reject) => {

        db.query(
            "SELECT * FROM settings WHERE id = 1",
            (err, result) => {

                if (err) {
                    return reject(err);
                }

                if (!result.length) {
                    return reject(
                        new Error("Settings not found")
                    );
                }

                resolve(result[0]);
            }
        );
    });
};

// ==========================================
// PROMISE WRAPPER
// ==========================================
const queryDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {

        db.query(sql, params, (err, result) => {

            if (err) {
                reject(err);
            } else {
                resolve(result);
            }

        });

    });
};

// ==========================================
// BRANCH SYNC
// ==========================================
const syncBranches = async () => {

    try {

        console.log("================================");
        console.log("BRANCH CRON STARTED");
        console.log("================================");

        // ==========================================
        // SETTINGS
        // ==========================================

        const settings =
            await getSettings();

        const soft_api_key =
            settings.api_key?.trim();

        if (!soft_api_key) {
            throw new Error("API Key missing");
        }
 const apiUrl =
    `https://pos.khabartable.com/company/all-branch-list/?soft_api_key=${soft_api_key}`;

        console.log("API URL:", apiUrl);

        // ==========================================
        // FETCH API
        // ==========================================

        const response =
            await axios.get(apiUrl, {
                headers: {
                    Accept: "application/json"
                }
            });

        // ==========================================
        // HTML BLOCK DETECTION
        // ==========================================

        if (
            typeof response.data === "string" &&
            response.data.includes("<!doctype html>")
        ) {
            throw new Error(
                "Laravel login page returned"
            );
        }

        if (
            !response.data ||
            response.data.status !== true
        ) {
            throw new Error(
                "Invalid API response"
            );
        }

        // ==========================================
        // NORMALIZE API DATA
        // ==========================================

        let apiBranches = [];

        if (
    response.data.type === "company" &&
    Array.isArray(response.data.data?.branches)
) {

            apiBranches =
                response.data.data.branches;

        } else if (
            response.data.type === "branch" &&
            response.data.data
        ) {

            apiBranches = [
                response.data.data
            ];

        } else {

            throw new Error(
                "No branch data found"
            );
        }

        console.log(
            `API returned ${apiBranches.length} branch(es)`
        );

        // ==========================================
        // LOCAL BRANCHES
        // ==========================================

        const localBranches =
            await queryDb(`
                SELECT *
                FROM branches
            `);

        const localBranchMap =
            new Map();

        localBranches.forEach(branch => {

            localBranchMap.set(
                Number(branch.branch_id),
                branch
            );

        });

        const apiBranchIds = [];

        // ==========================================
        // INSERT / UPDATE
        // ==========================================

        for (const branch of apiBranches) {

            const currentBranchId =
                Number(branch.branch_id);

            apiBranchIds.push(
                currentBranchId
            );

            const localBranch =
                localBranchMap.get(
                    currentBranchId
                );

            // ======================================
            // INSERT
            // ======================================

            if (!localBranch) {

                await queryDb(`
                    INSERT INTO branches (
                        branch_id,
                        branch_name,
                        name,
                        email,
                        phone,
                        status,
                        company_id
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?
                    )
                `, [
                    branch.branch_id,
                    branch.branch_name,
                    branch.name || null,
                    branch.email || null,
                    branch.phone || null,
                    branch.status,
                    branch.company_id
                ]);

                console.log(
                    `Inserted branch ${branch.branch_name}`
                );

            }

            // ======================================
            // UPDATE
            // ======================================

            else {

                const needsUpdate =
                    localBranch.branch_name !== branch.branch_name ||
                    String(localBranch.name || "") !== String(branch.name || "") ||
                    String(localBranch.email || "") !== String(branch.email || "") ||
                    String(localBranch.phone || "") !== String(branch.phone || "") ||
                    Number(localBranch.status) !== Number(branch.status) ||
                    Number(localBranch.company_id) !== Number(branch.company_id);

                if (needsUpdate) {

                    await queryDb(`
                        UPDATE branches
                        SET
                            branch_name = ?,
                            name = ?,
                            email = ?,
                            phone = ?,
                            status = ?,
                            company_id = ?
                        WHERE branch_id = ?
                    `, [
                        branch.branch_name,
                        branch.name || null,
                        branch.email || null,
                        branch.phone || null,
                        branch.status,
                        branch.company_id,
                        branch.branch_id
                    ]);

                    console.log(
                        `Updated branch ${branch.branch_name}`
                    );
                }
            }
        }

        // ==========================================
        // DELETE REMOVED BRANCHES
        // ==========================================

        for (const localBranch of localBranches) {

            if (
                !apiBranchIds.includes(
                    Number(localBranch.branch_id)
                )
            ) {

                await queryDb(`
                    DELETE FROM branches
                    WHERE branch_id = ?
                `, [
                    localBranch.branch_id
                ]);

                console.log(
                    `Deleted branch ${localBranch.branch_name}`
                );
            }
        }

        console.log("================================");
        console.log("BRANCH CRON COMPLETED");
        console.log("================================");

    } catch (error) {

        console.error(
            "BRANCH CRON ERROR:",
            error.message
        );
    }
};

// ==========================================
// RUN
// ==========================================
// syncBranches();

module.exports = syncBranches;