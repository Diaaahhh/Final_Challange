const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. Folder Creation (Exactly like write_about.js) ---
const uploadDir = path.join(__dirname, '../public/uploads/portfolio');
if (!fs.existsSync(uploadDir)){
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
        console.error("Failed to create directory:", err);
    }
}

// --- 2. Configure Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 3. GET: Fetch All Portfolio Items ---
router.get('/', (req, res) => {
    const sql = "SELECT * FROM portfolio ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ status: false, message: "Database error" });
        }

        // Just parse the images array, NO path formatting needed!
        const formattedResults = results.map(item => ({
            ...item,
            images: item.images ? JSON.parse(item.images) : []
        }));

        res.status(200).json({ status: true, data: formattedResults });
    });
});

// --- 4. POST: Create Portfolio Item ---
const cpUpload = upload.fields([
    { name: 'banner', maxCount: 1 }, 
    { name: 'images', maxCount: 10 }
]);

router.post('/create', cpUpload, (req, res) => {
    try {
        const { category, title, description } = req.body;
        const files = req.files;

        if (!category || !title || !files['banner']) {
            return res.status(400).json({ status: false, message: "Category, Title, and Banner required." });
        }

        // 🌟 THE CRITICAL FIX: Save ONLY the filename, not the path!
        const bannerFilename = files['banner'][0].filename;

        let imagesFilenames = [];
        if (files['images']) {
            imagesFilenames = files['images'].map(file => file.filename);
        }

        const sql = "INSERT INTO portfolio (category, title, description, images, banner) VALUES (?, ?, ?, ?, ?)";
        const values = [category, title, description, JSON.stringify(imagesFilenames), bannerFilename];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ status: false, message: "Database error" });
            }
            res.status(201).json({ status: true, message: "Success", id: result.insertId });
        });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// ==========================================
// PUT: Update Portfolio Item
// ==========================================
router.put('/:id', cpUpload, (req, res) => {
    const id = req.params.id;
    const { category, title, description } = req.body;
    const files = req.files;

    // First, fetch the existing item to keep old images if new ones aren't provided
    db.query("SELECT * FROM portfolio WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ status: false, message: "Item not found or DB error" });
        }

        const existingItem = results[0];

        // 1. Process Banner: Use new one if uploaded, otherwise keep old one
        let bannerFilename = existingItem.banner;
        if (files && files['banner']) {
            bannerFilename = files['banner'][0].filename;
        }

        // 2. Process Gallery Images: Use new array if uploaded, otherwise keep old array
        let imagesFilenamesStr = existingItem.images; 
        if (files && files['images']) {
            const newImagesArray = files['images'].map(file => file.filename);
            imagesFilenamesStr = JSON.stringify(newImagesArray);
        }

        // Update Database
        const sql = "UPDATE portfolio SET category = ?, title = ?, description = ?, images = ?, banner = ? WHERE id = ?";
        const values = [category, title, description, imagesFilenamesStr, bannerFilename, id];

        db.query(sql, values, (updateErr) => {
            if (updateErr) {
                console.error("Update error:", updateErr);
                return res.status(500).json({ status: false, message: "Database error during update" });
            }
            res.status(200).json({ status: true, message: "Portfolio item updated successfully!" });
        });
    });
});

// ==========================================
// DELETE: Remove a Portfolio Item by ID
// ==========================================
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    // SQL query to delete the specific row based on the ID
    const sql = "DELETE FROM portfolio WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting portfolio item:", err);
            return res.status(500).json({ status: false, message: "Database error during deletion" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: "Portfolio item not found" });
        }

        res.status(200).json({ status: true, message: "Portfolio item deleted successfully!" });
    });
});
module.exports = router;