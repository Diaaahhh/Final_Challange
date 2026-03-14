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
        // 1. Fetch tables from External API
        const tablesResponse = await axios.get(`https://pos.chulkani.com/branch/order/website/table?company_id=${company_id}&branch_id=${branch_id}`);
        
        let tables = [];
        if (tablesResponse.data && tablesResponse.data.status === true) {
            tables = tablesResponse.data.data || [];
        }

        // 2. Fetch occupied tables from External API (customer_order_queues)
        const queueApiUrl = `https://pos.chulkani.com/branch/order/website/customer-order-queues?company_id=${company_id}&branch_id=${branch_id}`;
        const queueResponse = await axios.get(queueApiUrl);
        
        // Create a Set of occupied table numbers from queues
        const occupiedQueueSet = new Set();

        if (queueResponse.data && queueResponse.data.status === true && Array.isArray(queueResponse.data.data)) {
            const invalidTableTypes = ['Home delivery', 'Take a way', 'Parcel'];
            
            const queueResults = queueResponse.data.data.filter(row => 
                row.table_no && 
                !invalidTableTypes.includes(row.table_no)
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

        // 3. Get current date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        const currentTimeInHours = now.getHours() + (now.getMinutes() / 60);

        console.log(`Current Date: ${currentDate}, Current Time: ${currentTimeInHours} hours`);

        // 4. Process each table according to the logic AND sync changes to external database
        const updatePromises = []; // Array to hold background update requests

        const processedTables = tables.map(table => {
            let { 
                id, 
                table_no, 
                status, 
                date: tableDate, 
                time: tableTime 
            } = table;
            
            let isAvailable = false;
            let bookingMessage = null;
            let finalStatus = parseInt(status) || 0;
            let finalDate = tableDate;
            let finalTime = tableTime;
            
            const stringTableNo = String(table_no).trim();

            // Format table date if it contains a timestamp
            let formattedTableDate = tableDate;
            if (tableDate && tableDate.includes('T')) {
                formattedTableDate = tableDate.split('T')[0];
            }

            // Helper function to check if table exists in queue
            const isInQueue = () => occupiedQueueSet.has(stringTableNo);

            // --- LOGIC IMPLEMENTATION ---

            // CASE 1: Status 0 - Always Available
            if (finalStatus === 0) {
                isAvailable = true;
            }
            
            // CASE 2: Status 1 - Check Queue
            else if (finalStatus === 1) {
                if (isInQueue()) {
                    isAvailable = false; // Table is occupied in queue
                } else {
                    // Not in queue, change to status 0 and make available
                    finalStatus = 0;
                    finalDate = null;
                    finalTime = null;
                    isAvailable = true;
                }
            }
            
            // CASE 3: Status 2 - Complex Logic with Date/Time
            else if (finalStatus === 2) {
                // Check if date matches
                if (currentDate !== formattedTableDate) {
                    // Dates don't match -> Table is available with booking info
                    isAvailable = true;
                    bookingMessage = `Booked on ${formattedTableDate || 'Unknown'} at ${tableTime || 'Unknown'}`;
                } else {
                    // Dates match -> Compare time
                    let tableTimeInHours = 0;
                    if (tableTime && typeof tableTime === 'string') {
                        const parts = tableTime.split(':');
                        tableTimeInHours = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
                    }
                    
                    const timeDiff = tableTimeInHours - currentTimeInHours;
                    
                    if (timeDiff > 0) {
                        // Future booking - Table is available with booking info
                        isAvailable = true;
                        bookingMessage = `Booked today at ${tableTime}`;
                    } 
                    else if (timeDiff <= 0 && timeDiff > -0.5) {
                        // Within -0.5 hours (30 mins) of booking time - Not available
                        isAvailable = false;
                    } 
                    else {
                        // More than 0.5 hours past booking time - Check queue
                        if (isInQueue()) {
                            // Table is in queue - change to status 1, follow status 1 rules
                            finalStatus = 1;
                            isAvailable = false;
                        } else {
                            // Not in queue - change to status 0 (booking expired and empty)
                            finalStatus = 0;
                            finalDate = null;
                            finalTime = null;
                            isAvailable = true;
                        }
                    }
                }
            }

            // ==========================================
            // AUTO-SYNC TO LARAVEL: If our logic changed the status, date, or time, 
            // push an update request to the external API so the database stays perfectly in sync!
            // ==========================================
            const originalStatus = parseInt(status) || 0;
            if (finalStatus !== originalStatus || finalDate !== tableDate || finalTime !== tableTime) {
                
                const tablePayload = {
                    company_id: company_id,
                    branch_id: branch_id,
                    table_no: stringTableNo,
                    person_no: table.person_no || null,
                    status: finalStatus,
                    date: finalDate,
                    time: finalTime
                };

                const updateApiUrl = `https://pos.chulkani.com/branch/order/website/table/update/${id}`;

                // Push this request into our array to be executed
                const syncRequest = axios.post(
                    updateApiUrl,
                    tablePayload,
                    { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, timeout: 10000 }
                ).catch(err => {
                    console.error(`Failed to auto-sync table ${stringTableNo}:`, err.message);
                });

                updatePromises.push(syncRequest);
            }

            return {
                id,
                table_no: stringTableNo,
                person_no: table.person_no,
                capacity: table.capacity,
                status: finalStatus,
                date: finalDate,
                time: finalTime,
                isAvailable,
                bookingMessage
            };
        });

        // 5. Execute any required database auto-syncs simultaneously before responding
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(`Auto-synced ${updatePromises.length} tables in external database to correct their status.`);
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
// GET OCCUPIED Reservation TABLES (Keep existing for backward compatibility)
// ==========================================
// router.get('/get-occupied-tables/:company_id/:branch_id', async (req, res) => {
//     const { company_id, branch_id } = req.params;

//     try {
//         // Fetch occupied tables from External API
//         const apiUrl = `https://pos.chulkani.com/branch/order/website/customer-order-queues?company_id=${company_id}&branch_id=${branch_id}`;
//         const apiResponse = await axios.get(apiUrl);
        
//         let queueResults = [];
//         if (apiResponse.data && apiResponse.data.status === true && Array.isArray(apiResponse.data.data)) {
//             const invalidTableTypes = ['Home delivery', 'Take a way', 'Parcel'];
            
//             queueResults = apiResponse.data.data.filter(row => 
//                 row.table_no && 
//                 !invalidTableTypes.includes(row.table_no)
//             );
//         }

//         // Fetch reservations from local DB
//         const reserveSql = `
//             SELECT table_number 
//             FROM reservation 
//             WHERE branch_id = ?
//               AND table_number IS NOT NULL 
//               AND table_number != ''
//         `;
//         const reserveResults = await queryPromise(reserveSql, [branch_id]);

//         const occupiedSet = new Set();

//         // Process the external API queue results
//         queueResults.forEach(row => {
//             if (row.table_no) {
//                 String(row.table_no).split(',').forEach(t => {
//                     const trimmed = t.trim();
//                     if (trimmed) occupiedSet.add(trimmed);
//                 });
//             }
//         });

//         // Process the local DB reservation results
//         reserveResults.forEach(row => {
//             if (row.table_number) {
//                 String(row.table_number).split(',').forEach(t => {
//                     const trimmed = t.trim();
//                     if (trimmed) occupiedSet.add(trimmed);
//                 });
//             }
//         });
        
//         res.status(200).json(Array.from(occupiedSet));
//     } catch (error) {
//         console.error("Error fetching occupied tables:", error.message);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

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
           // ==========================================
            // 5. UPDATE EXTERNAL 'tables' STATUS IF DINE-IN
            // ==========================================
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