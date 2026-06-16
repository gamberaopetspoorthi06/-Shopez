const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedStocks, startSimulator } = require('./services/marketSimulator');

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Connect to Database
connectDB().then(async () => {
  if (!global.useMemoryDB) {
    // Seed stocks after successful DB connection
    await seedStocks();
    // Start background price fluctuation simulation
    startSimulator();
  }
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins during local development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main Root Test Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ShopEZ Stock Trader API Server',
    status: 'Operational',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stocks', require('./routes/stockRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Centralized 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR LOG:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Bind and Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
