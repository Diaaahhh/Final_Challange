const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Import the db connection

const app = express();
app.use(cors());
app.use(express.json());


// SIGNUP API
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Check if Email already exists
    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

    db.query(checkEmailQuery, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (data.length > 0) {
            // Email already exists
            return res.status(409).json({ message: "Email already exists" });
        }

        // 2. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert User (Role defaults to 1 in DB, so we don't need to send it)
        const insertQuery = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        db.query(insertQuery, [name, email, hashedPassword], (err, data) => {
            if (err) return res.status(500).json({ error: "Error creating user" });
            return res.status(200).json({ message: "User registered successfully" });
        });
    });
});


// LOGIN API
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // 1. Check if email exists
        if (data.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Compare Password (hashed)
        const user = data[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 3. Success - Send back user info (excluding password)
        const { password: _, ...userData } = user; // Remove password from response
        return res.status(200).json({ message: "Login successful", user: userData });
    });
});

app.listen(8081, () => {
    console.log("Listening on port 8081");
});