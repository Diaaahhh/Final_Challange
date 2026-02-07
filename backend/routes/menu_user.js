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
            // Default to the one in your prompt if DB is empty
            const code = result[0]?.company_code || '26672691'; 
            resolve(code);
        });
    });
};

// 1. GET BRANCH LIST (Existing)
router.get('/branches', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
        const response = await axios.get(apiUrl);
        
        let branches = [];
        if (response.data && response.data.data && response.data.data.branches) {
            branches = response.data.data.branches;
        } else if (Array.isArray(response.data)) {
            branches = response.data;
        }
        res.json(branches);
    } catch (error) {
        console.error("Branch Fetch Error:", error.message);
        res.json([]);
    }
});

// 2. GET CATEGORIES BY BRANCH (UPDATED)
// Matches logic: pos.chulkani.com/company/menu-category/26672691/{branchId}
router.get('/categories/:branchId', async (req, res) => {
    try {
        const { branchId } = req.params;
        const companyCode = await getCompanyCode();

        // If branch is "All", we might default to 1 or handle differently. 
        // For this logic, we assume we need a specific ID. Defaulting to 1 if "All" is passed roughly.
        const effectiveBranchId = branchId === "All" ? 1 : branchId;

        const apiUrl = `https://pos.chulkani.com/company/menu-category/${companyCode}/${effectiveBranchId}`;
        
        const response = await axios.get(apiUrl);

        // API returns { status: true, company_id: ..., data: [...] }
        if (response.data && response.data.status && Array.isArray(response.data.data)) {
            res.json(response.data.data);
        } else {
            res.json([]);
        }

    } catch (err) {
        console.error("Category Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// 3. GET ITEMS BY CATEGORY AND BRANCH (UPDATED & MERGED)
// Matches logic: pos.chulkani.com/company/menu/26672691/{branchId}/{categoryId}
// Then fetches images from LOCAL DB based on m_menu_sl
router.get('/items/:branchId/:categoryId', async (req, res) => {
    try {
        const { branchId, categoryId } = req.params;
        const companyCode = await getCompanyCode();
        const effectiveBranchId = branchId === "All" ? 1 : branchId;

        // A. Fetch External API Data
        const apiUrl = `https://pos.chulkani.com/company/menu/${companyCode}/${effectiveBranchId}/${categoryId}`;
        const apiResponse = await axios.get(apiUrl);

        let apiItems = [];
        if (apiResponse.data && apiResponse.data.status && Array.isArray(apiResponse.data.data)) {
            apiItems = apiResponse.data.data;
        }

        if (apiItems.length === 0) {
            return res.json([]);
        }

        // B. Extract Serial Numbers (m_menu_sl) to find local images
        // We filter out null/undefined SLs
        const serialNumbers = apiItems
            .map(item => item.m_menu_sl)
            .filter(sl => sl); 

        if (serialNumbers.length === 0) {
            // No serial numbers found, return items without images
            return res.json(apiItems);
        }

        // C. Query Local DB for Images
        // "SELECT m_menu_sl, m_image FROM menu WHERE m_menu_sl IN (...)"
        const placeholders = serialNumbers.map(() => '?').join(',');
        const sql = `SELECT m_menu_sl, m_image FROM menu WHERE m_menu_sl IN (${placeholders})`;

        db.query(sql, serialNumbers, (err, localResults) => {
            if (err) {
                console.error("Local Image Fetch Error:", err);
                // Return items without images on DB error
                return res.json(apiItems); 
            }

            // D. Create a Map of SL -> Image
            const imageMap = {};
            localResults.forEach(row => {
                imageMap[row.m_menu_sl] = row.m_image;
            });

            // E. Merge Image into API Data
            const mergedItems = apiItems.map(item => ({
                ...item,
                // Assign local image if found, otherwise keep what API sent (usually null)
                m_image: imageMap[item.m_menu_sl] || item.m_image 
            }));

            res.json(mergedItems);
        });

    } catch (err) {
        console.error("Item Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

module.exports = router;