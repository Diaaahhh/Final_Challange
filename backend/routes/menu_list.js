const express = require('express');
const router = express.Router(); 
const db = require('../db'); 
const axios = require('axios'); 
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

// --- CONFIG: Multer for Image Upload ---
const uploadDir = path.join(__dirname, '../public/uploads'); 
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// HELPER: Get Company Code
const getCompanyCode = () => {
    return new Promise((resolve, reject) => {
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";
        db.query(settingsSql, (err, result) => {
            if (err) return reject(err);
            const code = result[0]?.company_code;
            if (!code) return reject(new Error("Company code not found"));
            resolve(code);
        });
    });
};

// --- ROUTE: GET MENU LIST ---
router.get('/list', async (req, res) => {
    
    // Safely handle queries whether they have params or not
    const queryDb = (sql, params) => {
        return new Promise((resolve, reject) => {
            const callback = (err, results) => {
                if (err) reject(err);
                else resolve(results);
            };
            
            if (params !== undefined) {
                db.query(sql, params, callback);
            } else {
                db.query(sql, callback);
            }
        });
    };

    // THE FIX: Helper function to apply the frontend return logic based on 'settings'
    // It now uses a Regular Expression to accurately find multiple branches formatted as strings (e.g., "14-15" or "14, 15")
    const getFilteredMenuData = async () => {
        const settingsResult = await queryDb("SELECT company_code, branch_id FROM settings LIMIT 1");
        
        if (settingsResult && settingsResult.length > 0) {
            const { company_code, branch_id } = settingsResult[0];

            // 1. Parse the branch_id from settings. 
            // Splits by commas, hyphens, or spaces to create an array of exact IDs.
            const branchArray = branch_id 
                ? String(branch_id).split(/[ ,-]+/).map(b => b.trim()).filter(b => b && b !== 'null')
                : [];

            if (branchArray.length === 0) {
                console.log(`   -> Sending menu filtered by m_company_id: ${company_code}`);
                return await queryDb("SELECT * FROM menu WHERE m_company_id = ?", [company_code]);
            } else {
                console.log(`   -> Sending menu filtered by m_company_id: ${company_code} AND matching branches: [${branchArray.join(', ')}]`);
                
                // 2. Build a MySQL REGEXP pattern.
                // Example Output: (^|[ ,-])(14|15)([ ,-]|$)
                // This ensures exact matches for "14" or "15" even if hidden inside "14-15" or "14, 15", preventing "14" from matching "114".
                const regexPattern = `(^|[ ,-])(${branchArray.join('|')})([ ,-]|$)`;

                return await queryDb(
                    "SELECT * FROM menu WHERE m_company_id = ? AND m_branch_id REGEXP ?", 
                    [company_code, regexPattern]
                );
            }
        }
        
        // Fallback if the settings table is completely empty
        console.warn("   -> Settings table is empty. Returning all menu records.");
        return await queryDb("SELECT * FROM menu");
    };

    try {
        console.log("1. [MENU SYNC] /list route triggered!");
        
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/api/menus/${companyCode}`;
        
        console.log(`2. [MENU SYNC] Fetching external menus from: ${apiUrl}`);
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.LARAVEL_TOKEN || ''}`,
                'Accept': 'application/json'
            },
            validateStatus: function (status) {
                return status < 500;
            }
        });

        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            throw new Error("Laravel Authentication Block"); 
        }

        // --- PARSING JSON ---
        let externalItems = [];
        if (response.data && response.data.status === true && Array.isArray(response.data.data)) {
            externalItems = response.data.data;
        } else if (response.data && response.data.status === false) {
            externalItems = [];
        } else if (Array.isArray(response.data)) {
            externalItems = response.data;
        } else if (response.data && response.data.data === null) {
            externalItems = [];
        } else {
            throw new Error("Unexpected JSON structure");
        }

        console.log(`3. [MENU SYNC] Found ${externalItems.length} items from POS API.`);

        if (externalItems.length === 0) {
            console.warn("4. [MENU SYNC] POS returned empty data. Fetching existing local DB...");
            const finalData = await getFilteredMenuData();
            return res.json(finalData);
        }

        // Fetch current local DB items to map
        console.log("4. [MENU SYNC] Fetching local database to compare...");
        const localItems = await queryDb("SELECT m_menu_id, m_branch_id FROM menu");
        console.log(`   -> Found ${localItems.length} items currently in local DB.`);
        
        const localMap = new Map();
        localItems.forEach(item => {
            localMap.set(item.m_menu_id, String(item.m_branch_id || 'null'));
        });

        const insertValues = [];
        const updateQueries = [];

        // Apply logic to API Data
        externalItems.forEach(item => {
            const apiId = item.id;
            const apiBranchId = String(item.m_branch_id || 'null');
            
            const ingredientStr = typeof item.m_ingredient === 'string' 
                ? item.m_ingredient 
                : JSON.stringify(item.m_ingredient || []);

            if (!localMap.has(apiId)) {
                // INSERT logic
                insertValues.push([
                    apiId, item.m_menu_sl, item.m_menu_name, item.m_main_category, 
                    item.m_company_id, item.m_branch_id, ingredientStr, 
                    item.m_cost, item.m_price, item.m_status
                ]);
            } else {
                // UPDATE logic
                const dbBranchId = localMap.get(apiId);
                if (apiBranchId !== dbBranchId) {
                    updateQueries.push({
                        sql: `UPDATE menu SET 
                            m_menu_sl = ?, m_menu_name = ?, category_id = ?, 
                            m_company_id = ?, m_branch_id = ?, m_ingredient = ?, 
                            m_cost = ?, m_price = ?, m_status = ? 
                            WHERE m_menu_id = ?`,
                        params: [
                            item.m_menu_sl, item.m_menu_name, item.m_main_category, 
                            item.m_company_id, item.m_branch_id, ingredientStr, 
                            item.m_cost, item.m_price, item.m_status, apiId
                        ]
                    });
                }
            }
        });

        console.log(`5. [MENU SYNC] Ready to INSERT ${insertValues.length} new items.`);
        console.log(`5. [MENU SYNC] Ready to UPDATE ${updateQueries.length} existing items.`);

        // Execute pending Inserts
        if (insertValues.length > 0) {
            const insertSql = `INSERT INTO menu (
                m_menu_id, m_menu_sl, m_menu_name, category_id, 
                m_company_id, m_branch_id, m_ingredient, m_cost, 
                m_price, m_status
            ) VALUES ?`;
            await queryDb(insertSql, [insertValues]);
            console.log("6. [MENU SYNC] Inserts completed successfully!");
        }

        // Execute pending Updates
        if (updateQueries.length > 0) {
            for (const query of updateQueries) {
                await queryDb(query.sql, query.params);
            }
            console.log("6. [MENU SYNC] Updates completed successfully!");
        }

        // Return final DB (Filtered by complex string matching)
        console.log("7. [MENU SYNC] Sending final local data to frontend.");
        const finalData = await getFilteredMenuData();
        res.json(finalData);

    } catch (error) {
        console.error("\n❌ [MENU SYNC] FATAL ERROR:", error.message);
        console.error("Falling back to local Database...\n");
        
        try {
            // Return fallback DB (Filtered by complex string matching)
            const fallbackData = await getFilteredMenuData();
            res.json(fallbackData);
        } catch (dbError) {
            res.status(500).json({ error: "Failed to fetch menu data completely." });
        }
    }
});

