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
// TABLE SYNC
// ==========================================
const syncTables = async () => {

    try {

        console.log("================================");
        console.log("TABLE CRON STARTED");
        console.log("================================");

        // ======================================
        // SETTINGS
        // ======================================

        const settings =
            await getSettings();

        const company_id =
            settings.company_code;

        if (!company_id) {
            throw new Error(
                "Company ID missing"
            );
        }

        // ======================================
        // LOCAL BRANCHES
        // ======================================

        const branches =
            await queryDb(`
                SELECT branch_id
                FROM branches
            `);

        if (!branches.length) {
            throw new Error(
                "No branches found"
            );
        }

        // ======================================
        // LOCAL TABLES
        // ======================================

        const localTables =
            await queryDb(`
                SELECT *
                FROM tables
            `);

        const localTableMap =
            new Map();

        localTables.forEach(table => {

            localTableMap.set(
                Number(table.id),
                table
            );

        });

        const apiTableIds = [];

        // ======================================
        // LOOP ALL BRANCHES
        // ======================================

        for (const branch of branches) {

            const branch_id =
                branch.branch_id;

            const apiUrl =
                `https://pos.khabartable.com/branch/order/website/table?company_id=${company_id}&branch_id=${branch_id}`;

            console.log(
                `Fetching tables for branch ${branch_id}`
            );

            const response =
                await axios.get(apiUrl, {
                    headers: {
                        Accept: "application/json"
                    }
                });

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
                    `Invalid response for branch ${branch_id}`
                );
            }

            const apiTables =
                Array.isArray(response.data.data)
                    ? response.data.data
                    : [];

            console.log(
                `Branch ${branch_id}: ${apiTables.length} table(s)`
            );

            // ==================================
            // INSERT / UPDATE
            // ==================================

            for (const table of apiTables) {

                const tableId =
                    Number(table.id);

                apiTableIds.push(
                    tableId
                );

                const localTable =
                    localTableMap.get(
                        tableId
                    );

                // ==============================
                // INSERT
                // ==============================

                if (!localTable) {

                    await queryDb(`
                        INSERT INTO tables (
                            id,
                            create_by,
                            company_id,
                            branch_id,
                            table_no,
                            person_no,
                            created_at,
                            updated_at,
                            status,
                            date,
                            time
                        )
                        VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                        )
                    `, [
                        table.id,
                        table.create_by,
                        table.company_id,
                        table.branch_id,
                        table.table_no,
                        table.person_no,
                        table.created_at,
                        table.updated_at,
                        table.status,
                        table.date,
                        table.time
                    ]);

                    console.log(
                        `Inserted table ${table.table_no}`
                    );
                }

                // ==============================
                // UPDATE
                // ==============================

                else {

                    const needsUpdate =
                        Number(localTable.create_by || 0) !== Number(table.create_by || 0) ||
                        Number(localTable.company_id || 0) !== Number(table.company_id || 0) ||
                        Number(localTable.branch_id || 0) !== Number(table.branch_id || 0) ||
                        String(localTable.table_no || "") !== String(table.table_no || "") ||
                        Number(localTable.person_no || 0) !== Number(table.person_no || 0) ||
                        String(localTable.created_at || "") !== String(table.created_at || "") ||
                        String(localTable.updated_at || "") !== String(table.updated_at || "") ||
                        Number(localTable.status || 0) !== Number(table.status || 0) ||
                        String(localTable.date || "") !== String(table.date || "") ||
                        String(localTable.time || "") !== String(table.time || "");

                    if (needsUpdate) {

                        await queryDb(`
                            UPDATE tables
                            SET
                                create_by = ?,
                                company_id = ?,
                                branch_id = ?,
                                table_no = ?,
                                person_no = ?,
                                created_at = ?,
                                updated_at = ?,
                                status = ?,
                                date = ?,
                                time = ?
                            WHERE id = ?
                        `, [
                            table.create_by,
                            table.company_id,
                            table.branch_id,
                            table.table_no,
                            table.person_no,
                            table.created_at,
                            table.updated_at,
                            table.status,
                            table.date,
                            table.time,
                            table.id
                        ]);

                        console.log(
                            `Updated table ${table.table_no}`
                        );
                    }
                }
            }
        }

        // ======================================
        // DELETE REMOVED TABLES
        // ======================================

        for (const localTable of localTables) {

            if (
                !apiTableIds.includes(
                    Number(localTable.id)
                )
            ) {

                await queryDb(`
                    DELETE FROM tables
                    WHERE id = ?
                `, [
                    localTable.id
                ]);

                console.log(
                    `Deleted table ${localTable.table_no}`
                );
            }
        }

        console.log("================================");
        console.log("TABLE CRON COMPLETED");
        console.log("================================");

    } catch (error) {

        console.error(
            "TABLE CRON ERROR:",
            error.message
        );
    }
};

// ==========================================
// RUN
// ==========================================
// syncTables();

module.exports = syncTables;