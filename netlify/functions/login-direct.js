// Direct login function without Express routing
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Define a simplified User schema for testing
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create the model
const User = mongoose.model('user', UserSchema);

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { email, password } = requestBody;
    
    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad request', 
          message: 'Email and password are required' 
        })
      };
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB: ${mongoUri ? 'URI exists' : 'URI missing'}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Find user by email
    console.log(`Looking for user with email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid credentials', 
          message: 'Invalid email or password' 
        })
      };
    }
    
    console.log(`User found: ${user.name}, comparing password...`);
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log(`Password mismatch for user: ${email}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid credentials', 
          message: 'Invalid email or password' 
        })
      };
    }
    
    // User authenticated, create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };
    
    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    console.log(`Login successful for user: ${email}`);
    
    // Return success with token
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      })
    };
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
};
