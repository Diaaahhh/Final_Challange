const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 

// --- 1. Folder Creation ---
const uploadDir = path.join(__dirname, '../public/uploads');
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

// --- 3. Create/Replace Route ---
router.post('/create', upload.single('image'), (req, res) => {
    const { heading, text } = req.body; // Added heading
    const image = req.file ? req.file.filename : null;

    if (!text || !heading) {
        return res.status(400).json({ error: "Please fill in all fields (Heading & Text)." });
    }

    // STEP 1: Delete all existing records (To ensure only 1 record exists)
    const deleteSql = "DELETE FROM about";
    
    db.query(deleteSql, (deleteErr) => {
        if (deleteErr) {
            console.error("Delete Error:", deleteErr);
            return res.status(500).json({ error: "Database error during cleanup" });
        }

        // STEP 2: Insert the new record
        const insertSql = "INSERT INTO about (heading, text, image) VALUES (?, ?, ?)";
        
        db.query(insertSql, [heading, text, image], (insertErr, result) => {
            if (insertErr) {
                console.error("Insert Error:", insertErr);
                return res.status(500).json({ error: "Database error during save" });
            }
            res.json({ message: "Content updated successfully!", id: result.insertId });
        });
    });
});

module.exports = router;