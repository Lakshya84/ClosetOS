require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Connect to MongoDB Database
connectDB();

// Middleware Configurations
app.use(cors({
  origin: '*', // Allow all origins for the portfolio demo, Vercel/Render friendly
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/notifications', notificationRoutes);

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to ClosetOS API', 
    version: '1.0.0', 
    status: 'online' 
  });
});

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint Not Found - ${req.originalUrl}` });
});

// Global Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Global Error:', err.stack || err.message || err);
  res.status(err.status || 500).json({ 
    message: err.message || 'An unexpected server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
