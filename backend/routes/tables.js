const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection

// Endpoint: GET /api/get-tables/:company_id/:branch_id
router.get('/get-tables/:company_id/:branch_id', (req, res) => {
    const { company_id, branch_id } = req.params;

    // Fetch tables matching the company and branch
    const sql = "SELECT * FROM tables WHERE company_id = ? AND branch_id = ?";

    db.query(sql, [company_id, branch_id], (err, results) => {
        if (err) {
            console.error("Error fetching tables:", err);
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;