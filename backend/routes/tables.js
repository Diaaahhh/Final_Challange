const express = require('express');
const router = express.Router();
const axios = require('axios'); // We need axios to make the external API call

// Endpoint: GET /api/get-tables/:company_id/:branch_id
router.get('/get-tables/:company_id/:branch_id', async (req, res) => {
    const { company_id, branch_id } = req.params;

    try {

        const tables = await queryPromise(
            `
            SELECT
                id,
                create_by,
                company_id,
                branch_id,
                table_no,
                person_no,
                created_at,
                updated_at,
                status,
                date,
                time
            FROM tables
            WHERE company_id = ?
              AND branch_id = ?
            ORDER BY table_no ASC
            `,
            [company_id, branch_id]
        );

        // Send ONLY the array of tables
        // Same format as before: response.data.data
        res.json(tables);

    } catch (error) {

        console.error(
            "Error fetching tables from local database:",
            error.message
        );

        res.status(500).json({
            message: "Error fetching tables from local database"
        });

    }
});

module.exports = router;