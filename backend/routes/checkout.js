const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const NodeCache = require("node-cache");
// Initialize cache: OTPs will automatically self-destruct after 300 seconds (5 minutes)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
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
                    customer_id: matchedCustomer.cust_id,

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
// 2. GET TABLES & AVAILABILITY BY BRANCH ID
// ==========================================
router.get('/get-dine-in-tables/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;

        // --- FIX: Fetch Company Code internally from DB ---
        const settings = await queryPromise("SELECT company_code FROM settings WHERE id = 1");
        const companyCode = settings[0]?.company_code || '26672691';
        // --- NEW: Generate Current Date and Time (Asia/Dhaka) Internally ---
        const currentDateObj = new Date();
        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false });

        const chosenDate = dateFormatter.format(currentDateObj);
        const chosenTime = timeFormatter.format(currentDateObj);

        console.log(`\n\n--- 🔍 NEW LIVE AVAILABILITY CHECK ---`);
        console.log(`System checking: Branch ${branch_id} for RIGHT NOW (${chosenDate} at ${chosenTime})`);


        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${companyCode}&branch_id=${branch_id}`);
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 1. FETCH RESERVATIONS
        let reservations = [];
        try {
            const reservationApi = `https://pos.chulkani.com/reservations?company_id=${companyCode}&branch_id=${branch_id}`;
            console.log(`📡 Fetching live reservations from: ${reservationApi}`);

            const reservationResponse = await axios.get(reservationApi, {
                headers: { 'Accept': 'application/json' }
            });

            if (
                reservationResponse.data &&
                reservationResponse.data.data &&
                Array.isArray(reservationResponse.data.data.data)
            ) {
                reservations = reservationResponse.data.data.data;
            }
            else if (reservationResponse.data && Array.isArray(reservationResponse.data.data)) {
                reservations = reservationResponse.data.data;
            }
            else if (Array.isArray(reservationResponse.data)) {
                reservations = reservationResponse.data;
            }

            console.log(`✅ Success! Fetched ${reservations.length} reservations from API.`);

        } catch (apiError) {
            console.error("❌ Failed to fetch reservations from API:", apiError.message);
        }

        // 2. FETCH ORDERS
        let orders = [];
        try {
            const ordersApi = `https://pos.chulkani.com/api/website/order?company_id=${companyCode}&branch_id=${branch_id}`;
            console.log(`📡 Fetching live orders from: ${ordersApi}`);

            const ordersResponse = await axios.get(ordersApi, {
                headers: { 'Accept': 'application/json' }
            });

            if (ordersResponse.data && ordersResponse.data.status === true && Array.isArray(ordersResponse.data.data)) {
                orders = ordersResponse.data.data;
            }

            console.log(`✅ Success! Fetched ${orders.length} orders from API.`);

        } catch (apiError) {
            console.error("❌ Failed to fetch orders from API:", apiError.message);
        }

        // ==========================================
        // 3. AUTO-EXPIRE & FULFILL RESERVATIONS
        // ==========================================
        const validReservations = [];
        const nowMs = Date.now();
        const THIRTY_MINS_MS = 30 * 60 * 1000;

        for (const res of reservations) {
            const targetStatus = res.status !== undefined ? res.status : res.re_status;
            const targetCreateAt = res.created_at || res.re_create_at;
            let skipReservation = false;

            // CONDITION A: Auto-expire Pending (Status 0) after 30 mins
            if (Number(targetStatus) === 0 && targetCreateAt) {
                const createAtMs = new Date(targetCreateAt).getTime();

                if (nowMs - createAtMs >= THIRTY_MINS_MS) {
                    console.log(`⏳ Auto-expiring Reservation ID [${res.id}] (Pending for >30 mins)...`);
                    try {
                        await axios.put(`https://pos.chulkani.com/reservations/${res.id}`, {
                            re_status: 3
                        });
                        console.log(`✅ Successfully updated Reservation ID [${res.id}] to status 3 (Expired)`);
                    } catch (updateErr) {
                        console.error(`❌ Failed to update Reservation ID [${res.id}]:`, updateErr.message);
                    }
                    skipReservation = true;
                }
            }

            // CONDITION B: Auto-fulfill Confirmed (Status 1) if matching Order has Status 1
            if (!skipReservation && Number(targetStatus) === 1) {
                const matchingOrder = orders.find(o =>
                    Number(o.ord_res_id) === Number(res.id) &&
                    Number(o.ord_status) === 1
                );

                if (matchingOrder) {
                    console.log(`🍽️ Found completed order for Reservation ID [${res.id}]. Auto-updating status to 3...`);
                    try {
                        await axios.put(`https://pos.chulkani.com/reservations/${res.id}`, {
                            re_status: 3
                        });
                        console.log(`✅ Successfully fulfilled Reservation ID [${res.id}] to status 3`);
                    } catch (updateErr) {
                        console.error(`❌ Failed to update fulfilled Reservation ID [${res.id}]:`, updateErr.message);
                    }
                    skipReservation = true;
                }
            }

            if (!skipReservation) {
                validReservations.push(res);
            }
        }

        reservations = validReservations;

        // ==========================================
        // 4. PROCESS TABLES
        // ==========================================
        const normalizedChosenTime = chosenTime.substring(0, 5);

        const processedTables = tables.map(table => {
            let { id, table_no, capacity, person_no } = table;
            const stringTableNo = String(table_no).trim();

            let isAvailable = true;
            let bookingMessage = null;

            const tableReservations = reservations.filter(res => {
                const targetTableNo = res.table_no || res.re_table_no;
                if (!targetTableNo) return false;
                const resTables = String(targetTableNo).split(',').map(t => t.trim());
                return resTables.includes(stringTableNo);
            });

            if (tableReservations.length > 0) {
                console.log(`\n👉 Checking Table ${stringTableNo} (Has ${tableReservations.length} associated valid reservations)`);
            }

            for (const res of tableReservations) {
                let resDate = "";
                let resTime = "";

                const targetDate = res.date || res.re_date;

                if (targetDate) {
                    if (String(targetDate).includes('Z')) {
                        const dateObj = new Date(targetDate);
                        const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' });
                        const timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false });
                        resDate = dateFormatter.format(dateObj);
                        resTime = timeFormatter.format(dateObj);
                    } else {
                        const parts = String(targetDate).split(/T|\s/);
                        resDate = parts[0];
                        if (parts[1]) {
                            resTime = parts[1].substring(0, 5);
                        }
                    }
                }

                const targetStatus = res.status !== undefined ? res.status : res.re_status;

                console.log(`  -> Res ID [${res.id}]: Status=${targetStatus}, Date=${resDate}, Time=${resTime}`);

                if ((Number(targetStatus) === 0 || Number(targetStatus) === 1) && resDate === chosenDate) {
                    const [resH, resM] = resTime.split(':').map(Number);
                    const resTimeMins = (resH * 60) + resM;
                    const resDuration = parseInt(res.duration || res.re_duration || 90, 10); // Default to 90 mins if missing

                    const [choH, choM] = normalizedChosenTime.split(':').map(Number);
                    const currentTimeMins = (choH * 60) + choM;

                    console.log(`     ⚖️ LIVE CHECK: Is current time (${currentTimeMins} mins) between res start (${resTimeMins} mins) and end (${resTimeMins + resDuration} mins)?`);

                    // --- NEW LOGIC: Block table if current time falls within the reservation duration ---
                    if (currentTimeMins >= resTimeMins && currentTimeMins <= (resTimeMins + resDuration)) {
                        console.log(`     🛑 RESULT: Table ${stringTableNo} is currently occupied!`);
                        isAvailable = false;
                        bookingMessage = Number(targetStatus) === 0 ? `Pending Confirmation` : `Reserved`;
                        break;
                    } else {
                        console.log(`     🟢 RESULT: Table is free right now.`);
                    }
                } else {
                    console.log(`     ⏭️ SKIPPED: Date doesn't match today (${chosenDate}) OR Status isn't 0/1.`);
                }
            }

            if (tableReservations.length > 0) {
                console.log(`[FINAL STATUS] Table ${stringTableNo} isAvailable: ${isAvailable}`);
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

        res.status(200).json({
            status: true,
            data: processedTables
        });
    } catch (error) {
        console.error("Error processing reservation tables:", error);
        res.status(500).json({
            error: "Server error calculating table logic.",
            exact_cause: error.message,
            stack_trace: error.stack,
            axios_details: error.response?.data || "Not an Axios error"
        });
    }
});


