// Simple MongoDB connection test function
const mongoose = require('mongoose');
require('dotenv').config();

exports.handler = async function(event, context) {
  // Log the request for debugging
  console.log('MongoDB test function called');
  
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
  
  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.log('MONGODB_URI environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration error', 
          message: 'MongoDB URI is not configured' 
        })
      };
    }
    
    // Log partial URI for debugging (hide credentials)
    const uriParts = mongoUri.split('@');
    if (uriParts.length > 1) {
      console.log('MongoDB URI format:', `mongodb+srv://***:***@${uriParts[1].substring(0, 20)}...`);
    }
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('MongoDB connection successful');
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        status: 'success', 
        message: 'Successfully connected to MongoDB',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'error', 
        message: 'Failed to connect to MongoDB',
        error: error.message,
        timestamp: new Date().toISOString()
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
