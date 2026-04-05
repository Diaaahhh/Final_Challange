const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const NodeCache = require("node-cache");
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
// Helper function to wrap db.query in Promises for clean async/await syntax
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

// --- HELPER: Get Company Code ---
const getCompanyCode = () => {
    return new Promise((resolve, reject) => {
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";
        db.query(settingsSql, (err, result) => {
            if (err) return reject(err);
            const code = result[0]?.company_code || '26672691';
            resolve(code);
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
// 2. GET BRANCH LIST
// ==========================================
router.get('/branches', async (req, res) => {
    try {
        const companyCode = await getCompanyCode();
        const apiUrl = `https://pos.chulkani.com/company/all-branch-list/${companyCode}`;
        const response = await axios.get(apiUrl, { headers: { 'Accept': 'application/json' } });

        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            throw new Error("Laravel block");
        }

        let branches = [];
        if (response.data && response.data.data && response.data.data.branches) {
            branches = response.data.data.branches;
        } else if (response.data && Array.isArray(response.data.data)) {
            branches = response.data.data;
        } else if (Array.isArray(response.data)) {
            branches = response.data;
        }

        res.json(branches);
    } catch (error) {
        res.json([]);
    }
});

// ==========================================
// 3. GET TABLES & AVAILABILITY BY BRANCH ID
// ==========================================
router.get('/tables/:branch_id', async (req, res) => {
    try {
        const { branch_id } = req.params;
        const { date: chosenDate, time: chosenTime } = req.query;

        console.log(`\n\n--- 🔍 NEW AVAILABILITY CHECK ---`);
        console.log(`User wants: Branch ${branch_id} on ${chosenDate} at ${chosenTime}`);

        if (!chosenDate || !chosenTime) {
            return res.status(400).json({ error: "Date and Time are required to check table availability." });
        }

        const companyCode = await getCompanyCode();

        const settingsRes = await queryPromise("SELECT table_prelock_duration FROM settings WHERE id = 1");
        let table_prelock_duration = 30; 
        if (settingsRes && settingsRes.length > 0) {
            table_prelock_duration = parseInt(settingsRes[0].table_prelock_duration, 10) || 30;
        }

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
            let skipReservation = false; // Flag to determine if we should remove this from the UI

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
            
            // If the reservation didn't get expired or fulfilled, it remains active!
            if (!skipReservation) {
                validReservations.push(res);
            }
        }
        
        // Overwrite the reservations array with ONLY the active ones
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

                    const [choH, choM] = normalizedChosenTime.split(':').map(Number);
                    const chosenTimeMins = (choH * 60) + choM;

                    console.log(`     ⚖️ MATH CHECK: Is (${resTimeMins} - ${table_prelock_duration}) <= ${chosenTimeMins}?`);
                    console.log(`     ⚖️ Evaluates to: ${resTimeMins - table_prelock_duration} <= ${chosenTimeMins}`);

                    if (resTimeMins - table_prelock_duration <= chosenTimeMins) {
                        console.log(`     🛑 RESULT: Condition MET! Blocking Table ${stringTableNo}.`);
                        isAvailable = false;
                        bookingMessage = Number(targetStatus) === 0 ? `Pending Confirmation` : `Reserved`;
                        break;
                    } else {
                        console.log(`     🟢 RESULT: Condition FAILED. Table stays available.`);
                    }
                } else {
                    console.log(`     ⏭️ SKIPPED: Date doesn't match chosen date (${chosenDate}) OR Status isn't 0/1.`);
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

        res.status(200).json(processedTables);

    } catch (error) {
        console.error("Error processing reservation tables:", error);
        
        // TEMPORARILY SEND THE REAL ERROR TO THE FRONTEND
        res.status(500).json({ 
            error: "Server error calculating table logic.",
            exact_cause: error.message,
            stack_trace: error.stack,
            axios_details: error.response?.data || "Not an Axios error"
        });
    }
});


// ==========================================
// 5. CREATE NEW RESERVATION
// ==========================================
router.post('/create', async (req, res) => {
    try {
        const { branch_id, date, time, table_number, customer_id, duration, advance_payment, re_adv_payment, guest_number, event_name, notes, captchaToken } = req.body;

        const companyCode = await getCompanyCode();

        // --- UNIFIED SETTINGS FETCH (Time Validation & Captcha) ---
        // We fetch rest_open, rest_close, AND captcha in a single query for better performance
        const settingsSql = "SELECT rest_open, rest_close, captcha FROM settings WHERE id = 1";
        const settingsResult = await queryPromise(settingsSql);

        if (settingsResult && settingsResult.length > 0) {
            const { rest_open, rest_close, captcha } = settingsResult[0];

            // ==========================================
            // 1. GOOGLE CAPTCHA VERIFICATION
            // ==========================================
            if (captcha === 1) {
                if (!captchaToken) {
                    return res.status(400).json({ error: "Captcha token is missing." });
                }

                const secretKey = "6LdKm6csAAAAAM2egW4Bn4fccolip7XuVggUbzk7"; // <--- REMEMBER TO ADD YOUR SECRET KEY HERE
                
                const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
                const googleRes = await axios.post(verifyUrl);

                if (!googleRes.data.success) {
                    return res.status(400).json({ error: "Captcha verification failed. Please try again." });
                }
            }

            // ==========================================
            // 2. TIME VALIDATION
            // ==========================================
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
                    const formatTimeAMPM = (timeString) => {
                        const [hourString, minute] = timeString.split(':');
                        let hour = parseInt(hourString, 10);
                        const ampm = hour >= 12 ? 'pm' : 'am';
                        hour = hour % 12 || 12;
                        return `${hour}:${minute} ${ampm}`;
                    };

                    return res.status(400).json({
                        error: `The restaurant remains open from ${formatTimeAMPM(rest_open)} to ${formatTimeAMPM(rest_close)}`
                    });
                }
            }
        }

        // ==========================================
        // 3. FORMAT DATA & PREPARE PAYLOAD
        // ==========================================
        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        const safeBranchId = (branch_id === "" || branch_id === null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration);

        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        let formattedTime = time;
        if (formattedTime && formattedTime.split(':').length === 2) {
            formattedTime = `${formattedTime}:00`;
        }

        let dateTimeString = null;
        if (date && formattedTime) {
            dateTimeString = `${date} ${formattedTime}`;
        }

        const payload = {
            re_com_id: companyCode,
            re_branch_id: safeBranchId,
            re_table_no: tableStr,
            re_customer_id: safeCustomerId,
            re_date: dateTimeString,
            re_duration: safeDuration,
            re_status: 0,
            re_adv_payment: safeAdvPayment,
            re_guest_no: guest_number,
            re_occasion: event_name,
            re_note: notes
        };

        // ==========================================
        // 4. SEND TO CHULKANI RESERVATION API
        // ==========================================
        const apiResponse = await axios.post(
            "https://pos.chulkani.com/reservations",
            payload
        );

        res.status(201).json({
            message: "Reservation created successfully",
            apiResponse: apiResponse.data
        });

    } catch (error) {
        // This will catch Google Captcha errors, Database errors, AND Axios Chulkani API errors safely
        console.error("Error creating reservation:", error.response?.data || error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==========================================
// GET RESERVATION SECURITY SETTINGS
// ==========================================
router.get('/reservation-settings', async (req, res) => {
    try {
        const settings = await queryPromise("SELECT otp, captcha FROM settings WHERE id = 1");
        if (settings && settings.length > 0) {
            return res.status(200).json({ success: true, otp: settings[0].otp, captcha: settings[0].captcha });
        }
        return res.status(200).json({ success: true, otp: 0, captcha: 0 });
    } catch (err) {
        console.error("Settings Fetch Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ==========================================
// POST: Send OTP
// ==========================================
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpCache.set(phone, otp);

    let formattedPhone = phone.replace(/\D/g, ''); 
    if (formattedPhone.startsWith('01') && formattedPhone.length === 11) formattedPhone = '88' + formattedPhone;
    if (!formattedPhone.startsWith('88') && formattedPhone.length === 13) formattedPhone = '88' + formattedPhone;

    try {
        const message = `Your reservation OTP is ${otp}. Please do not share this with anyone.`;
        const apiUrl = `http://sms.iglweb.com/api/v1/send?api_key=4451773340833151773340833&contacts=${formattedPhone}&senderid=01844532630&msg=${encodeURIComponent(message)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });
        
        if (response.ok) return res.json({ success: true, message: "OTP sent successfully" });
        return res.status(500).json({ success: false, message: "Failed to send OTP. Gateway rejected." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Error: Could not reach SMS Gateway" });
    }
});

// ==========================================
// POST: Verify OTP
// ==========================================
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const cachedOtp = otpCache.get(phone);

    if (!cachedOtp) return res.status(400).json({ success: false, message: "OTP expired or never requested." });

    if (cachedOtp === otp) {
        otpCache.del(phone);
        return res.json({ success: true, message: "Phone verified successfully" });
    } else {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});



// ==========================================
// 6. READ ALL RESERVATIONS
// ==========================================
router.get('/list', (req, res) => {
    const sql = "SELECT * FROM reservation ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// 7. DELETE RESERVATION
// ==========================================
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM reservation WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

// ==========================================
// 8. UPDATE RESERVATION (FIXED WITH DB SANITIZATION)
// ==========================================
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { branch_id, table_number, customer_id, date, time, duration, status, advance_payment, re_adv_payment } = req.body;

        let tableStr = null;
        if (table_number) {
            tableStr = Array.isArray(table_number) ? table_number.join(", ") : String(table_number);
        }

        const safeBranchId = (branch_id === "" || branch_id == null) ? null : parseInt(branch_id);
        const safeCustomerId = (customer_id === "" || customer_id == null) ? null : parseInt(customer_id);
        const safeDuration = (duration === "" || duration == null) ? 90 : parseInt(duration);
        const safeStatus = (status === "" || status == null) ? 0 : parseInt(status);

        const rawPayment = advance_payment !== undefined ? advance_payment : re_adv_payment;
        const safeAdvPayment = (rawPayment && !isNaN(parseFloat(rawPayment))) ? parseFloat(rawPayment) : 0.00;

        let dateTimeString = null;
        if (date && time) {
            let formattedTime = time;
            if (formattedTime.split(':').length === 2) {
                formattedTime = `${formattedTime}:00`;
            }
            dateTimeString = `${date} ${formattedTime}`;
        }

        const sql = `
            UPDATE reservation 
            SET 
                re_branch_id = ?, 
                re_table_no = ?, 
                re_customer_id = ?, 
                re_date = ?, 
                re_duration = ?, 
                re_status = ?,
                re_adv_payment = ?
            WHERE id = ?`;

        const values = [
            safeBranchId,
            tableStr,
            safeCustomerId,
            dateTimeString,
            safeDuration,
            safeStatus,
            safeAdvPayment,
            id
        ];

        await queryPromise(sql, values);
        res.json({ message: "Updated successfully" });

    } catch (error) {
        console.error("Update DB Error:", error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;