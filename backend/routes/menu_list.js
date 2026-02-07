const express = require('express');
const router = express.Router(); // <--- This was missing
const db = require('../db'); 
const axios = require('axios'); 
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

// --- CONFIG: Multer for Image Upload ---
// Ensure 'public/uploads' directory exists
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
            if (!code) return reject(new Error("Company Code not found"));
            resolve(code);
        });
    });
};

// --- ROUTE: Image Upload ---
router.post('/upload', upload.single('image'), (req, res) => {
    const { m_menu_sl } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const sql = "UPDATE menu SET m_image = ? WHERE m_menu_sl = ?";
    
    db.query(sql, [imagePath, m_menu_sl], (err, result) => {
        if (err) {
            console.error("DB Update Error:", err);
            return res.status(500).json({ error: "Database update failed" });
        }
        res.json({ message: "Image uploaded successfully", path: imagePath });
    });
});

// --- ROUTE: GET MENU LIST (SYNC & FETCH) ---
router.get('/list', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/api/menus/${companyCode}`;
        
        console.log(`1. Fetching External Menu: ${apiUrl}`);
        const response = await axios.get(apiUrl);
        const externalData = response.data?.data || [];

        // If we got data, let's SYNC it to our local DB
        if (Array.isArray(externalData) && externalData.length > 0) {
            
            const companyId = externalData[0].m_company_id;

            // --- FIX START: Preserve Local Images ---
            // Step 0: Fetch currently saved local images before we delete everything
            const localImages = await new Promise((resolve) => {
                const sql = "SELECT m_menu_sl, m_image FROM menu WHERE m_image IS NOT NULL AND m_image != ''";
                db.query(sql, (err, results) => {
                    if (err) resolve([]); 
                    else resolve(results);
                });
            });

            // Create a map for quick lookup: { 'SL-001': '/uploads/img.jpg' }
            const imageMap = {};
            localImages.forEach(row => {
                imageMap[row.m_menu_sl] = row.m_image;
            });
            // --- FIX END ---

            await new Promise((resolve, reject) => {
                db.beginTransaction(async (err) => {
                    if (err) return reject(err);

                    try {
                        // STEP A: Clear old data for this company
                        await new Promise((delResolve, delReject) => {
                            db.query("DELETE FROM menu WHERE m_company_id = ?", [companyId], (err) => {
                                if (err) delReject(err);
                                else delResolve();
                            });
                        });

                        // STEP B: Prepare data for Batch Insert
                        const values = externalData.map(item => {
                            // Merge logic: If local image exists, use it. Else use external.
                            const preservedImage = imageMap[item.m_menu_sl] || item.m_image;

                            return [
                                item.id,                        
                                item.m_menu_sl,                 
                                item.m_menu_name,               
                                item.m_main_category,           
                                item.m_company_id,              
                                item.m_branch_id,               
                                JSON.stringify(item.m_ingredient), 
                                item.m_cost,                    
                                item.m_price,                   
                                item.m_status,                  
                                preservedImage 
                            ];
                        });

                        // STEP C: Insert New Data
                        const insertSql = `
                            INSERT INTO menu 
                            (m_menu_id, m_menu_sl, m_menu_name, category_id, m_company_id, m_branch_id, m_ingredient, m_cost, m_price, m_status, m_image) 
                            VALUES ?`;

                        await new Promise((insResolve, insReject) => {
                            db.query(insertSql, [values], (err) => {
                                if (err) insReject(err);
                                else insResolve();
                            });
                        });

                        // STEP D: Commit Transaction
                        db.commit((err) => {
                            if (err) return reject(err);
                            console.log(`2. Synced ${values.length} items to Local DB (Images Preserved)`);
                            resolve();
                        });

                    } catch (txError) {
                        db.rollback(() => reject(txError));
                    }
                });
            });
        }

        // STEP E: Fetch from Local Database
        const localData = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM menu", (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        res.json(localData);

    } catch (error) {
        console.error("Menu Sync/Fetch Error:", error.message);
        
        // Fallback to local data if API fails
        try {
            const fallbackData = await new Promise((resolve, reject) => {
                db.query("SELECT * FROM menu", (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            console.log("Serving cached local data due to API error.");
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
        
        console.log(`Fetching Branches: ${apiUrl}`);
        const response = await axios.get(apiUrl);

        const branches = Array.isArray(response.data) ? response.data : (response.data.data || []);
        res.json(branches);
    } catch (error) {
        console.error("Branch Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch branch list" });
    }
});

// Add this route to menu_list.js
router.get('/categories', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        // We use branch 1 or a default to get the category list
        const apiUrl = `https://pos.chulkani.com/company/menu-category/${companyCode}/1`;
        
        const response = await axios.get(apiUrl);
        const categories = response.data?.data || [];
        res.json(categories);
    } catch (error) {
        console.error("Category Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
module.exports = router;