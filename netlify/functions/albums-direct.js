// Direct Albums (Photo Gallery) function without Express routing
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Define the Photo and Album schemas
const PhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  caption: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AlbumSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  coverImage: {
    type: String
  },
  photos: [PhotoSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model with explicit collection name
// Note: Mongoose typically pluralizes the model name, so we need to specify the exact collection name
const Album = mongoose.model('Album', AlbumSchema, 'albums');

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
  console.log('Albums direct function called with method:', event.httpMethod, 'and path:', event.path);
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
    console.log('Albums direct function called with method:', event.httpMethod);
    console.log('Path:', event.path);
    
    // Get token from headers
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
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
    console.log('Token extracted from header');
    
    // Verify token
    const { valid, decoded, error } = verifyToken(token);
    console.log('Token validation result:', valid ? 'valid' : 'invalid');
    
    if (!valid) {
      console.log('Token validation error:', error);
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
    
    console.log('Token validated successfully');
    
    // Extract user ID from token (handle both token structures)
    const userId = decoded.user ? decoded.user.id : decoded.id;
    console.log('User ID extracted from token:', userId);
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    try {
      // Check if we already have an active connection
      if (mongoose.connection.readyState === 1) {
        console.log('Using existing MongoDB connection');
      } else {
        console.log('Creating new MongoDB connection');
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000 // 5 second timeout
        });
        console.log('MongoDB connection successful');
      }
      
      // List all collections in the database
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError.message);
      console.error('MongoDB connection error details:', dbError);
      throw dbError; // Re-throw to be caught by the outer try/catch
    }
    
    // Parse path to determine operation
    const pathParts = event.path.split('/').filter(part => part);
    
    // Handle different HTTP methods for Albums
    if (pathParts.length <= 3) {
      // Album operations
      if (event.httpMethod === 'GET') {
        console.log('Processing GET request for albums, user ID:', userId);
        try {
          // Get all albums for the user
          console.log('Querying Album collection for user:', userId);
          console.log('Collection name:', Album.collection.name);
          console.log('Model name:', Album.modelName);
          
          // First try to find any documents in the collection
          const allDocs = await Album.find({}).limit(5);
          console.log(`Found ${allDocs.length} total documents in collection`);
          if (allDocs.length > 0) {
            console.log('Sample document:', JSON.stringify(allDocs[0]));
          }
          
          // Now try to find documents for this specific user
          const albums = await Album.find({ user: userId }).sort({ createdAt: -1 });
          console.log(`Found ${albums.length} albums for user`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(albums)
          };
        } catch (queryError) {
          console.error('Error querying albums:', queryError.message);
          throw queryError; // Re-throw to be caught by the outer try/catch
        }
      } 
      else if (event.httpMethod === 'POST') {
        // Create a new album
        const { title, description, date, coverImage } = JSON.parse(event.body);
        
        // Validate required fields
        if (!title) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Bad request', 
              message: 'Title is required' 
            })
          };
        }
        
        const newAlbum = new Album({
          user: userId,
          title,
          description,
          date: date || new Date(),
          coverImage,
          photos: []
        });
        
        await newAlbum.save();
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newAlbum)
        };
      } 
      else if (event.httpMethod === 'PUT') {
        // Update an existing album
        const albumId = pathParts[2];
        const updates = JSON.parse(event.body);
        
        // Find the album and make sure it belongs to the user
        let album = await Album.findOne({ _id: albumId, user: userId });
        
        if (!album) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Album not found or does not belong to user' 
            })
          };
        }
        
        // Update the album
        album = await Album.findByIdAndUpdate(
          albumId,
          { $set: updates },
          { new: true }
        );
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(album)
        };
      } 
      else if (event.httpMethod === 'DELETE') {
        // Delete an album
        const albumId = pathParts[2];
        
        // Find the album and make sure it belongs to the user
        const album = await Album.findOne({ _id: albumId, user: userId });
        
        if (!album) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Album not found or does not belong to user' 
            })
          };
        }
        
        await Album.findByIdAndDelete(albumId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Album deleted successfully' })
        };
      }
    } 
    // Handle Photo operations
    else if (pathParts.length >= 4 && pathParts[3] === 'photos') {
      const albumId = pathParts[2];
      
      // Find the album and make sure it belongs to the user
      const album = await Album.findOne({ _id: albumId, user: userId });
      
      if (!album) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Album not found or does not belong to user' 
          })
        };
      }
      
      if (event.httpMethod === 'POST') {
        // Add a new photo to the album
        console.log('Adding new photo to album:', albumId, 'Request body:', event.body);
        try {
          const { url, caption, date } = JSON.parse(event.body);
          
          // Validate required fields
          if (!url) {
            console.log('Photo URL is required but was not provided');
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: 'Bad request', 
                message: 'Photo URL is required' 
              })
            };
          }
          
          console.log('Creating new photo with URL:', url);
          const newPhoto = {
            url,
            caption: caption || '',
            date: date ? new Date(date) : new Date(),
            createdAt: new Date()
          };
          
          console.log('New photo object:', newPhoto);
          
          // Add the photo to the album
          album.photos.push(newPhoto);
          
          // If this is the first photo, set it as the cover image
          if (!album.coverImage && album.photos.length === 1) {
            album.coverImage = url;
          }
          
          console.log('Saving album with new photo...');
          const savedAlbum = await album.save();
          console.log('Photo added successfully to album with ID:', savedAlbum.photos[savedAlbum.photos.length - 1]._id);
          
          // Return the entire updated album so the frontend has the latest data
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(savedAlbum)
          };
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Bad request', 
              message: 'Invalid request body: ' + parseError.message 
            })
          };
        }
      } 
      else if (event.httpMethod === 'DELETE' && pathParts.length >= 5) {
        // Delete a photo from the album
        const photoId = pathParts[4];
        
        // Find the photo in the album
        const photo = album.photos.id(photoId);
        
        if (!photo) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Photo not found in the album' 
            })
          };
        }
        
        // Remove the photo
        album.photos.pull(photoId);
        
        // If the deleted photo was the cover image, update the cover image
        if (album.coverImage === photo.url && album.photos.length > 0) {
          album.coverImage = album.photos[0].url;
        } else if (album.photos.length === 0) {
          album.coverImage = '';
        }
        
        await album.save();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Photo deleted successfully' })
        };
      }
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Albums error:', error.message);
    
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
