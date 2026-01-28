const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. GET MENU LIST (Without Image)
router.get('/list', (req, res) => {
    const sql = `
        SELECT 
            mi.id, 
            mi.name, 
            mi.description, 
            mi.price, 
            mi.code, 
            mi.category_id, -- Needed for Edit Form pre-selection
            mc.name AS category_name 
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mi.category_id = mc.code
        ORDER BY mi.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. UPDATE ITEM
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { name, category_code, price, description } = req.body;

    console.log("Updating ID:", id, "With Data:", req.body); // Debug Log

    // Ensure category_code is treated as an integer if your DB expects INT
    const catCodeInt = parseInt(category_code);

    const sql = "UPDATE menu_items SET name = ?, category_id = ?, price = ?, description = ? WHERE id = ?";

    db.query(sql, [name, catCodeInt, price, description, id], (err, result) => {
        if (err) {
            console.error("SQL Error:", err); // Log the actual SQL error
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Item updated successfully" });
    });
});

// 3. DELETE ITEMS (Bulk or Single)
router.post('/delete', (req, res) => {
    const { ids } = req.body; 

    if (!ids || ids.length === 0) {
        return res.status(400).json({ error: "No items selected for deletion" });
    }

    const sql = "DELETE FROM menu_items WHERE id IN (?)";
    db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Items deleted successfully" });
    });
});

module.exports = router;