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

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Log partial MongoDB URI for debugging (hide credentials)
    const uriParts = process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@') : [];
    if (uriParts.length > 1) {
      console.log('MongoDB URI format check:', 
        `mongodb+srv://***:***@${uriParts[1].substring(0, 20)}...`);
    } else {
      console.log('MongoDB URI may be malformed');
    }
    
    // Add more options to the connection
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Only log specific parts of the error to avoid exposing credentials
    if (err.name === 'MongooseServerSelectionError') {
      console.error('Server selection error - check network access and credentials');
    }
    return false;
  }
};

// Don't exit process on connection failure in serverless environment
connectDB().then(success => {
  isDbConnected = success;
  if (!success) {
    console.log('Running without database connection. API calls that require database will fail.');
  } else {
    console.log('Database connection established and ready to handle requests');
  }
});

// Global connection state
let isDbConnected = false;

// Middleware to check database connection before processing API requests
app.use('/api/*', (req, res, next) => {
  if (!isDbConnected && req.method !== 'OPTIONS' && !req.path.includes('/debug')) {
    console.log(`Blocking request to ${req.path} due to database connection issue`);
    return res.status(503).json({ 
      error: 'Database connection unavailable', 
      message: 'The application is experiencing database connectivity issues. Please try again later.'
    });
  }
  next();
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
  // Get MongoDB URI parts for debugging (hide credentials)
  let mongoDbUriInfo = 'Not set';
  const uriParts = process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@') : [];
  if (uriParts.length > 1) {
    mongoDbUriInfo = `mongodb+srv://***:***@${uriParts[1].split('?')[0]}`;
  }
  
  const envVars = {
    mongoDbExists: !!process.env.MONGODB_URI,
    mongoDbUriFormat: mongoDbUriInfo,
    jwtSecretExists: !!process.env.JWT_SECRET,
    emailUserExists: !!process.env.EMAIL_USER,
    emailPassExists: !!process.env.EMAIL_PASS,
    nodeEnv: process.env.NODE_ENV,
    // Don't include actual values of sensitive environment variables
  };
  
  res.status(200).json({
    status: 'debug',
    environment: envVars,
    databaseStatus: {
      connected: isDbConnected,
      message: isDbConnected ? 'Successfully connected to MongoDB' : 'Failed to connect to MongoDB'
    },
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      netlifyFunction: true
    }
  });
});

// Direct route handlers for authentication endpoints
app.post('/users/register', async (req, res) => {
  console.log('Direct registration endpoint hit at /users/register');
  console.log('Request body:', req.body);
  
  try {
    // Forward to the actual route handler
    req.url = '/api/users/register';
    app._router.handle(req, res);
  } catch (error) {
    console.error('Error in registration endpoint:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/users/login', async (req, res) => {
  console.log('Direct login endpoint hit at /users/login');
  console.log('Request body:', req.body);
  
  try {
    // Forward to the actual route handler
    req.url = '/api/users/login';
    app._router.handle(req, res);
  } catch (error) {
    console.error('Error in login endpoint:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Log all API requests for debugging
app.use('/api/*', (req, res, next) => {
  console.log(`API request: ${req.method} ${req.path}`);
  next();
});

// Make sure routes are properly mounted
console.log('Available routes:', app._router.stack
  .filter(r => r.route)
  .map(r => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`)
  .join('\n'));

// Ensure the MongoDB models are properly loaded
console.log('Checking User model:', !!require('../../server/models/User'));

// Export the serverless function
module.exports.handler = serverless(app);