// --- ROUTE: GET BRANCH LIST ---
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

        // 2. Use the fetched soft_api_key
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list/?soft_api_key=${soft_api_key}`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${process.env.LARAVEL_TOKEN || ''}` }
        });

        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            return res.json([]); // Fail safely on Laravel HTML error
        }

        // 3. Normalize the data so MenuList.jsx ALWAYS receives an array
        let branches = [];
        if (response.data && response.data.status === true) {
            if (response.data.type === "company" && Array.isArray(response.data.data)) {
                // It's a company, data is already an array of branches
                branches = response.data.data;
            } else if (response.data.type === "branch" && typeof response.data.data === 'object') {
                // It's a single branch object, wrap it in an array for the frontend
                branches = [response.data.data];
            }
        }

        // Send the perfectly formatted array to MenuList.jsx
        res.json(branches);

    } catch (error) {
        console.error("Error fetching branches for menu:", error.message);
        res.json([]); // Fail safely
    }
});

// --- ROUTE: GET CATEGORIES ---
router.get('/categories', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/menu-category/${companyCode}/1`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${process.env.LARAVEL_TOKEN || ''}` }
        });

        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            return res.json([]); // Fail safely
        }

        const categories = response.data?.data || [];
        res.json(categories);
    } catch (error) {
        res.json([]); // Fail safely
    }
});

// --- ROUTE: UPLOAD IMAGE ---
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        
        const { id } = req.body;
        if (!id) {
            fs.unlinkSync(req.file.path); 
            return res.status(400).json({ success: false, message: 'Menu item ID missing' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        const updateSql = "UPDATE menu SET m_image = ? WHERE id = ?";
        db.query(updateSql, [imagePath, id], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Database update failed' });
            res.json({ success: true, message: 'Image uploaded', imagePath });
        });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==========================================
// UPDATE MENU ITEM DISCOUNT (JSON FORMAT)
// ==========================================
router.put('/update-discount/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { branch_id, discount } = req.body; 
        
        if (!branch_id) return res.status(400).json({ success: false, message: "Branch ID is required" });

        const safeDiscount = parseFloat(discount) || 0;

        db.query("SELECT discount FROM menu WHERE id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });
            if (results.length === 0) return res.status(404).json({ success: false, message: "Menu item not found" });

            let currentDiscounts = {};
            try {
                const dbDiscount = results[0].discount;
                if (dbDiscount && dbDiscount !== '{}') {
                    const parsed = JSON.parse(dbDiscount);
                    // SECURITY CHECK: If the DB had "0.00", parsed is a number. We must force it to be an object!
                    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        currentDiscounts = parsed;
                    }
                }
            } catch (parseErr) {
                currentDiscounts = {}; // Reset on JSON parse error
            }

            // Apply the discount to the specific branch
            currentDiscounts[branch_id] = safeDiscount;
            
            // Turn it back into a perfect JSON string
            const updatedDiscountString = JSON.stringify(currentDiscounts);

            const updateSql = `UPDATE menu SET discount = ? WHERE id = ?`;
            db.query(updateSql, [updatedDiscountString, id], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: "Failed to save discount" });
                res.json({ success: true, message: "Discount percentage updated successfully" });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to update discount" });
    }
});

module.exports = router;

module.exports = router;