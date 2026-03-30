const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

// Helper function to wrap db.query in Promises
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// ==========================================
// 1. GET User by Phone Number
// ==========================================
router.get('/get-user-by-phone/:phone', async (req, res) => {
    const phone = req.params.phone;
    const branch_id = req.query.branch_id || 1;

    if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });

    try {
        // Fetch company_code dynamically from settings
        const settings = await queryPromise("SELECT company_code FROM settings WHERE id = 1");
        const companyCode = settings[0]?.company_code || '26672691';

        // 1. Call the external API for customers
        const apiUrl = `https://pos.chulkani.com/branch/all_customer?company_id=${companyCode}`;
        const response = await axios.get(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        // Check if data is valid and find the matching customer by phone
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            const customers = response.data.data;
            const matchedCustomer = customers.find(c => String(c.phone) === String(phone));

            if (matchedCustomer) {
                return res.status(200).json({
                    success: true, // Tell frontend it was successful
                    name: matchedCustomer.name,
                    address: matchedCustomer.address
                });
            }
        }

        // ==========================================
        // 2. IF CUSTOMER NOT FOUND: Fetch Branch Phone
        // ==========================================
        let branchPhone = "the restaurant"; // Default fallback
        try {
            const branchApiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
            const branchRes = await axios.get(branchApiUrl, { headers: { 'Accept': 'application/json' } });

            let branches = [];
            if (branchRes.data && branchRes.data.data && branchRes.data.data.branches) {
                branches = branchRes.data.data.branches;
            } else if (branchRes.data && Array.isArray(branchRes.data.data)) {
                branches = branchRes.data.data;
            } else if (Array.isArray(branchRes.data)) {
                branches = branchRes.data;
            }

            // FIX: Check both 'branch_id' and 'id' just in case the API structure varies
            const matchedBranch = branches.find(b => String(b.branch_id) === String(branch_id) || String(b.id) === String(branch_id));

            if (matchedBranch) {
                // FIX: Check multiple possible property names for the phone number
                branchPhone = matchedBranch.phone || matchedBranch.branch_phone || matchedBranch.contact_number || "the restaurant";
            }
        } catch (branchErr) {
            console.error("Failed to fetch branch info for error message:", branchErr.message);
        }

        // FIX: Return Status 200 so the console doesn't show a red error!
        // We use 'success: false' to tell the frontend the user wasn't found.
        return res.status(200).json({
            success: false,
            message: `First-time customers, please call ${branchPhone} to place an online order. `
        });

    } catch (err) {
        console.error("External API Fetch Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ==========================================
// GET: Fetch and Validate Dine-in Tables
// ==========================================
router.get('/get-dine-in-tables/:company_id/:branch_id', async (req, res) => {
    try {
        const { company_id, branch_id } = req.params;

        // --- NEW: Get REAL current date and time (Replaces chosenDate/chosenTime) ---
        const now = new Date();
        const realYear = now.getFullYear();
        const realMonth = String(now.getMonth() + 1).padStart(2, '0');
        const realDay = String(now.getDate()).padStart(2, '0');
        const currentDate = `${realYear}-${realMonth}-${realDay}`;
        const currentTimeInHours = now.getHours() + (now.getMinutes() / 60);

        // 1. Fetch ALL physical tables from External API
        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${company_id}&branch_id=${branch_id}`);
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 2. Fetch LOCAL reservations for this branch AND company
        const reservations = await queryPromise(
            "SELECT * FROM reservation WHERE re_com_id = ? AND re_branch_id = ?",
            [company_id, branch_id]
        );

        const updatePromises = [];

        // 3. Process each table according to your NEW logic
        const processedTables = tables.map(table => {
            let { id, table_no, capacity, person_no } = table;
            const stringTableNo = String(table_no).trim();

            // Assume table is available by default
            let isAvailable = true;
            let bookingMessage = null;

            // Find all local reservations belonging to this specific table
            const tableReservations = reservations.filter(res => {
                if (!res.re_table_no) return false;
                const resTables = String(res.re_table_no).split(',').map(t => t.trim());
                return resTables.includes(stringTableNo);
            });

            // Loop through the reservations to check for conflicts
            for (const res of tableReservations) {
                let resDate = "";
                let resTime = "";

                // Format the new DATETIME column `re_date` into separate Date and Time variables
                if (res.re_date instanceof Date) {
                    const y = res.re_date.getFullYear();
                    const m = String(res.re_date.getMonth() + 1).padStart(2, '0');
                    const d = String(res.re_date.getDate()).padStart(2, '0');
                    resDate = `${y}-${m}-${d}`;

                    const hr = String(res.re_date.getHours()).padStart(2, '0');
                    const min = String(res.re_date.getMinutes()).padStart(2, '0');
                    resTime = `${hr}:${min}`;
                } else if (res.re_date && typeof res.re_date === 'string') {
                    // Handles string formats like "2026-03-22 14:30:00" or "2026-03-22T14:30:00Z"
                    const parts = res.re_date.split(/T|\s/);
                    resDate = parts[0];
                    if (parts[1]) {
                        resTime = parts[1].substring(0, 5); // Extracts just the "HH:MM"
                    }
                }

                let resTimeInHours = 0;
                if (resTime) {
                    const parts = resTime.split(':');
                    resTimeInHours = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
                }

                // DYNAMIC DURATION: Convert re_duration (minutes) to hours. Default to 1.5 if null/missing.
                let durationInHours = 1.5;
                if (res.re_duration) {
                    durationInHours = parseInt(res.re_duration, 10) / 60;
                }

                // --- LOGIC 1: AUTO-EXPIRATION ---
                // If status is 1, dynamically check if it is older than the DURATION in REAL time
                if (res.re_status === 1) {
                    let isExpired = false;
                    if (resDate < currentDate) {
                        isExpired = true; // The date was in the past
                    } else if (resDate === currentDate && currentTimeInHours >= (resTimeInHours + durationInHours)) {
                        isExpired = true; // Today, but it has been past the allowed duration since the booking
                    }

                    if (isExpired) {
                        // Automatically queue DB update to change re_status to 0
                        const updateSql = "UPDATE reservation SET re_status = 0 WHERE id = ?";
                        updatePromises.push(queryPromise(updateSql, [res.id]));
                        res.re_status = 0; // Update local memory so it doesn't block the table below!
                    }
                }

                // --- LOGIC 2: AVAILABILITY CHECK (USING CURRENT DATE & TIME) ---
                // We only care if the status is currently 1 (and not expired)
                if (res.re_status === 1 && resDate === currentDate) {

                    // If the CURRENT time falls within the specific DURATION block of the reserved time, mark it unavailable.
                    if (Math.abs(currentTimeInHours - resTimeInHours) < durationInHours) {
                        isAvailable = false;
                        bookingMessage = `Currently Reserved`;
                        break; // Conflict found, table is blocked!
                    }
                }
            }

            return {
                id,
                table_no: stringTableNo,
                person_no: person_no,
                capacity: capacity,
                isAvailable,
                bookingMessage
            };
        });

        // 4. Execute auto-expirations in the background before sending response
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(`Auto-expired ${updatePromises.length} reservations by setting re_status to 0.`);
        }

        // Return the clean data to the frontend in the format Checkout.jsx expects
        res.status(200).json({
            status: true,
            data: processedTables,
            summary: {
                total: processedTables.length,
                available: processedTables.filter(t => t.isAvailable).length,
                unavailable: processedTables.filter(t => !t.isAvailable).length
            }
        });

    } catch (error) {
        console.error("Error processing dine-in tables:", error);
        res.status(500).json({
            status: false,
            message: "Server error calculating table logic.",
            error: error.message
        });
    }
});



// ==========================================
// 2. PLACE ORDER API (To Laravel)
// ==========================================
router.post('/place-order', async (req, res) => {
    try {
        const { branch_id, cust_name, phone, email, address, sub_total, discount, delivery, total, table_no, pay_mtd, items } = req.body;

        if (!phone || !items || items.length === 0) {
            return res.status(400).json({ status: false, message: "Missing required fields" });
        }

        // 1. Get Company Code dynamically
        const settings = await queryPromise("SELECT company_code FROM settings WHERE id = 1");
        const companyCode = settings[0]?.company_code || '26672691';

        // 2. Ensure items is properly formatted as an array of objects
        const formattedItems = items.map(item => ({
            menu_id: parseInt(item.menu_id) || 0,
            menu_name: item.menu_name || '',
            qty: parseInt(item.qty) || 1,
            price: parseFloat(item.price) || 0,
            size: item.size || null // Added size just in case your frontend passes it
        }));

        // 3. Construct the payload
        const laravelPayload = {
            company_id: companyCode,
            branch_id: parseInt(branch_id || 1),
            cust_name: cust_name || "Website Customer",
            phone: phone,
            email: email || null,
            address: address || null,
            sub_total: parseFloat(sub_total || 0),
            discount: parseFloat(discount || 0),
            delivery: parseFloat(delivery || 0),
            total: parseFloat(total || 0),
            table_no: table_no,
            pay_mtd: pay_mtd || "cash",
            items: formattedItems
        };

        console.log("Sending to Laravel API:", JSON.stringify(laravelPayload, null, 2));

        // 4. Send to main Laravel API with proper headers
        const apiUrl = 'https://pos.chulkani.com/website/order';

        const laravelRes = await axios.post(
            apiUrl,
            laravelPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            }
        );

        // ==========================================
        // 5. Insert into api: 'tables' STATUS IF DINE-IN
        // ==========================================
        if (laravelRes.data && laravelRes.data.status === true && table_no) {
            try {

                // ==========================================
                // 1. GET RESTAURANT OPEN/CLOSE SETTINGS
                // ==========================================
                const settingsSql = "SELECT rest_open, rest_close, company_code FROM settings WHERE id = 1";
                const settingsResult = await queryPromise(settingsSql);

                const { rest_open, rest_close } = settingsResult[0] || {};

                if (rest_open && rest_close) {

                    const now = new Date();
                    const currentTotal = now.getHours() * 60 + now.getMinutes();

                    const [openH, openM] = rest_open.split(':').map(Number);
                    const openTotal = openH * 60 + openM;

                    const [closeH, closeM] = rest_close.split(':').map(Number);
                    const closeTotal = closeH * 60 + closeM;

                    let isOpen = false;

                    if (closeTotal > openTotal) {
                        isOpen = currentTotal >= openTotal && currentTotal <= closeTotal;
                    } else {
                        isOpen = currentTotal >= openTotal || currentTotal <= closeTotal;
                    }

                    if (!isOpen) {
                        console.log("Restaurant is closed. Skipping reservation creation.");
                        return;
                    }
                }

                // ==========================================
                // 2. CURRENT DATE + TIME
                // ==========================================
                const now = new Date();

                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');

                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');

                const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                // ==========================================
                // 3. FORMAT TABLE STRING
                // ==========================================
                let tableStr = null;

                if (table_no) {
                    tableStr = Array.isArray(table_no)
                        ? table_no.join(", ")
                        : String(table_no);
                }

                const safeBranchId = (branch_id === "" || branch_id == null)
                    ? null
                    : parseInt(branch_id);

                const safeDuration = 90;

                // ==========================================
                // 4. SEND TO RESERVATION API
                // ==========================================
                const reservationPayload = {
                    re_com_id: companyCode,
                    re_branch_id: safeBranchId,
                    re_table_no: tableStr,
                    re_customer_id: null,
                    re_date: dateTimeString,
                    re_duration: safeDuration,
                    re_status: 0,
                    re_adv_payment: 0
                };

                await axios.post(
                    "https://pos.chulkani.com/reservations",
                    reservationPayload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        timeout: 15000
                    }
                );

                console.log(`Reservation API created for table(s) [${tableStr}]`);

            } catch (reservationError) {

                console.error(
                    "Reservation API error during checkout:",
                    reservationError.response?.data || reservationError.message
                );

            }

            // ==========================================
            // 6. SEND TO CUSTOMER ORDER QUEUES API
            // ==========================================
            try {
                const queueApiUrl = 'https://pos.chulkani.com/branch/order/website/customer-order-queues';

                // Extract order_no if the main API returned it in the response
                const orderNo = laravelRes.data.order_no || laravelRes.data.data?.order_no || null;

                // FIX: Inject the table_no (and parent data) directly into EACH individual item
                const queueItems = formattedItems.map(item => ({
                    ...item,
                    table_no: table_no,
                    company_id: companyCode,
                    branch_id: parseInt(branch_id || 1),
                    order_no: orderNo
                }));

                const queuePayload = {
                    company_id: companyCode,
                    branch_id: parseInt(branch_id || 1),
                    table_no: table_no,
                    order_no: orderNo,
                    items: queueItems // Sending the newly enriched items array
                };

                await axios.post(
                    queueApiUrl,
                    queuePayload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        timeout: 15000 // 15 seconds
                    }
                );

                console.log(`Successfully sent order to customer-order-queues API for table ${table_no}`);
            } catch (queueError) {
                console.error("Error sending to customer-order-queues API:", queueError.message);
                // We just log this and move on, so the user still sees a successful checkout
            }
        }

        return res.status(laravelRes.status).json(laravelRes.data);

    } catch (error) {
        console.error("Laravel API Error Details:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(error.response?.status || 500).json({
            status: false,
            message: error.response?.data?.message || "Order failed at Laravel API",
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;