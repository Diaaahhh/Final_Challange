const express = require('express');
const router = express.Router();
const db = require('../db'); 
const axios = require('axios');

// --- HELPER: Get Company Code ---
const getCompanyCode = () => {
    return new Promise((resolve, reject) => {
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";
        db.query(settingsSql, (err, result) => {
            if (err) return reject(err);
            const code = result[0]?.company_code || '26672691'; 
            resolve(code);
        });
    });
};

// 1. GET BRANCH LIST 
router.get('/branches', async (req, res) => {
    try {

        // Get company code from settings
        const settingsResult = await new Promise((resolve, reject) => {
            db.query(
                "SELECT company_code FROM settings WHERE id = 1",
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        const companyCode =
            settingsResult[0]?.company_code;

        if (!companyCode) {
            return res.json([]);
        }

        // Fetch branches from local table
        const branches = await new Promise((resolve, reject) => {
            db.query(
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
                AND status = 1
                ORDER BY branch_name ASC
                `,
                [companyCode],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        return res.json(branches);

    } catch (error) {

        console.error(
            "Error fetching branches for menu:",
            error.message
        );

        return res.json([]);
    }
}); 

//2. GET CATEGORIES
const queryDb = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params || [], (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

router.get('/categories/:branchId', async (req, res) => {
    try {
        const branchId = req.params.branchId;
        const companyCode = await getCompanyCode();

        const apiUrl = `https://pos.khabartable.com/company/menu-category/${companyCode}/${branchId}`;

        console.log(`[CATEGORY SYNC] Fetching categories from POS`);

        const response = await axios.get(apiUrl, {
            headers: {
                Accept: "application/json"
            }
        });

        // Detect Laravel Login Page
        if (
            typeof response.data === "string" &&
            response.data.includes("<!doctype html>")
        ) {
            throw new Error("Laravel block");
        }

        let apiCategories = [];

        if (
            response.data &&
            response.data.status === true &&
            Array.isArray(response.data.data)
        ) {
            apiCategories = response.data.data;
        } else if (Array.isArray(response.data)) {
            apiCategories = response.data;
        }

        // =========================================
        // SYNC POS -> LOCAL DATABASE
        // =========================================
        if (apiCategories.length > 0) {

            const localCategories = await queryDb(`
                SELECT
                    id,
                    mc_menu_name,
                    mc_parent_id,
                    mc_status
                FROM menu_category
            `);

            const localMap = new Map();

            localCategories.forEach(item => {
                localMap.set(Number(item.id), item);
            });

            const insertValues = [];
            const updateQueries = [];

            for (const category of apiCategories) {

                const categoryId = Number(category.id);

                // NEW CATEGORY
                if (!localMap.has(categoryId)) {

                    insertValues.push([
                        categoryId,
                        category.menu_name,
                        category.parent_id,
                        category.status,
                        category.create_by,
                        category.created_at,
                        category.updated_at
                    ]);

                } else {

                    const dbCategory = localMap.get(categoryId);

                    const needsUpdate =
                        dbCategory.mc_menu_name !== category.menu_name ||
                        Number(dbCategory.mc_parent_id || 0) !== Number(category.parent_id || 0) ||
                        Number(dbCategory.mc_status) !== Number(category.status);

                    if (needsUpdate) {

                        updateQueries.push({
                            sql: `
                                UPDATE menu_category
                                SET
                                    mc_menu_name = ?,
                                    mc_parent_id = ?,
                                    mc_status = ?,
                                    mc_create_by = ?,
                                    mc_updated_at = ?
                                WHERE id = ?
                            `,
                            params: [
                                category.menu_name,
                                category.parent_id,
                                category.status,
                                category.create_by,
                                category.updated_at,
                                categoryId
                            ]
                        });
                    }
                }
            }

            // =========================================
            // BULK INSERT
            // =========================================
            if (insertValues.length > 0) {

                await queryDb(
                    `
                    INSERT INTO menu_category (
                        id,
                        mc_menu_name,
                        mc_parent_id,
                        mc_status,
                        mc_create_by,
                        mc_created_at,
                        mc_updated_at
                    )
                    VALUES ?
                    `,
                    [insertValues]
                );

                console.log(
                    `[CATEGORY SYNC] Inserted ${insertValues.length} categories`
                );
            }

            // =========================================
            // EXECUTE UPDATES
            // =========================================
            for (const update of updateQueries) {
                await queryDb(update.sql, update.params);
            }

            if (updateQueries.length > 0) {
                console.log(
                    `[CATEGORY SYNC] Updated ${updateQueries.length} categories`
                );
            }
        }

        // =========================================
        // RETURN FROM LOCAL DATABASE
        // =========================================
        const categories = await queryDb(`
            SELECT
                id,
                mc_menu_name AS menu_name,
                mc_parent_id AS parent_id,
                mc_status AS status,
                mc_create_by AS create_by,
                mc_created_at AS created_at,
                mc_updated_at AS updated_at
            FROM menu_category
            WHERE mc_status = 1
            ORDER BY mc_menu_name ASC
        `);

        return res.json(categories);

    } catch (error) {

        console.error(
            "[CATEGORY SYNC ERROR]",
            error.message
        );

        try {

            // Fallback: Local DB only
            const categories = await queryDb(`
                SELECT
                    id,
                    mc_menu_name AS menu_name,
                    mc_parent_id AS parent_id,
                    mc_status AS status,
                    mc_create_by AS create_by,
                    mc_created_at AS created_at,
                    mc_updated_at AS updated_at
                FROM menu_category
                WHERE mc_status = 1
                ORDER BY mc_menu_name ASC
            `);

            return res.json(categories);

        } catch (dbError) {

            console.error(
                "[CATEGORY DB FALLBACK ERROR]",
                dbError.message
            );

            return res.json([]);
        }
    }
});




// 3. GET MENU LIST (LOCAL DATABASE ONLY)
router.get('/list', async (req, res) => {
    try {

        const sql = `
            SELECT *
            FROM menu
            ORDER BY m_menu_name ASC
        `;

        db.query(sql, (err, results) => {

            if (err) {
                console.error(
                    "[MENU LIST ERROR]",
                    err.message
                );

                return res.status(500).json({
                    error: "Failed to fetch menu list"
                });
            }

            return res.json(results);
        });

    } catch (error) {

        console.error(
            "[MENU LIST ERROR]",
            error.message
        );

        return res.status(500).json({
            error: "Failed to fetch menu list"
        });
    }
});

module.exports = router;