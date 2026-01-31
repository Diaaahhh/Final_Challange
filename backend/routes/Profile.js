// routes/Profile.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure this folder exists: 'public/uploads/profiles'
    cb(null, 'public/uploads/profiles'); 
  },
  filename: (req, file, cb) => {
    cb(null, 'user_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 1. GET User Data
router.get('/user/:id', (req, res) => {
    const id = req.params.id;
    // Added photoUrl to selection
    const sql = "SELECT id, name, email, phone, address, apartment, district_id, thana_id, role, photoUrl FROM users WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result[0]);
    });
});

// 2. GET All Districts
router.get('/districts', (req, res) => {
    const sql = "SELECT id, name FROM district ORDER BY name ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

// 3. GET Thanas by District ID
router.get('/thanas/:districtId', (req, res) => {
    const districtId = req.params.districtId;
    const sql = "SELECT id, name FROM thana WHERE district_id = ? ORDER BY name ASC";
    db.query(sql, [districtId], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

// 4. UPDATE User Profile (With Image Upload)
// Note: 'photo' matches the name attribute in the frontend FormData
router.put('/user/update', upload.single('photo'), (req, res) => {
    const { id, name, phone, address, apartment, district_id, thana_id } = req.body;
    let photoUrl = null;

    // If a file was uploaded, create the URL
    if (req.file) {
        photoUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // Dynamic SQL: Update photo only if a new one is provided
    let sql = "";
    let params = [];

    if (photoUrl) {
        sql = `UPDATE users SET name=?, phone=?, address=?, apartment=?, district_id=?, thana_id=?, photoUrl=? WHERE id=?`;
        params = [name, phone, address, apartment, district_id, thana_id, photoUrl, id];
    } else {
        sql = `UPDATE users SET name=?, phone=?, address=?, apartment=?, district_id=?, thana_id=? WHERE id=?`;
        params = [name, phone, address, apartment, district_id, thana_id, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        // Return the new photo URL so frontend can update immediatey
        return res.json({ message: "Profile updated successfully", photoUrl });
    });
});

module.exports = router;