// Netlify Function to serve as a proxy for the Express backend
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import your routes from the server directory
const userRoutes = require('../../server/routes/users');
const dateRoutes = require('../../server/routes/dates');
const eventRoutes = require('../../server/routes/events');
const todoRoutes = require('../../server/routes/todos');
// Import any other routes you have

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors());

// Parse JSON request bodies
app.use(express.json());

// Add custom headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    return false;
  }
};

// Don't exit process on connection failure in serverless environment
connectDB().then(success => {
  if (!success) {
    console.log('Running without database connection. API calls that require database will fail.');
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/dates', dateRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/todos', todoRoutes);
// Add any other routes you have

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Debug endpoint (remove in production)
app.get('/api/debug', (req, res) => {
  const envVars = {
    mongoDbExists: !!process.env.MONGODB_URI,
    jwtSecretExists: !!process.env.JWT_SECRET,
    emailUserExists: !!process.env.EMAIL_USER,
    emailPassExists: !!process.env.EMAIL_PASS,
    nodeEnv: process.env.NODE_ENV,
    // Don't include actual values of sensitive environment variables
  };
  
  res.status(200).json({
    status: 'debug',
    environment: envVars,
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
