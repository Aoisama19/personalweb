// Direct Calendar Events function without Express routing
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Define the Event schema
const EventSchema = new mongoose.Schema({
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
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['personal', 'work', 'health', 'entertainment', 'chores', 'other'],
    default: 'personal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const Event = mongoose.model('event', EventSchema);

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
      // Get all events for the user
      const events = await Event.find({ user: userId }).sort({ date: 1 });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(events)
      };
    } 
    else if (event.httpMethod === 'POST') {
      // Create a new event
      const { title, date, endDate, location, description, category } = JSON.parse(event.body);
      
      // Validate required fields
      if (!title || !date || !endDate) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Bad request', 
            message: 'Title, date, and endDate are required' 
          })
        };
      }
      
      const newEvent = new Event({
        user: userId,
        title,
        date,
        endDate,
        location,
        description,
        category: category || 'personal'
      });
      
      await newEvent.save();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newEvent)
      };
    } 
    else if (event.httpMethod === 'PUT') {
      // Update an existing event
      const eventId = event.path.split('/').pop();
      const updates = JSON.parse(event.body);
      
      // Find the event and make sure it belongs to the user
      let calendarEvent = await Event.findOne({ _id: eventId, user: userId });
      
      if (!calendarEvent) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Event not found or does not belong to user' 
          })
        };
      }
      
      // Update the event
      calendarEvent = await Event.findByIdAndUpdate(
        eventId,
        { $set: updates },
        { new: true }
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(calendarEvent)
      };
    } 
    else if (event.httpMethod === 'DELETE') {
      // Delete an event
      const eventId = event.path.split('/').pop();
      
      // Find the event and make sure it belongs to the user
      const calendarEvent = await Event.findOne({ _id: eventId, user: userId });
      
      if (!calendarEvent) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Event not found or does not belong to user' 
          })
        };
      }
      
      await Event.findByIdAndDelete(eventId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Event deleted successfully' })
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
    console.error('Calendar events error:', error.message);
    
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
