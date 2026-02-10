const mysql = require('mysql2');

// Create the connection configuration
const dbConfig = {
    host: "localhost",
    user: "khabarta_pos",      // Ensure this matches cPanel > MySQL Databases
    password: "khabarta_pos",  // Ensure this matches the user password
    database: "khabarta_pos"   // Ensure this matches cPanel > MySQL Databases
};

const db = mysql.createConnection(dbConfig);

// Connect and handle errors gracefully
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed: ' + err.stack);
        // We do NOT throw an error here, so the server can still start
        return;
    }
    console.log('✅ Connected to MySQL Database as id ' + db.threadId);
});

module.exports = db;