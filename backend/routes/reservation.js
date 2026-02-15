const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. CREATE NEW RESERVATION
router.post('/create', (req, res) => {
    // FIX: Destructure 'table_number' from the request body
    const { name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

    if (!name || !phone || !date || !time || !guest_number) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }

    // FIX: If table_number is array (e.g. ["1", "5"]), convert to string "1, 5"
    // If it's undefined or empty, save as NULL or empty string
    let tableStr = null;
    if (table_number) {
        tableStr = Array.isArray(table_number) ? table_number.join(", ") : table_number;
    }

    // FIX: Updated SQL query to include 'table_number' column
    const sql = `INSERT INTO reservation (name, phone, guest_number, event_name, notes, date, time, table_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [name, phone, guest_number, event_name, notes, date, time, tableStr];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Failed to book reservation." });
        }
        res.json({ message: "Reservation booked successfully!", id: result.insertId });
    });
});

// 2. GET ALL RESERVATIONS
router.get('/', (req, res) => {
    const sql = "SELECT * FROM reservation ORDER BY date DESC, time ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. DELETE RESERVATION
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM reservation WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

// 4. UPDATE RESERVATION
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    // FIX: Destructure 'table_number' here too
    const { name, phone, guest_number, event_name, notes, date, time, table_number } = req.body;

    let tableStr = null;
    if (table_number) {
        tableStr = Array.isArray(table_number) ? table_number.join(", ") : table_number;
    }

    // FIX: Updated SQL query to update 'table_number'
    const sql = `
        UPDATE reservation 
        SET name=?, phone=?, guest_number=?, event_name=?, notes=?, date=?, time=?, table_number=? 
        WHERE id=?`;

    const values = [name, phone, guest_number, event_name, notes, date, time, tableStr, id];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated successfully" });
    });
});

module.exports = router;