// ==========================================
// 3. PLACE ORDER API (To Laravel)
// ==========================================
router.post('/place-order', async (req, res) => {
    try {
        const { branch_id, cust_name, customer_id, phone, email, address, sub_total, order_method, discount, delivery, total, table_no, pay_mtd, captcha, items } = req.body;

        if (!phone || !items || items.length === 0) {
            return res.status(400).json({ status: false, message: "Missing required fields" });
        }

        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);

        // ==========================================
        // 1. Get Company Code + Captcha Setting
        // ==========================================
        const settings = await queryPromise("SELECT company_code, captcha FROM settings WHERE id = 1");

        const companyCode = settings[0]?.company_code || '26672691';
        const isCaptchaEnabled = settings[0]?.captcha === 1;

        // ==========================================
        // 2. CAPTCHA VERIFICATION
        // ==========================================
        if (isCaptchaEnabled) {

            if (!captcha) {
                return res.status(400).json({
                    status: false,
                    message: "Captcha required"
                });
            }

            try {
                const secret = '6LdKm6csAAAAAM2egW4Bn4fccolip7XuVggUbzk7';

                const captchaRes = await axios.post(
                    `https://www.google.com/recaptcha/api/siteverify`,
                    null,
                    {
                        params: {
                            secret: secret,
                            response: captcha
                        }
                    }
                );

                if (!captchaRes.data.success) {
                    return res.status(400).json({
                        status: false,
                        message: "Captcha verification failed"
                    });
                }

            } catch (captchaError) {
                console.error("Captcha verification error:", captchaError.message);
                return res.status(500).json({
                    status: false,
                    message: "Captcha verification error"
                });
            }
        }

        // ==========================================
        // 3. CHECK AND UPDATE CUSTOMER ADDRESS
        // ==========================================
        if (safeCustomerId && address) {
            try {
                const custApiUrl = `https://pos.chulkani.com/branch/all_customer?company_id=${companyCode}`;
                const custRes = await axios.get(custApiUrl, { headers: { 'Accept': 'application/json' } });

                if (custRes.data && custRes.data.success && Array.isArray(custRes.data.data)) {

                    const matchedCustomer = custRes.data.data.find(c => String(c.phone) === String(phone));

                    if (matchedCustomer) {
                        const oldAddress = (matchedCustomer.address || "").trim();
                        const newAddress = address.trim();

                        if (oldAddress !== newAddress) {

                            console.log(`🔄 Address changed from "${oldAddress}" to "${newAddress}". Updating customer Primary ID: ${matchedCustomer.id}...`);

                            const updateCustomerPayload = {
                                company_id: companyCode,
                                branch_id: parseInt(branch_id || 1),
                                name: cust_name || matchedCustomer.name || "Website Customer",
                                phone: phone,
                                address: newAddress
                            };

                            const safeEmail = email || matchedCustomer.email;
                            if (safeEmail && safeEmail.trim() !== "") {
                                updateCustomerPayload.email = safeEmail.trim();
                            }

                            await axios.post(
                                `https://pos.chulkani.com/branch/update_customer/${matchedCustomer.id}`,
                                updateCustomerPayload,
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json'
                                    },
                                    timeout: 15000
                                }
                            );

                            console.log(`✅ Customer ${matchedCustomer.id} address updated successfully.`);
                        }
                    }
                }

            } catch (updateErr) {
                console.error("⚠️ Failed to check/update customer address:", updateErr.response?.data || updateErr.message);
            }
        }

        // ==========================================
        // 4. FORMAT ORDER ITEMS
        // ==========================================
        const formattedItems = items.map(item => ({
            menu_id: parseInt(item.menu_id) || 0,
            menu_name: item.menu_name || '',
            qty: parseInt(item.qty) || 1,
            price: parseFloat(item.price) || 0,
            size: item.size || null
        }));

        // ==========================================
        // 5. CONSTRUCT LARAVEL PAYLOAD
        // ==========================================
        const laravelPayload = {
            company_id: companyCode,
            branch_id: parseInt(branch_id || 1),
            customer_id: safeCustomerId,
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
            ord_status: 0,
            items: formattedItems
        };

        console.log("Sending to Laravel API:", JSON.stringify(laravelPayload, null, 2));

        // ==========================================
        // 6. SEND ORDER TO LARAVEL
        // ==========================================
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
        // 6. Insert into api: 'reservation' STATUS IF DINE-IN
        // ==========================================
        if (laravelRes.data && laravelRes.data.status === true && table_no && order_method == "Dine-in") {
            try {
                // GET RESTAURANT OPEN/CLOSE SETTINGS
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
                        return res.status(laravelRes.status).json(laravelRes.data); // Exit block if closed
                    }
                }

                // CURRENT DATE + TIME
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');

                const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                // FORMAT TABLE STRING
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

                // SEND TO RESERVATION API
                const reservationPayload = {
                    re_com_id: companyCode,
                    re_branch_id: safeBranchId,
                    re_table_no: tableStr,
                    re_customer_id: safeCustomerId,
                    re_date: currentDateTime,
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


// ==========================================
// 4. POST: Send OTP (USING REAL CACHE)
// ==========================================
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone required" });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // STORE IN CACHE: Set phone as the key, and otp as the value. 
    // It will automatically expire and delete itself after 5 minutes.
    otpCache.set(phone, otp);

    // Format phone number to required format (8801XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
        formattedPhone = '88' + formattedPhone;
    }
    // If already has 88 at start, keep as is
    if (!formattedPhone.startsWith('88') && formattedPhone.length === 13) {
        formattedPhone = '88' + formattedPhone;
    }

    try {
        const message = `Your checkout OTP is ${otp}. Please do not share this with anyone.`;
        const apiUrl = `http://sms.iglweb.com/api/v1/send?api_key=4451773340833151773340833&contacts=${formattedPhone}&senderid=01844532630&msg=${encodeURIComponent(message)}`;
        
        console.log("Sending OTP to:", formattedPhone);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });
        
        const responseText = await response.text(); 
        console.log("SMS API Response:", responseText);
        
        if (response.ok) {
            return res.json({ success: true, message: "OTP sent successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to send OTP. Gateway rejected the request." });
        }

    } catch (error) {
        console.error("\n=== 🔴 FETCH CRASH REPORT ===");
        console.error("Error Message:", error.message);
        return res.status(500).json({ success: false, message: "Internal Error: Could not reach SMS Gateway" });
    }
});

