// Direct Important Dates function without Express routing
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Define the ImportantDate schema
const ImportantDateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['birthday', 'anniversary', 'bill', 'event', 'other'],
    default: 'event'
  },
  recurring: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const ImportantDate = mongoose.model('importantDate', ImportantDateSchema);

// Function to verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    // Get token from headers
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'No token provided' 
        })
      };
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const { valid, decoded, error } = verifyToken(token);
    
    if (!valid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid token', 
          details: error 
        })
      };
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const userId = decoded.user.id;
    
    // Handle different HTTP methods
    if (event.httpMethod === 'GET') {
      // Get all important dates for the user
      const dates = await ImportantDate.find({ user: userId }).sort({ date: 1 });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(dates)
      };
    } 
    else if (event.httpMethod === 'POST') {
      // Create a new important date
      const { title, date, category, recurring, notes } = JSON.parse(event.body);
      
      // Validate required fields
      if (!title || !date) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Bad request', 
            message: 'Title and date are required' 
          })
        };
      }
      
      const newDate = new ImportantDate({
        user: userId,
        title,
        date,
        category: category || 'event',
        recurring: recurring || false,
        notes
      });
      
      await newDate.save();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newDate)
      };
    } 
    else if (event.httpMethod === 'PUT') {
      // Update an existing important date
      const dateId = event.path.split('/').pop();
      const updates = JSON.parse(event.body);
      
      // Find the date and make sure it belongs to the user
      let date = await ImportantDate.findOne({ _id: dateId, user: userId });
      
      if (!date) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Important date not found or does not belong to user' 
          })
        };
      }
      
      // Update the date
      date = await ImportantDate.findByIdAndUpdate(
        dateId,
        { $set: updates },
        { new: true }
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(date)
      };
    } 
    else if (event.httpMethod === 'DELETE') {
      // Delete an important date
      const dateId = event.path.split('/').pop();
      
      // Find the date and make sure it belongs to the user
      const date = await ImportantDate.findOne({ _id: dateId, user: userId });
      
      if (!date) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Important date not found or does not belong to user' 
          })
        };
      }
      
      await ImportantDate.findByIdAndDelete(dateId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Important date deleted successfully' })
      };
    } 
    else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Important dates error:', error.message);
    
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
