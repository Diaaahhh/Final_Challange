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
        // 1. Fetch the api_key from the local settings table
        const settingsResult = await new Promise((resolve, reject) => {
            db.query("SELECT api_key FROM settings WHERE id = 1", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const soft_api_key = settingsResult[0]?.api_key;
        
        if (!soft_api_key) {
            return res.json([]); // Return empty array if no API key is set
        }

        // 2. Safely use the fetched soft_api_key
        const apiUrl = `https://pos.khabartable.com/company/all-branch-list/?soft_api_key=${soft_api_key}`;
        const response = await axios.get(apiUrl, { 
            headers: { 'Accept': 'application/json' } 
        });
        
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            return res.json([]); // Fail safely if Laravel throws an HTML error
        }

        // 3. Normalize the data so MenuUser.jsx ALWAYS receives an array
        let branches = [];
        if (response.data && response.data.status === true) {
            if (response.data.type === "company" && Array.isArray(response.data.data)) {
                // If it's a company, data is already an array of branches
                branches = response.data.data;
            } else if (response.data.type === "branch" && typeof response.data.data === 'object') {
                // If it's a single branch object, wrap it in an array for the frontend
                branches = [response.data.data];
            } else if (response.data.data && Array.isArray(response.data.data.branches)) {
                // Fallback for alternate JSON structures
                branches = response.data.data.branches;
            }
        }

        // Send the perfectly formatted array to MenuUser.jsx
        res.json(branches);

    } catch (err) {
        console.warn("Error fetching branches for menu_user:", err.message);
        res.json([]); // Fail safely by sending an empty array instead of crashing
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




// 3. GET MENU LIST (WITH DISCOUNTS AND FALLBACK)
router.get('/list', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.khabartable.com/company/api/menus/${companyCode}`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        // DETECT LARAVEL LOGIN PAGE BLOCK
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            throw new Error("Laravel Authentication Block");
        }

        let apiItems = [];
        if (response.data && response.data.data) {
            apiItems = response.data.data;
        } else if (Array.isArray(response.data)) {
            apiItems = response.data;
        }

        if (apiItems.length === 0) {
            throw new Error("Empty API response");
        }

        const serialNumbers = apiItems.map(item => item.m_menu_sl).filter(sl => sl); 
        if (serialNumbers.length === 0) return res.json(apiItems);

        // Fetch Both Images AND Discount JSON from Local DB
        const placeholders = serialNumbers.map(() => '?').join(',');
        const sql = `SELECT m_menu_sl, m_image, discount FROM menu WHERE m_menu_sl IN (${placeholders})`;

        db.query(sql, serialNumbers, (err, localResults) => {
            if (err) return res.json(apiItems); 

            const localDataMap = {};
            localResults.forEach(row => {
                localDataMap[row.m_menu_sl] = {
                    m_image: row.m_image,
                    discount: row.discount
                };
            });

            const mergedItems = apiItems.map(item => ({
                ...item,
                m_image: localDataMap[item.m_menu_sl]?.m_image || item.m_image,
                discount: localDataMap[item.m_menu_sl]?.discount || '{}' 
            }));

            res.json(mergedItems);
        });

    } catch (err) {
        console.warn("External API blocked. Serving customer menu from local database.");
        // FALLBACK TO LOCAL MYSQL DB
        db.query("SELECT * FROM menu", (dbErr, dbResults) => {
            if (dbErr) return res.status(500).json({ error: "Failed to fetch menu list" });
            res.json(dbResults);
        });
    }
});

module.exports = router;