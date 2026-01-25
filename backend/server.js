const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create connection to XAMPP MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP user
    password: '',      // Default XAMPP password is empty
    database: 'test'   // Ensure this database exists in phpMyAdmin or change name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database via XAMPP');
});

app.get('/', (req, res) => {
    res.json("From Backend Side");
});

app.listen(8081, () => {
    console.log("Listening on port 8081");
});