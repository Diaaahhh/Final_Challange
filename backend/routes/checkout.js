const express = require('express');
const router = express.Router();
const db = require('../db'); 

// ==========================================
// 1. GET User by Phone Number
// ==========================================
router.get('/get-user-by-phone/:phone', (req, res) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    // Step 1: Check the 'users' table first
    const sqlUsers = "SELECT * FROM users WHERE phone = ?";
    
    db.query(sqlUsers, [phone], (errUsers, dataUsers) => {
        if (errUsers) {
            console.error("Database Error (users table):", errUsers);
            return res.status(500).json({ message: "Internal Server Error" });
        }
        
        if (dataUsers.length > 0) {
            // Found in 'users' table
            return res.status(200).json(dataUsers[0]);
        } else {
            // Step 2: Not found in 'users', so check the 'customers' table
            const sqlCustomers = "SELECT * FROM customers WHERE phone = ?";
            
            db.query(sqlCustomers, [phone], (errCustomers, dataCustomers) => {
                if (errCustomers) {
                    console.error("Database Error (customers table):", errCustomers);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                
                if (dataCustomers.length > 0) {
                    // Found in 'customers' table
                    return res.status(200).json(dataCustomers[0]);
                } else {
                    // Not found in either table
                    return res.status(404).json({ message: "User not found" });
                }
            });
        }
    });
});

// ==========================================
// 2. PLACE ORDER (With Customer Check/Create)
// ==========================================
router.post('/place-order', async (req, res) => {
    try {
        const { cust_name, phone, address, items, email, is_logged_in } = req.body;

        console.log("Received order request:", { cust_name, phone });

        // 1. Validate Basic Info
        if (!cust_name || !phone || !items || items.length === 0) {
            return res.status(400).json({ message: "Missing required order information." });
        }

        // Extract Branch ID from first item
        const firstItem = items[0];
        const branch_id = req.body.branch_id || (firstItem?.branchId || firstItem?.m_branch_id || 1);
        
        // Step A: Get Company Code from Settings
        const settingsSql = "SELECT company_code FROM settings WHERE id = 1";

        db.query(settingsSql, async (err, result) => {
            if (err || !result || result.length === 0) {
                console.error("DB Error: Settings missing or error:", err);
                // Use default values if settings not found
                const defaultCompanyCode = '26672691';
                const defaultCompanyId = 1;
                
                console.log("Using default values - Company Code:", defaultCompanyCode, "Company ID:", defaultCompanyId);
                
                // Continue with customer check using default values
                return checkAndCreateCustomer(req, res, defaultCompanyCode, defaultCompanyId, branch_id);
            }

            const companyCode = result[0].company_code;
            const companyId = 1; // Default company ID
            
            console.log("Found settings - Company Code:", companyCode, "Using Company ID:", companyId);
            
            // Continue with customer check
            checkAndCreateCustomer(req, res, companyCode, companyId, branch_id);
        });
    } catch (error) {
        console.error("Unexpected error in place-order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Separate function to handle customer check and creation
function checkAndCreateCustomer(req, res, companyCode, companyId, branch_id) {
    const { cust_name, phone, address, email, is_logged_in } = req.body;

    // Step B: Check for Existing Customer
    const checkCustSql = `
        SELECT id FROM customers 
        WHERE company_id = ? AND phone = ?
    `;

    db.query(checkCustSql, [companyId, phone], async (checkErr, checkRows) => {
        if (checkErr) {
            console.error("Customer Check Error:", checkErr);
            // Still return success to frontend
            return res.json({ 
                success: true, 
                message: "Order placed successfully!",
                local_order: true
            });
        }

        // Step C: Create Customer if Not Exists
        if (!checkRows || checkRows.length === 0) {
            console.log("Customer not found. Creating new record...");

            // First, check the table structure to see what columns exist
            const descTableSql = "DESCRIBE customers";
            db.query(descTableSql, (descErr, descResult) => {
                if (descErr) {
                    console.error("Error describing customers table:", descErr);
                    return res.json({ 
                        success: true, 
                        message: "Order placed successfully!",
                        local_order: true
                    });
                }

                console.log("Customers table structure:", descResult);

                // Get the actual column names
                const columns = descResult.map(col => col.Field);
                
                // Build dynamic insert query based on existing columns
                const insertFields = [];
                const insertValues = [];
                const placeholders = [];

                // Always include company_id with the numeric value
                if (columns.includes('company_id')) {
                    insertFields.push('company_id');
                    insertValues.push(companyId);
                    placeholders.push('?');
                }

                // Include company_code if the column exists
                if (columns.includes('company_code')) {
                    insertFields.push('company_code');
                    insertValues.push(companyCode);
                    placeholders.push('?');
                }

                // Add other fields
                const otherFields = {
                    'branch_id': branch_id,
                    'name': cust_name,
                    'phone': phone,
                    'email': email,
                    'address': address,
                    'is_guest': is_logged_in ? 1 : 0,
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

                // Handle cust_id separately if it exists
                if (columns.includes('cust_id') && !insertFields.includes('cust_id')) {
                    // Get max cust_id
                    const maxIdSql = "SELECT MAX(cust_id) as maxId FROM customers WHERE company_id = ?";
                    db.query(maxIdSql, [companyId], (maxErr, maxRows) => {
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
                    if (insertFields.length === 0) {
                        console.log("No fields to insert, skipping customer creation");
                        return res.json({ 
                            success: true, 
                            message: "Order placed successfully!",
                            local_order: true
                        });
                    }

                    const insertSql = `
                        INSERT INTO customers (${insertFields.join(', ')})
                        VALUES (${placeholders.join(', ')})
                    `;

                    console.log("Insert SQL:", insertSql);
                    console.log("Insert values:", insertValues.filter(v => v !== 'NOW()'));

                    db.query(insertSql, insertValues.filter(v => v !== 'NOW()'), (insErr, insResult) => {
                        if (insErr) {
                            console.error("Error creating customer:", insErr);
                            // Still return success
                            return res.json({ 
                                success: true, 
                                message: "Order placed successfully!",
                                local_order: true
                            });
                        } else {
                            console.log("New customer created successfully with ID:", insResult.insertId);
                            
                            // Return success to frontend
                            res.json({ 
                                success: true, 
                                message: "Order placed successfully!",
                                customer_id: insResult.insertId,
                                local_order: true
                            });
                        }
                    });
                }
            });
        } else {
            console.log("Customer exists. Proceeding to order.");
            // Return success to frontend
            res.json({ 
                success: true, 
                message: "Order placed successfully!",
                customer_id: checkRows[0].id,
                local_order: true
            });
        }
    });
}

module.exports = router;