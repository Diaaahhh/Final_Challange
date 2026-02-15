// routes/table_layout.js
const express = require('express');
const router = express.Router();
const rawDb = require('../db'); // Import the standard connection

// MAGIC LINE: Create a promise wrapper just for this file
const db = rawDb.promise(); 

router.get('/', async (req, res) => {
    try {
        // Now 'await' works perfectly here
        const [rows] = await db.query("SELECT * FROM table_layout");
        const formattedRows = rows.map(row => ({
            ...row,
            isBookable: row.is_bookable === 1,
            rotation: row.rotation || 0,
            width: row.width || 100,
            height: row.height || 100
        }));
        res.json(formattedRows);
    } catch (err) {
        console.error("Error fetching tables:", err);
        res.status(500).json({ error: "Failed to fetch layout" });
    }
});

router.post('/update-layout', async (req, res) => {
    const { layout } = req.body;
    if (!layout || !Array.isArray(layout)) return res.status(400).json({ error: "Invalid data" });

    try {
        await db.query("DELETE FROM table_layout"); 

        if (layout.length > 0) {
            const values = layout.map(item => [
                item.id, 
                item.label || null, 
                item.table_number || null,
                item.capacity || 0, 
                item.shape || 'square', 
                item.rotation || 0,
                item.pos_x, 
                item.pos_y, 
                item.type, 
                item.isBookable ? 1 : 0,
                item.width || 100,  
                item.height || 100
            ]);

            const sql = `INSERT INTO table_layout (id, label, table_number, capacity, shape, rotation, pos_x, pos_y, type, is_bookable, width, height) VALUES ?`;
            await db.query(sql, [values]);
        }
        res.json({ message: "Layout updated successfully" });
    } catch (err) {
        console.error("Error saving layout:", err);
        res.status(500).json({ error: "Database error: " + err.message });
    }
});

module.exports = router;