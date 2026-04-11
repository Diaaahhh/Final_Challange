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
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/api/menus/${companyCode}`;
        
        // Pass Authorization just in case Laravel is expecting it
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.LARAVEL_TOKEN || ''}`,
                'Accept': 'application/json'
            },
            // --- THE FIX: Prevent Axios from throwing an error on 404/400 status codes ---
            validateStatus: function (status) {
                return status < 500; // Only throw an error if the server is completely broken (500+)
            }
        });

        // 1. DETECT IF LARAVEL SENT THE HTML LOGIN PAGE
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            console.warn("Laravel blocked the API request and returned a Login page.");
            throw new Error("Laravel Authentication Block"); 
        }

        // --- PARSING THE JSON RESPONSE ---
        let externalItems = [];
        
        // 1. Check if the POS explicitly returned "status: false" (e.g., No menus found)
        if (response.data && response.data.status === false) {
            externalItems = []; // Safe empty state
        } 
        // 2. Check if the POS returned a success object with a data array
        else if (response.data && Array.isArray(response.data.data)) {
            externalItems = response.data.data;
        } 
        // 3. Check if the POS just returned a flat array
        else if (Array.isArray(response.data)) {
            externalItems = response.data;
        } 
        // 4. Check if data is explicitly null
        else if (response.data && response.data.data === null) {
            externalItems = []; // Safe empty state
        }
        // 5. If it's completely unrecognized, THEN throw error
        else {
            throw new Error("Unexpected JSON structure");
        }

        // Prepare local DB synchronization
        // --- Empty the table before inserting ---
        db.query("DELETE FROM menu", (deleteErr) => {
            if (deleteErr) {
                console.error("Error emptying the menu table:", deleteErr);
            }

            // --- If there are 0 items from POS, stop here and return empty! ---
            if (externalItems.length === 0) {
                console.warn("POS system returned an empty menu. Local menu table has been cleared.");
                return res.json([]); // Send an empty array to the frontend
            }

            // Otherwise, build the SQL insertion query
            const sql = `
                INSERT INTO menu (
                    m_menu_id, m_menu_sl, m_menu_name, category_id, 
                    m_company_id, m_branch_id, m_ingredient, m_cost, 
                    m_price, m_status
                ) VALUES ?
                ON DUPLICATE KEY UPDATE 
                    m_menu_sl = VALUES(m_menu_sl),
                    m_menu_name = VALUES(m_menu_name),
                    category_id = VALUES(category_id),
                    m_company_id = VALUES(m_company_id),
                    m_branch_id = VALUES(m_branch_id),
                    m_ingredient = VALUES(m_ingredient),
                    m_cost = VALUES(m_cost),
                    m_price = VALUES(m_price),
                    m_status = VALUES(m_status)
            `;

            const values = externalItems.map(item => [
                item.id,
                item.m_menu_sl,
                item.m_menu_name,
                item.category_id,
                item.m_company_id,
                item.m_branch_id,
                item.m_ingredient ? JSON.stringify(item.m_ingredient) : null,
                item.m_cost,
                item.m_price,
                item.m_status
            ]);

            db.query(sql, [values], (err, result) => {
                if (err) {
                    console.error("Local DB Sync Error:", err);
                }

                db.query("SELECT * FROM menu", (dbErr, dbResult) => {
                    if (dbErr) return res.status(500).json({ error: "Failed to load local menu data" });
                    res.json(dbResult);
                });
            });
        });

    } catch (error) {
        console.warn("External API failed or blocked. Loading from Local MySQL Database...");
        // 2. FALLBACK TO LOCAL MYSQL
        try {
            const fallbackData = await new Promise((resolve, reject) => {
                db.query("SELECT * FROM menu", (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            res.json(fallbackData);
        } catch (dbError) {
            res.status(500).json({ error: "Failed to fetch menu data" });
        }
    }
});

// --- ROUTE: GET BRANCH LIST ---
router.get('/branches', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${process.env.LARAVEL_TOKEN || ''}` }
        });

        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            return res.json([]); // Fail safely
        }

        const branches = Array.isArray(response.data) ? response.data : (response.data.data || []);
        res.json(branches);
    } catch (error) {
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