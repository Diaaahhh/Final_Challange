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

//2. GET CATEGORIES FROM LOCAL DATABASE
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

        const categories = await queryDb(`
    SELECT DISTINCT
        cat_id AS id,
        cat_name AS menu_name
    FROM menu_categories
    WHERE
        branch_id = ?
        OR FIND_IN_SET(
            ?,
            REPLACE(branch_id, '-', ',')
        )
    ORDER BY cat_name ASC
`, [branchId, branchId]);
// console.log(id, menu_name);


        return res.json(categories);

    } catch (error) {

        console.error(
            "[CATEGORY ERROR]",
            error.message
        );

        return res.json([]);
    }
});

// 3. GET MENU LIST (LOCAL DATABASE ONLY)
router.get('/list', async (req, res) => {
    try {

        const menuSql = `
            SELECT *
            FROM menu
            ORDER BY m_menu_name ASC
        `;

        const variantSql = `
            SELECT *
            FROM menus_variant
        `;

        const menus = await queryDb(menuSql);
const variants = await queryDb(variantSql);

        const menuWithVariants = menus.map(menu => {

            const menuVariants = variants.filter(
                v => Number(v.menu_id) === Number(menu.m_menu_id)
            );

            return {
                ...menu,
                variants: menuVariants
            };
        });

        return res.json(menuWithVariants);

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