// ==========================================
// 5. POST: Verify OTP
// ==========================================
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    // Retrieve the OTP from the cache
    const cachedOtp = otpCache.get(phone);

    if (!cachedOtp) {
        return res.status(400).json({ 
            success: false, 
            message: "OTP expired or never requested. Please click Resend." 
        });
    }

    if (cachedOtp === otp) {
        // Success! Immediately delete it from cache so it can't be used twice
        otpCache.del(phone);
        return res.json({ success: true, message: "Phone verified successfully" });
    } else {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});


// ==========================================
// GET CHECKOUT SECURITY SETTINGS
// ==========================================
router.get('/checkout-settings', async (req, res) => {
    try {
        // Fetch the otp and captcha columns from the first row
        const settings = await queryPromise("SELECT otp, captcha FROM settings WHERE id = 1");
        
        if (settings && settings.length > 0) {
            return res.status(200).json({
                success: true,
                otp: settings[0].otp,         // Will be 1 (enabled) or 0 (disabled)
                captcha: settings[0].captcha  // Will be 1 (enabled) or 0 (disabled)
            });
        }
        
        // Fallback if the row doesn't exist
        return res.status(200).json({ success: true, otp: 0, captcha: 0 });
    } catch (err) {
        console.error("Settings Fetch Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});


module.exports = router;