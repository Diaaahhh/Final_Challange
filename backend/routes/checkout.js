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
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// ==========================================
// GET OCCUPIED TABLES FROM QUEUE
// ==========================================
router.get('/get-occupied-tables/:company_id/:branch_id', async (req, res) => {
    const { company_id, branch_id } = req.params;
    try {
        const occupiedSql = `
            SELECT DISTINCT table_no 
            FROM customer_order_queues 
            WHERE company_id = ? 
              AND branch_id = ? 
              AND table_no IS NOT NULL 
              AND table_no != 'Home delivery' 
              AND table_no != 'Take a way'
              AND table_no != 'Parcel'
        `;
        
        const occupiedResults = await queryPromise(occupiedSql, [company_id, branch_id]);
        const occupiedTableNumbers = occupiedResults.map(row => String(row.table_no).trim());
        
        res.status(200).json(occupiedTableNumbers);
    } catch (error) {
        console.error("Error fetching occupied tables:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ==========================================
// 2. PLACE ORDER (MAIN ENTRY)
// ==========================================
router.post('/save-customer-data', async (req, res) => {
    try {
        const { cust_name, phone, items } = req.body;

        if (!cust_name || !phone || !items || items.length === 0) {
            return res.status(400).json({ message: "Missing required order information." });
        }

        const firstItem = items[0];
        const branch_id = req.body.branch_id || (firstItem?.branchId || firstItem?.m_branch_id || 1);
        
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";
        const settingsResult = await queryPromise(settingsSql);

        if (!settingsResult || settingsResult.length === 0) {
            return res.status(500).json({ success: false, message: "Failed to process request: Settings not found." });
        }

        const companyCode = settingsResult[0].company_code;
        
        // Pass off to the async creation functions
        await checkAndCreateCustomer(req, res, companyCode, branch_id);

    } catch (error) {
        console.error("Unexpected error in place-order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// ==========================================
// CUSTOMER CREATION LOGIC (Refactored to Async)
// ==========================================
async function checkAndCreateCustomer(req, res, companyCode, branch_id) {
    try {
        const { cust_name, phone, address, email, is_logged_in } = req.body;

        const checkCustSql = `SELECT id, cust_id FROM customers WHERE company_id = ? AND phone = ?`;
        const checkRows = await queryPromise(checkCustSql, [companyCode, phone]);

        if (!checkRows || checkRows.length === 0) {
            console.log("Customer not found. Creating new record...");

            const descResult = await queryPromise("DESCRIBE customers");
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
                'email': email || null,
                'address': address || null,
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
                        // Ensure no undefined values sneak in
                        insertValues.push(value !== undefined ? value : null);
                        placeholders.push('?');
                    }
                }
            }

            let nextCustId = null;
            if (columns.includes('cust_id') && !insertFields.includes('cust_id')) {
                const maxRows = await queryPromise("SELECT MAX(cust_id) as maxId FROM customers WHERE company_id = ?", [companyCode]);
                nextCustId = 1;
                if (maxRows && maxRows.length > 0 && maxRows[0].maxId) {
                    nextCustId = parseInt(maxRows[0].maxId) + 1;
                }
                
                insertFields.unshift('cust_id');
                insertValues.unshift(nextCustId);
                placeholders.unshift('?');
            }

            const safeValues = insertValues.filter(v => v !== 'NOW()');
            const insertSql = `INSERT INTO customers (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            
            const insResult = await queryPromise(insertSql, safeValues);
            
            const finalCustId = nextCustId ? nextCustId : insResult.insertId;
            await proceedToCreateOrder(req, res, companyCode, branch_id, finalCustId);

        } else {
            console.log("Customer exists. Proceeding to order.");
            const existingCustId = checkRows[0].cust_id || checkRows[0].id;
            await proceedToCreateOrder(req, res, companyCode, branch_id, existingCustId);
        }
    } catch (err) {
        console.error("Database Error during Customer Check/Create:", err);
        return res.status(500).json({ success: false, message: "Customer DB Error: " + err.message });
    }
}

// ==========================================
// ORDER QUEUE CREATION LOGIC
// ==========================================
async function proceedToCreateOrder(req, res, companyCode, branch_id, customer_id) {
    try {
        console.log("Starting order generation process into customer_order_queues...");
        const { items, table_no } = req.body;

        // ---- THIS HANDLES THE MULTIPLE TABLES ----
        let ord_table_no = null;
        if (Array.isArray(table_no)) {
            // Turns frontend array ["1", "5"] into string "1, 5" for the database!
            ord_table_no = table_no.join(', ');
        } else if (table_no) {
            ord_table_no = String(table_no);
        }

        let order_no = 1;
        const comRes = await queryPromise("SELECT MAX(CAST(order_no AS UNSIGNED)) as max_val FROM customer_order_queues WHERE company_id = ?", [companyCode]);
        if (comRes[0] && comRes[0].max_val) {
            order_no = parseInt(comRes[0].max_val) + 1;
        }
        
        const finalOrderNo = String(order_no); 

        const insertSql = `
            INSERT INTO customer_order_queues (
                create_by, emp_id, order_no, table_no, customer_id, 
                company_id, branch_id, menu_id, size, qty, price, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        for (const item of items) {
            let menu_id = parseInt(item.m_menu_id) || parseInt(item.id) || null; 
            if (isNaN(menu_id)) menu_id = null;

            let qty = parseInt(item.quantity) || 1;
            if (isNaN(qty)) qty = 1;
            
            const itemPrice = parseFloat(item.m_price) || 0;
            const rowTotalPrice = itemPrice * qty;

            const insertParams = [
                null,                   
                null,                   
                finalOrderNo,           
                ord_table_no,           // Passes the comma-separated tables here
                customer_id,            
                companyCode,            
                branch_id,              
                menu_id,                
                null,                   
                qty,                    
                String(rowTotalPrice)   
            ];

            const safeParams = insertParams.map(v => v === undefined ? null : v);
            await queryPromise(insertSql, safeParams);
        }

        console.log("All order items successfully queued! Order No:", finalOrderNo);

        return res.status(200).json({ 
            success: true, 
            message: "Order placed successfully in queue!", 
            order_no: finalOrderNo 
        });

    } catch (err) {
        console.error("Critical error while inserting items into queue:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Order Insert DB Error: " + err.message 
        });
    }
}

module.exports = router;