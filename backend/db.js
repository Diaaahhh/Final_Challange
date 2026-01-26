const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",       // Your MySQL username
    password: "",       // Your MySQL password
    database: "restaurant" // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});

module.exports = db;