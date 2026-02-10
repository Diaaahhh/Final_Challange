const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db'); 
const axios = require('axios');

const app = express();

// --- CRASH REPORTER (Keeps your site alive & logs errors) ---
const logFile = path.join(__dirname, 'crash_log.txt');
function writeLog(err) {
    const timestamp = new Date().toISOString();
    const msg = `\n[${timestamp}] CRASH REPORT:\nError: ${err.message}\nStack: ${err.stack}\n----------------------\n`;
    try { fs.appendFileSync(logFile, msg); } catch (e) {}
}
process.on('uncaughtException', (err) => { writeLog(err); process.exit(1); });
process.on('unhandledRejection', (reason) => { writeLog(reason instanceof Error ? reason : new Error(JSON.stringify(reason))); });
// -----------------------------------------------------------

// 1. MIDDLEWARE
app.use(cors({
    origin: [
        "https://demo.khabartable.com",      // Your Live Frontend
        "https://khabartable.com",           // Your Main Frontend (if different)
        "http://localhost:5173",             // <--- ALLOW VITE LOCALHOST
        "http://localhost:3000"              // (Optional) Allow other local ports
    ], 
    credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Serve images

// 2. HEALTH CHECK (Keep this so you can always verify the server is up)
app.get('/', (req, res) => {
    res.send('SERVER IS WORKING! (API Ready)');
});

// 3. AUTH ROUTES (Login/Signup)
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length > 0) return res.status(409).json({ message: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const insertQuery = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        db.query(insertQuery, [name, email, hashedPassword], (err, data) => {
            if (err) return res.status(500).json({ error: "Error creating user" });
            return res.status(200).json({ message: "User registered successfully" });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length === 0) return res.status(404).json({ message: "User not found" });

        const user = data[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const { password: _, ...userData } = user;
        return res.status(200).json({ message: "Login successful", user: userData });
    });
});

// 4. API ROUTES
// Ensure all these files exist in your 'routes' folder
app.use('/api', require('./routes/create_menu'));
app.use('/api/menu', require('./routes/menu_list'));
app.use('/api/menu-user', require('./routes/menu_user'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/about', require('./routes/write_about'));
app.use('/api/view-about', require('./routes/view_about'));
app.use('/api', require('./routes/write_review'));
app.use('/api', require('./routes/view_review'));
app.use('/api', require('./routes/upload_hero'));
app.use('/api', require('./routes/Profile')); 
app.use('/api/settings', require('./routes/settings'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/proxy', require('./routes/checkout'));

// 5. START SERVER
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});