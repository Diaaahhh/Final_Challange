const express = require('express');
const router = express.Router();
const db = require('../db'); 

// --- GET Route to fetch the About Data ---
router.get('/', (req, res) => {
    // We limit 1 because we only have one "About" section
    const sql = "SELECT * FROM about LIMIT 1";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to fetch data" });
        }
        
        if (results.length > 0) {
            res.json(results[0]); // Send the first (and only) row
        } else {
            res.json({ heading: "Welcome", text: "No content added yet.", image: null });
        }
    });
});

module.exports = router;