const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs to delete old files

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- POST Endpoint ---
router.post('/upload-hero', upload.single('image'), (req, res) => {
    const { name } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !image) {
        return res.status(400).json({ message: "Name and Image are required" });
    }

    // STEP 1: Find the old image so we can delete the file from the folder
    const getOldSql = "SELECT image FROM hero";

    db.query(getOldSql, (err, data) => {
        if (err) {
            console.error("Error fetching old image:", err);
            return res.status(500).json({ message: "Database Error" });
        }

        // If there is an old image, delete the physical file from public/uploads
        if (data.length > 0) {
            data.forEach(row => {
                const oldImagePath = path.join(__dirname, '../public/uploads', row.image);
                // Check if file exists, then delete it
                if (fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error("Failed to delete old image file:", err);
                    });
                }
            });
        }

        // STEP 2: Clear the table (Remove previous DB entry)
        // TRUNCATE is faster and resets the ID back to 1
        const truncateSql = "TRUNCATE TABLE hero";

        db.query(truncateSql, (err) => {
            if (err) {
                console.error("Error clearing table:", err);
                return res.status(500).json({ message: "Database Error Clearing Table" });
            }

            // STEP 3: Insert the NEW entry
            const sql = "INSERT INTO hero (name, image) VALUES (?, ?)";
            const values = [name, image];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error("Error inserting new hero:", err);
                    return res.status(500).json({ message: "Database Error Inserting" });
                }
                return res.status(201).json({ message: "Hero uploaded successfully!" });
            });
        });
    });
});

// --- GET Endpoint ---
router.get('/get-hero', (req, res) => {
    const sql = "SELECT * FROM hero ORDER BY id DESC LIMIT 1";
    
    db.query(sql, (err, data) => {
        if(err) return res.json("Error");
        if(data.length > 0) {
            return res.json(data[0]); 
        } else {
            return res.json(null); 
        }
    })
})

module.exports = router;