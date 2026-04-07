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

    const data = response.data.data;

    const logoItem = data.find(item => item.image);

    if (!logoItem) {
      return res.status(404).send("No logo found");
    }

    const logoUrl = `https://pos.chulkani.com/uploads/logo/${logoItem.image}`;

    // FETCH IMAGE FROM POS SERVER
    const imageResponse = await axios.get(logoUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    res.set("Content-Type", "image/png");
    res.send(imageResponse.data);

  } catch (error) {
    console.error("Logo fetch error:", error.message);
    res.status(500).send("Failed to fetch logo");
  }
});

module.exports = router;