const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db'); 
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Set up Cookie Jar for session persistence
const jar = new tough.CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

router.post('/place-order', async (req, res) => {
    // 1. Get Company Code from Local Settings (Best Method)
    const sql = "SELECT company_code FROM settings WHERE id = 1";

    db.query(sql, async (err, result) => {
        if (err || !result[0]?.company_code) {
            console.error("DB Error: Company Code missing");
            return res.status(500).json({ error: "Company Code missing from local DB" });
        }

        const companyCode = result[0].company_code;
        
        try {
            const targetUrl = 'https://pos.chulkani.com/branch/order/confirm_order';
            const baseUrl = 'https://pos.chulkani.com/';

            // 2. Prepare Data: Add company_code to body as well
            const orderData = {
                ...req.body,
                company_code: companyCode
            };

            // 3. Establish Session (Get XSRF Token)
            await client.get(baseUrl);
            const cookies = await jar.getCookies(baseUrl);
            const xsrfCookie = cookies.find(c => c.key === 'XSRF-TOKEN');
            const token = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : '';

            // 4. Send POST with RE-ADDED HEADERS
            // The server uses these headers to pick the right database connection
            const externalResponse = await client.post(targetUrl, orderData, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': token,
                    
                    // --- CRITICAL FIXES ---
                    'company-code': companyCode, 
                    'Referer': baseUrl,
                    'Origin': baseUrl
                }
            });

            // 5. Success
            res.json(externalResponse.data);

        } catch (error) {
            console.error("❌ External API Failed.");
            
            if (error.response) {
                // Log the detailed error from the Laravel server
                console.error("Status:", error.response.status);
                console.error("Data:", JSON.stringify(error.response.data, null, 2));
                
                // Pass the actual error back to frontend
                res.status(error.response.status).json(error.response.data);
            } else {
                console.error("Error Message:", error.message);
                res.status(500).json({ message: "Proxy Connection Error", details: error.message });
            }
        }
    });
});

module.exports = router;