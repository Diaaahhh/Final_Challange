// routes/create_menu.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection file

// 1. GET ALL CATEGORIES
router.get('/categories', (req, res) => {
    const sql = "SELECT * FROM menu_categories ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. ADD NEW CATEGORY
router.post('/categories/add', (req, res) => {
    console.log("Received Data:", req.body); // <--- Add this line for debugging
    const { name } = req.body;

    // Logic: Find max code. If none, start at 11. Else, max + 1.
    const getMaxCodeSql = "SELECT MAX(code) as maxCode FROM menu_categories";
    
    db.query(getMaxCodeSql, (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        let nextCode = 11; // Default start
        if (result[0].maxCode) {
            nextCode = result[0].maxCode + 1;
        }

        const insertSql = "INSERT INTO menu_categories (name, code) VALUES (?, ?)";
        db.query(insertSql, [name, nextCode], (err, result) => {
            if (err) return res.status(500).json({ error: "Error adding category" });
            res.json({ message: "Category added", id: result.insertId, code: nextCode, name });
        });
    });
});

// 3. ADD MENU ITEM
router.post('/menu/add', (req, res) => {
    console.log("Adding Menu Item:", req.body); // <--- Add this debug line
    const { name, category_code, price, description } = req.body;

    // Logic: Generate Item Code -> (category_code) + (sequence starting at 11)
    
    // Check existing items in this category to find the last sequence
    const checkSql = "SELECT code FROM menu_items WHERE category_id = ? ORDER BY code DESC LIMIT 1";

    db.query(checkSql, [category_code], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        let nextSequence = 11;

        if (result.length > 0) {
            // Example: Existing code is 1211. Category is 12. 
            // We need to extract the last 2 digits (assuming logical sequence)
            // Or simpler: Convert to string, slice off the category_code length
            const lastCodeStr = result[0].code.toString();
            const catCodeStr = category_code.toString();
            
            // Extract the sequence part
            const sequenceStr = lastCodeStr.substring(catCodeStr.length);
            nextSequence = parseInt(sequenceStr) + 1;
        }

        // Generate final Code: e.g., "12" + "11" = 1211 (as integer)
        const finalCodeStr = `${category_code}${nextSequence}`;
        const finalCode = parseInt(finalCodeStr);

        // Insert into DB
        const insertSql = "INSERT INTO menu_items (category_id, name, description, price, code) VALUES (?, ?, ?, ?, ?)";
        
        db.query(insertSql, [category_code, name, description, price, finalCode], (err, result) => {
            if (err) return res.status(500).json({ error: "Error adding item" });
            res.json({ message: "Item added successfully", code: finalCode });
        });
    });
});

module.exports = router;