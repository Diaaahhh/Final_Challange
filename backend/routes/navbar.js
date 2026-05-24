const express = require("express");
const db = require('../db');
const router = express.Router();

// Helper function to wrap db.query in Promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// GET LOGO
router.get("/logo", async (req, res) => {
  try {
    // Fetch the logo filename from the local settings table
    const settings = await queryPromise("SELECT logo FROM settings WHERE id = 1");
    
    const logoFilename = settings[0]?.logo;

    if (!logoFilename) {
        return res.json({ success: false, message: "No logo found", logo: null });
    }

    // Just return the filename. The frontend will combine it with the base URL.
    res.json({ success: true, logo: logoFilename });

  } catch (error) {
    console.error("Logo fetch error:", error.message);
    res.json({ success: false, message: "Failed to fetch logo", logo: null });
  }
});

module.exports = router;