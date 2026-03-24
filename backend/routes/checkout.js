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
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    try {
        const dataUsers = await queryPromise("SELECT * FROM users WHERE phone = ?", [phone]);
        if (dataUsers.length > 0) return res.status(200).json(dataUsers[0]);

        const dataCustomers = await queryPromise("SELECT * FROM customers WHERE phone = ?", [phone]);
        if (dataCustomers.length > 0) return res.status(200).json(dataCustomers[0]);

        return res.status(404).json({ message: "User not found" });
    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ==========================================
// GET: Fetch and Validate Dine-in Tables
// ==========================================
router.get('/get-dine-in-tables/:company_id/:branch_id', async (req, res) => {
    const { company_id, branch_id } = req.params;

    try {
        // 1. Fetch ALL tables from External API
        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${company_id}&branch_id=${branch_id}`);
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 2. Fetch occupied tables from External API (customer_order_queues)
        const queueApiUrl = `https://pos.chulkani.com/branch/order/website/customer-order-queues?company_id=${company_id}&branch_id=${branch_id}`;
        const queueResponse = await axios.get(queueApiUrl);
        
        const occupiedQueueSet = new Set();
        if (queueResponse.data && queueResponse.data.status === true && Array.isArray(queueResponse.data.data)) {
            const invalidTableTypes = ['Home delivery', 'Take a way', 'Parcel'];
            const queueResults = queueResponse.data.data.filter(row => 
                row.table_no && !invalidTableTypes.includes(row.table_no)
            );

            queueResults.forEach(row => {
                if (row.table_no) {
                    String(row.table_no).split(',').forEach(t => {
                        const trimmed = t.trim();
                        if (trimmed) occupiedQueueSet.add(trimmed);
                    });
                }
            });
        }

        // 3. Fetch LOCAL reservations for this branch
        const reservations = await queryPromise("SELECT * FROM reservation WHERE branch_id = ?", [branch_id]);

        // 4. Get CURRENT date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        const currentTimeInHours = now.getHours() + (now.getMinutes() / 60);

        console.log(`Current Date: ${currentDate}, Current Time: ${currentTimeInHours.toFixed(2)} hours`);

        const deletionPromises = []; // Array to hold expired reservation deletions

        // 5. Process each table according to the NEW logic
        const processedTables = tables.map(table => {
            let { 
                id, 
                table_no, 
                status, 
                capacity,
                person_no 
            } = table;
            
            const stringTableNo = String(table_no).trim();
            let isAvailable = true;
            let bookingMessage = null;
            let finalStatus = parseInt(status) || 0;

            const isInQueue = () => occupiedQueueSet.has(stringTableNo);

            // --- LOGIC IMPLEMENTATION ---

            // STEP 1: Check the status column from table: "tables" using API
            if (finalStatus === 1) {
                isAvailable = false;
            } else {
                // STEP 2: Find if this specific table has any local reservations
                const tableReservations = reservations.filter(res => {
                    if (!res.table_number) return false;
                    const resTables = String(res.table_number).split(',').map(t => t.trim());
                    return resTables.includes(stringTableNo);
                });

                // Loop through all reservations for this table to check for conflicts
                for (const reservation of tableReservations) {
                    const resDate = reservation.date;
                    const resTime = reservation.time;

                    // If Dates don't match, it is available (no action needed, remains true)
                    if (currentDate === resDate) {
                        // Dates match -> Compare time
                        let resTimeInHours = 0;
                        if (resTime && typeof resTime === 'string') {
                            const parts = resTime.split(':');
                            resTimeInHours = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
                        }

                        // Condition A: If column "time" is greater than or equal to (current time + 30 minutes) -> Available
                        if (resTimeInHours >= (currentTimeInHours + 0.5)) {
                            // isAvailable remains true
                            bookingMessage = `Reserved later today at ${resTime}`;
                        }
                        // Condition B: If column "time" is less or equal current time AND current time is less than (column "time" + 30 minutes) -> Unavailable
                        else if (resTimeInHours <= currentTimeInHours && currentTimeInHours < (resTimeInHours + 0.5)) {
                            isAvailable = false;
                            bookingMessage = `Currently Reserved (Awaiting arrival)`;
                            break; // Conflict found, no need to check other reservations for this table
                        }
                        // Condition C: If current time is greater than (column "time" + 30 minutes)
                        else if (currentTimeInHours >= (resTimeInHours + 0.5)) {
                            // Check inside Table: customer_order_queues
                            if (isInQueue()) {
                                // Exists in queue -> Unavailable
                                isAvailable = false;
                                break;
                            } else {
                                // Not in queue -> Available AND Remove the row from local table: "reservation"
                                // isAvailable remains true
                                const deleteSql = "DELETE FROM reservation WHERE id = ?";
                                const deleteReq = queryPromise(deleteSql, [reservation.id])
                                    .then(() => console.log(`Deleted expired No-Show reservation ID: ${reservation.id} for table ${stringTableNo}`))
                                    .catch(err => console.error(`Failed to delete reservation ID ${reservation.id}:`, err));
                                
                                deletionPromises.push(deleteReq);
                            }
                        }
                    }
                }
            }

            return {
                id,
                table_no: stringTableNo,
                person_no: person_no,
                capacity: capacity,
                status: finalStatus,
                isAvailable,
                bookingMessage
            };
        });

        // 6. Execute any required local database deletions (No-shows)
        if (deletionPromises.length > 0) {
            await Promise.all(deletionPromises);
            console.log(`Cleaned up ${deletionPromises.length} expired reservations from local DB.`);
        }

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
        // 5. UPDATE LOCAL 'tables' STATUS IF DINE-IN
        // ==========================================
        if (laravelRes.data && laravelRes.data.status === true && table_no) {
            try {
                // Get current local date and time
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const currentDate = `${year}-${month}-${day}`; 

                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const currentTime = `${hours}:${minutes}:${seconds}`;

                // Split "10, 20" into an array ['10', '20']
                const tableArray = String(table_no).split(',').map(t => t.trim());
                
                // 1. Fetch ALL tables from the external API to find the exact 'id's
                const getTablesUrl = `https://pos.chulkani.com/branch/order/website/table?company_id=${companyCode}&branch_id=${parseInt(branch_id || 1)}`;
                const externalTablesRes = await axios.get(getTablesUrl);
                
                let tableRecords = [];
                if (externalTablesRes.data && externalTablesRes.data.status === true) {
                    const allExternalTables = externalTablesRes.data.data || [];
                    
                    // Filter the API response to only keep the tables the user selected
                    tableRecords = allExternalTables.filter(apiTable => 
                        tableArray.includes(String(apiTable.table_no).trim())
                    );
                }

                // 2. Create an array of API requests using the fetched IDs
                const updatePromises = tableRecords.map(record => {
                    // FIX: Sending a full payload to satisfy Laravel's 422 validation rules
                    const tablePayload = {
                        company_id: companyCode,
                        branch_id: parseInt(branch_id || 1),
                        table_no: record.table_no, // Sending back the exact table_no
                        person_no: record.person_no || null,
                        status: 1,
                        date: currentDate,
                        time: currentTime
                    };

                    // Dynamically inject the fetched table ID into the URL
                    const updateApiUrl = `https://pos.chulkani.com/branch/order/website/table/update/${record.id}`;

                    // Using POST to hit the update endpoint
                    return axios.post(
                        updateApiUrl, 
                        tablePayload,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            timeout: 15000
                        }
                    );
                });

                // 3. Execute all table update requests simultaneously
                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                    console.log(`External API: Tables [${tableRecords.map(t => t.table_no).join(', ')}] status updated via /update/<id> endpoint.`);
                } else {
                    console.warn(`Could not find external IDs for tables: ${table_no}`);
                }

            } catch (apiError) {
                // To help debug if it fails again, log the exact validation errors from Laravel
                if (apiError.response && apiError.response.data) {
                    console.error("Error updating external tables API (422 Details):", JSON.stringify(apiError.response.data, null, 2));
                } else {
                    console.error("Error updating external tables API:", apiError.message);
                }
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