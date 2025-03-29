require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration - only include this ONCE
app.use(cors({
    origin: [
        'http://localhost:5500',  // Live Server extension
        'http://127.0.0.1:5500',  // Alternative localhost
        'http://localhost:3000',  // Create React App default
        'null'  // For local file loading
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.path}`);
    next();
});

// Routes
app.use('/api', apiRouter);

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});