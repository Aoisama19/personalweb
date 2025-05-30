const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import scheduled tasks
const { scheduleNotifications } = require('./utils/scheduledTasks');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is working!' });
});

// Define routes
app.use('/api/dates', require('./routes/dates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/albums', require('./routes/albums'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('../client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Create a .env file if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', 'MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/personalweb?retryWrites=true&w=majority\nJWT_SECRET=your_jwt_secret\nPORT=5000');
  console.log('Created .env file. Please update with your MongoDB connection string and JWT secret.');
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    // For development, use a local MongoDB or MongoDB Atlas
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/personalweb';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
    // Initialize scheduled tasks
    scheduleNotifications();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Call the connect function
connectDB();

// Define PORT
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
