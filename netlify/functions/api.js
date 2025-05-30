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
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
connectDB();

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

// Export the serverless function
module.exports.handler = serverless(app);
