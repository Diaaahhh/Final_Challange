const express = require("express");
const axios = require("axios");
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
    const settings = await queryPromise(
      "SELECT company_code FROM settings WHERE id = 1"
    );

    const companyCode = settings[0]?.company_code || "26672691";

    const response = await axios.get(
      `https://pos.chulkani.com/company/user-details/${companyCode}`
    );

    // ==========================================
    // ADDED CONSOLE LOG HERE
    // ==========================================
    console.log("External API Response for Logo:", JSON.stringify(response.data, null, 2));

    // FIX 1: Don't throw 404. Just cleanly return success: false
    if (!response.data || !response.data.data) {
        return res.json({ success: false, message: "No company data found", logo: null });
    }

    const data = response.data.data;
    
    // Safely find the item that contains the image property
    const logoItem = Array.isArray(data) ? data.find(item => item.image) : (data.image ? data : null);

    // FIX 2: Again, cleanly return success: false instead of an error status
    if (!logoItem || !logoItem.image) {
      return res.json({ success: false, message: "No logo found for this company", logo: null });
    }

    // Construct the full URL
    const logoUrl = `https://pos.chulkani.com/assets/uploads/user_logo/${logoItem.image}`;

    res.json({ success: true, logo: logoUrl });

  } catch (error) {
    console.error("Logo fetch error:", error.message);
    // FIX 3: Don't crash the frontend if the external API is down.
    res.json({ success: false, message: "Failed to fetch logo", logo: null });
  }
});

module.exports = router;