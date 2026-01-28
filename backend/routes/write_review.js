const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection file

// Endpoint: POST /api/write-review
router.post('/write-review', (req, res) => {
    const { name, review_text, rating } = req.body;

    // Simple Validation
    if (!review_text || !rating) {
        return res.status(400).json({ message: "Review text and rating are required." });
    }

    const sql = "INSERT INTO review (name, review_text, rating) VALUES (?, ?, ?)";
    const values = [name || "Anonymous", review_text, rating];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error saving review:", err);
            return res.status(500).json({ message: "Database error" });
        }
        return res.status(201).json({ message: "Review submitted successfully!" });
    });
});

module.exports = router;