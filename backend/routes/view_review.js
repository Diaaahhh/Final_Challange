const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection

// Endpoint: GET /api/view-reviews
router.get('/view-reviews', (req, res) => {
    // Selects all reviews, newest first
    const sql = "SELECT * FROM review ORDER BY created_at DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching reviews:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;