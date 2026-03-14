const express = require('express');
const router = express.Router();
const axios = require('axios'); // We need axios to make the external API call

// Endpoint: GET /api/get-tables/:company_id/:branch_id
router.get('/get-tables/:company_id/:branch_id', async (req, res) => {
    const { company_id, branch_id } = req.params;

   try {
        // Call the external API using GET 
        const response = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${company_id}&branch_id=${branch_id}`);

        // The Laravel API returns JSON with { status, message, data }
        if (response.data && response.data.status === true) {
            // Send ONLY the array of tables to match the previous local DB behavior
            res.json(response.data.data); 
        } else {
            // Handle if the Laravel API returns status => false
            console.error("External API error:", response.data.message);
            res.status(400).json({ message: response.data.message || "Failed to fetch tables" });
        }

    } catch (error) {
        console.error("Error fetching tables from external API:", error.message);
        res.status(500).json({ message: "Error communicating with the external server" });
    }
});

module.exports = router;