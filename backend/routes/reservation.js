const express = require('express');
const router = express.Router();
const db = require('../db'); 

// 1. CREATE NEW RESERVATION (Your existing code)
router.post('/create', (req, res) => {
    const { name, phone, guest_number, event_name, notes, date, time } = req.body;

    if (!name || !phone || !date || !time || !guest_number) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const sql = `INSERT INTO reservation (name, phone, guest_number, event_name, notes, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [name, phone, guest_number, event_name, notes, date, time];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Failed to book reservation." });
        }
        res.json({ message: "Reservation booked successfully!", id: result.insertId });
    });
});

// 2. GET ALL RESERVATIONS (Add this)
router.get('/', (req, res) => {
    // Ordering by date (newest first)
    const sql = "SELECT * FROM reservation ORDER BY date DESC, time ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. DELETE RESERVATION (Add this)
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM reservation WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

module.exports = router;