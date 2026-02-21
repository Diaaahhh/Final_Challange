const express = require('express');
const router = express.Router();
const db = require('../db'); 

// Helper function to wrap db.query in Promises for clean async/await syntax
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
router.get('/get-user-by-phone/:phone', (req, res) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const sqlUsers = "SELECT * FROM users WHERE phone = ?";
    
    db.query(sqlUsers, [phone], (errUsers, dataUsers) => {
        if (errUsers) {
            console.error("Database Error (users table):", errUsers);
            return res.status(500).json({ message: "Internal Server Error" });
        }
        
        if (dataUsers.length > 0) {
            return res.status(200).json(dataUsers[0]);
        } else {
            const sqlCustomers = "SELECT * FROM customers WHERE phone = ?";
            db.query(sqlCustomers, [phone], (errCustomers, dataCustomers) => {
                if (errCustomers) {
                    console.error("Database Error (customers table):", errCustomers);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                if (dataCustomers.length > 0) {
                    return res.status(200).json(dataCustomers[0]);
                } else {
                    return res.status(404).json({ message: "User not found" });
                }
            });
        }
    });
});

// ==========================================
// 2. PLACE ORDER
// ==========================================
router.post('/save-customer-data', async (req, res) => {
    try {
        const { cust_name, phone, items } = req.body;

        console.log("Received order request:", { cust_name, phone });

        if (!cust_name || !phone || !items || items.length === 0) {
            return res.status(400).json({ message: "Missing required order information." });
        }

        const firstItem = items[0];
        const branch_id = req.body.branch_id || (firstItem?.branchId || firstItem?.m_branch_id || 1);
        
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";

        db.query(settingsSql, async (err, result) => {
            if (err || !result || result.length === 0) {
                console.error("DB Error: Settings missing or error:", err);
                return res.status(500).json({ 
                    success: false, 
                    error: "Failed to process request: Settings not found or database error." 
                });
            }

            const companyCode = result[0].company_code;
            console.log("Found settings - Company Code:", companyCode);
            
            // Start the checkout flow
            checkAndCreateCustomer(req, res, companyCode, branch_id);
        });
    } catch (error) {
        console.error("Unexpected error in place-order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// ==========================================
// CUSTOMER CREATION LOGIC
// ==========================================
function checkAndCreateCustomer(req, res, companyCode, branch_id) {
    const { cust_name, phone, address, email, is_logged_in } = req.body;

    const checkCustSql = `SELECT id FROM customers WHERE company_id = ? AND phone = ?`;

    db.query(checkCustSql, [companyCode, phone], async (checkErr, checkRows) => {
        if (checkErr) {
            console.error("Customer Check Error:", checkErr);
            return res.status(500).json({ success: false, message: "Database error during customer validation." });
        }

        if (!checkRows || checkRows.length === 0) {
            console.log("Customer not found. Creating new record...");

            const descTableSql = "DESCRIBE customers";
            db.query(descTableSql, (descErr, descResult) => {
                if (descErr) {
                    console.error("Error describing customers table:", descErr);
                    return res.status(500).json({ success: false, message: "System Error: Table check failed." });
                }

                const columns = descResult.map(col => col.Field);
                const insertFields = [];
                const insertValues = [];
                const placeholders = [];

                if (columns.includes('company_id')) {
                    insertFields.push('company_id');
                    insertValues.push(companyCode);
                    placeholders.push('?');
                }

                const otherFields = {
                    'branch_id': branch_id,
                    'name': cust_name,
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'is_guest': is_logged_in ? 0 : 1,
                    'created_at': 'NOW()',
                    'updated_at': 'NOW()'
                };

                for (const [field, value] of Object.entries(otherFields)) {
                    if (columns.includes(field) && !insertFields.includes(field)) {
                        insertFields.push(field);
                        if (value === 'NOW()') {
                            insertValues.push('NOW()');
                            placeholders.push('NOW()');
                        } else {
                            insertValues.push(value);
                            placeholders.push('?');
                        }
                    }
                }

                if (columns.includes('cust_id') && !insertFields.includes('cust_id')) {
                    const maxIdSql = "SELECT MAX(cust_id) as maxId FROM customers WHERE company_id = ? AND branch_id = ?";
                    db.query(maxIdSql, [companyCode, branch_id], (maxErr, maxRows) => {
                        let nextCustId = 1;
                        if (!maxErr && maxRows && maxRows[0] && maxRows[0].maxId) {
                            nextCustId = maxRows[0].maxId + 1;
                        }
                        
                        insertFields.unshift('cust_id');
                        insertValues.unshift(nextCustId);
                        placeholders.unshift('?');
                        executeInsert();
                    });
                } else {
                    executeInsert();
                }

                function executeInsert() {
                    const insertSql = `INSERT INTO customers (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;

                    db.query(insertSql, insertValues.filter(v => v !== 'NOW()'), (insErr, insResult) => {
                        if (insErr) {
                            console.error("Error creating customer:", insErr);
                            return res.status(500).json({ success: false, message: "Failed to create customer record." });
                        }
                        
                        console.log("New customer created successfully with ID:", insResult.insertId);
                        // PROCEED TO CREATE ORDER
                        proceedToCreateOrder(req, res, companyCode, branch_id, insResult.insertId);
                    });
                }
            });
        } else {
            console.log("Customer exists. Proceeding to order.");
            // PROCEED TO CREATE ORDER
            proceedToCreateOrder(req, res, companyCode, branch_id, checkRows[0].id);
        }
    });
}


// ==========================================
// ORDER CREATION LOGIC (NEW)
// ==========================================
async function proceedToCreateOrder(req, res, companyCode, branch_id, customer_id) {
    try {
        console.log("Starting order generation process...");
        
        // Data passed from frontend (ensure your frontend sends these exact keys in the payload)
        const { cartTotal, shippingCost, grandTotal, table_no } = req.body;

        // Ensure table_no handles multiple values cleanly (e.g., if array passed like ["1", "2"])
        let ord_table_no = null;
        if (Array.isArray(table_no)) {
            ord_table_no = table_no.join(', ');
        } else if (table_no) {
            ord_table_no = String(table_no);
        }

        // 1. Calculate ord_inv_no (Starts at 445001)
        let ord_inv_no = 445001;
        const invRes = await queryPromise("SELECT MAX(ord_inv_no) as max_val FROM orders");
        if (invRes[0] && invRes[0].max_val && invRes[0].max_val >= 445001) {
            ord_inv_no = invRes[0].max_val + 1;
        }

        // 2. Calculate ord_com_order_no (Unique per company, starting at 1)
        let ord_com_order_no = 1;
        const comRes = await queryPromise("SELECT MAX(ord_com_order_no) as max_val FROM orders WHERE ord_company_id = ?", [companyCode]);
        if (comRes[0] && comRes[0].max_val) ord_com_order_no = comRes[0].max_val + 1;

        // 3. Calculate ord_branch_order_no (Unique per company & branch, starting at 1)
        let ord_branch_order_no = 1;
        const brRes = await queryPromise("SELECT MAX(ord_branch_order_no) as max_val FROM orders WHERE ord_company_id = ? AND ord_branch_id = ?", [companyCode, branch_id]);
        if (brRes[0] && brRes[0].max_val) ord_branch_order_no = brRes[0].max_val + 1;

        // 4. Calculate ord_daily_order_no (Unique per company, branch, and TODAY's date, starting at 1)
        let ord_daily_order_no = 1;
        const dailyRes = await queryPromise("SELECT MAX(ord_daily_order_no) as max_val FROM orders WHERE ord_company_id = ? AND ord_branch_id = ? AND DATE(created_at) = CURDATE()", [companyCode, branch_id]);
        if (dailyRes[0] && dailyRes[0].max_val) ord_daily_order_no = dailyRes[0].max_val + 1;

        // 5. Build Final Insert Query
        const insertSql = `
            INSERT INTO orders (
                ord_create_by, ord_inv_no, ord_com_order_no, ord_daily_order_no, ord_branch_order_no,
                ord_customer_id, ord_company_id, ord_branch_id, ord_table_no,
                ord_sub_total, ord_discount, ord_delivery, ord_total, ord_pay_mtd,
                ord_card, ord_mbank, ord_status, ord_kitchen_no, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const insertParams = [
            null,                   // ord_create_by
            ord_inv_no,             // ord_inv_no
            ord_com_order_no,       // ord_com_order_no
            ord_daily_order_no,     // ord_daily_order_no
            ord_branch_order_no,    // ord_branch_order_no
            customer_id,            // ord_customer_id
            companyCode,            // ord_company_id
            branch_id,              // ord_branch_id
            ord_table_no,           // ord_table_no
            cartTotal,              // ord_sub_total
            null,                   // ord_discount
            shippingCost,           // ord_delivery
            grandTotal,             // ord_total
            "cash",                 // ord_pay_mtd (hardcoded)
            null,                   // ord_card
            null,                   // ord_mbank
            1,                      // ord_status (default 1)
            null                    // ord_kitchen_no
        ];

        // 6. Execute Insert
        const finalOrder = await queryPromise(insertSql, insertParams);

        console.log("Order successfully created! Order ID:", finalOrder.insertId);

        // Final success response sent back to the React Frontend
        return res.status(200).json({ 
            success: true, 
            message: "Order placed successfully!", 
            order_id: finalOrder.insertId
        });

    } catch (err) {
        console.error("Critical error while generating order data:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Customer profile processed, but order creation failed." 
        });
    }
}

module.exports = router;