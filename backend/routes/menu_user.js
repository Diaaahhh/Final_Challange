const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust path to your db connection file

// 1. GET ALL CATEGORIES (For the Sidebar)
router.get('/categories', (req, res) => {
    // We only need name and code for the navigation
    const sql = "SELECT name, code FROM menu_categories ORDER BY name ASC";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. GET ITEMS BY CATEGORY CODE (For the Main Content)
router.get('/items/:categoryCode', (req, res) => {
    const { categoryCode } = req.params;

    // Fetch only the requested columns based on the category_id foreign key
    const sql = `
        SELECT code, name, description, price 
        FROM menu_items 
        WHERE category_id = ? 
        ORDER BY name ASC
    `;

    db.query(sql, [categoryCode], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;