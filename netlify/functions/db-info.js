// Function to check database connection details
const mongoose = require('mongoose');
require('dotenv').config();

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    // Get MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration error', 
          message: 'MongoDB URI is not configured' 
        })
      };
    }
    
    // Parse the MongoDB URI to extract database name
    let databaseName = 'unknown';
    try {
      // Extract database name from URI
      const uriParts = mongoUri.split('/');
      if (uriParts.length > 3) {
        const dbPart = uriParts[3];
        databaseName = dbPart.split('?')[0];
      }
    } catch (err) {
      console.error('Error parsing URI:', err);
    }
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    // Get list of collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check if users collection exists
    const hasUsersCollection = collectionNames.includes('users');
    
    // Count documents in users collection if it exists
    let userCount = 0;
    if (hasUsersCollection) {
      userCount = await mongoose.connection.db.collection('users').countDocuments();
    }
    
    // Return database info
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: true,
        databaseName: databaseName,
        collections: collectionNames,
        usersCollection: {
          exists: hasUsersCollection,
          documentCount: userCount
        },
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database connection error', 
        message: error.message,
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
