const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Define the TodoList schema
const todoListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  icon: { type: String, default: 'FaList' },
  todos: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Create the TodoList model
let TodoList;
try {
  // Try to get the model if it exists
  TodoList = mongoose.model('TodoList');
} catch (e) {
  // Create the model if it doesn't exist
  TodoList = mongoose.model('TodoList', todoListSchema, 'todolists');
}

// Helper function to extract user ID from token
const getUserIdFromToken = (decodedToken) => {
  // Handle different token structures
  if (decodedToken.sub) {
    return decodedToken.sub;
  } else if (decodedToken._id) {
    return decodedToken._id;
  } else if (decodedToken.userId) {
    return decodedToken.userId;
  } else if (decodedToken.id) {
    return decodedToken.id;
  }
  
  // Default to empty string if no ID found
  return '';
};

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  try {
    console.log('Todos direct function called with method:', event.httpMethod, 'and path:', event.path);
    
    // Get the path parts after the function name
    const pathParts = event.path.split('/').filter(part => part);
    const functionIndex = pathParts.findIndex(part => part === 'todos-direct');
    const relevantPathParts = pathParts.slice(functionIndex + 1);
    
    console.log('Relevant path parts:', JSON.stringify(relevantPathParts));
    
    // Check for Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'No authorization token provided' })
      };
    }
    
    // Extract and verify JWT token
    const token = authHeader.split(' ')[1];
    console.log('Token extracted from header');
    
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token validation result: valid');
      console.log('Token validated successfully');
    } catch (tokenError) {
      console.error('Token validation failed:', tokenError.message);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' })
      };
    }
    
    // Extract user ID from token
    const userId = getUserIdFromToken(decodedToken);
    console.log('User ID extracted from token:', userId);
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized', message: 'User ID not found in token' })
      };
    }
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server error', message: 'MongoDB URI not configured' })
      };
    }
    
    // Connect to MongoDB with connection reuse
    if (mongoose.connection.readyState === 0) {
      console.log('Creating new MongoDB connection');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connection successful');
    } else {
      console.log('Reusing existing MongoDB connection');
    }
    
    // Log available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).join(', ');
    console.log('Available collections:', collectionNames);
    
    // Log model information
    console.log('Collection name:', TodoList.collection.name);
    console.log('Model name:', TodoList.modelName);
    
    // Handle Todo list operations
    if (relevantPathParts.length === 0 || (relevantPathParts.length === 1 && !relevantPathParts[0])) {
      if (event.httpMethod === 'GET') {
        // Get all todo lists for the user
        try {
          // First try to find any documents in the collection
          const allDocs = await TodoList.find({}).limit(5);
          console.log(`Found ${allDocs.length} total documents in collection`);
          
          // Now try to find documents for this specific user
          const todoLists = await TodoList.find({ user: userId }).sort({ createdAt: -1 });
          console.log(`Found ${todoLists.length} todo lists for user`);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(todoLists)
          };
        } catch (queryError) {
          console.error('Error querying todo lists:', queryError.message);
          throw queryError; // Re-throw to be caught by the outer try/catch
        }
      } 
      else if (event.httpMethod === 'POST') {
        // Create a new todo list
        console.log('Creating new todo list, request body:', event.body);
        try {
          const { title, icon } = JSON.parse(event.body);
          
          // Validate required fields
          if (!title) {
            console.log('Title is required but was not provided');
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: 'Bad request', 
                message: 'Title is required' 
              })
            };
          }
          
          // Create new todo list
          console.log('Creating new todo list with title:', title);
          const newTodoList = new TodoList({
            title,
            icon: icon || 'FaList',
            user: userId,
            todos: [],
            createdAt: new Date()
          });
          
          const savedList = await newTodoList.save();
          console.log('Todo list created successfully with ID:', savedList._id);
          
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(savedList)
          };
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Bad request', 
              message: 'Invalid request body' 
            })
          };
        }
      }
    }
    
    // Handle operations on a specific todo list
    if (relevantPathParts.length >= 1) {
      const listId = relevantPathParts[0];
      
      // Validate list ID format
      if (!mongoose.Types.ObjectId.isValid(listId)) {
        console.log('Invalid list ID format:', listId);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Bad request', 
            message: 'Invalid list ID format' 
          })
        };
      }
      
      // GET a specific todo list
      if (event.httpMethod === 'GET' && relevantPathParts.length === 1) {
        console.log('Getting todo list with ID:', listId);
        
        // Find the todo list and make sure it belongs to the user
        const todoList = await TodoList.findOne({ _id: listId, user: userId });
        
        if (!todoList) {
          console.log('Todo list not found or does not belong to user');
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Todo list not found or does not belong to user' 
            })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(todoList)
        };
      }
      // PUT to update a todo list
      else if (event.httpMethod === 'PUT' && relevantPathParts.length === 1) {
        console.log('Updating todo list with ID:', listId);
        try {
          const updates = JSON.parse(event.body);
          
          // Find the todo list and make sure it belongs to the user
          let todoList = await TodoList.findOne({ _id: listId, user: userId });
          
          if (!todoList) {
            console.log('Todo list not found or does not belong to user');
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'Not found', 
                message: 'Todo list not found or does not belong to user' 
              })
            };
          }
          
          // Update the todo list
          todoList = await TodoList.findByIdAndUpdate(
            listId,
            { $set: { title: updates.title, icon: updates.icon } },
            { new: true }
          );
          
          console.log('Todo list updated successfully');
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(todoList)
          };
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Bad request', 
              message: 'Invalid request body' 
            })
          };
        }
      }
      // DELETE a todo list
      else if (event.httpMethod === 'DELETE' && relevantPathParts.length === 1) {
        console.log('Deleting todo list with ID:', listId);
        
        // Find the todo list and make sure it belongs to the user
        const todoList = await TodoList.findOne({ _id: listId, user: userId });
        
        if (!todoList) {
          console.log('Todo list not found or does not belong to user');
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Todo list not found or does not belong to user' 
            })
          };
        }
        
        await TodoList.findByIdAndDelete(listId);
        console.log('Todo list deleted successfully');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Todo list deleted successfully' })
        };
      }
      
      // Handle Todo item operations
      if (relevantPathParts.length >= 2 && relevantPathParts[1] === 'todos') {
        console.log('Handling todo item operation');
        
        // Find the todo list and make sure it belongs to the user
        const todoList = await TodoList.findOne({ _id: listId, user: userId });
        
        if (!todoList) {
          console.log('Todo list not found or does not belong to user');
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Todo list not found or does not belong to user' 
            })
          };
        }
        
        // POST to add a new todo item
        if (event.httpMethod === 'POST' && relevantPathParts.length === 2) {
          console.log('Adding new todo item to list:', listId);
          try {
            const todoData = JSON.parse(event.body);
            
            // Validate required fields
            if (!todoData.text) {
              console.log('Todo text is required but was not provided');
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                  error: 'Bad request', 
                  message: 'Todo text is required' 
                })
              };
            }
            
            // Create new todo item
            const newTodo = {
              text: todoData.text,
              completed: todoData.completed || false,
              createdAt: new Date()
            };
            
            // Add todo to list
            todoList.todos.push(newTodo);
            await todoList.save();
            
            console.log('Todo item added successfully');
            
            return {
              statusCode: 201,
              headers,
              body: JSON.stringify(todoList)
            };
          } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: 'Bad request', 
                message: 'Invalid request body' 
              })
            };
          }
        }
        
        // Operations on a specific todo item
        if (relevantPathParts.length === 3) {
          const todoId = relevantPathParts[2];
          console.log('Operating on specific todo item:', todoId);
          
          // Find the todo item in the list
          const todoIndex = todoList.todos.findIndex(todo => todo._id.toString() === todoId);
          
          if (todoIndex === -1) {
            console.log('Todo item not found in list');
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: 'Not found', 
                message: 'Todo item not found in list' 
              })
            };
          }
          
          // PUT to update a todo item
          if (event.httpMethod === 'PUT') {
            console.log('Updating todo item:', todoId);
            try {
              const updates = JSON.parse(event.body);
              
              // Update the todo item
              if (updates.text !== undefined) {
                todoList.todos[todoIndex].text = updates.text;
              }
              
              if (updates.completed !== undefined) {
                todoList.todos[todoIndex].completed = updates.completed;
              }
              
              await todoList.save();
              console.log('Todo item updated successfully');
              
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify(todoList)
              };
            } catch (parseError) {
              console.error('Error parsing request body:', parseError);
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                  error: 'Bad request', 
                  message: 'Invalid request body' 
                })
              };
            }
          }
          
          // DELETE a todo item
          if (event.httpMethod === 'DELETE') {
            console.log('Deleting todo item:', todoId);
            
            // Remove the todo item from the list
            todoList.todos.splice(todoIndex, 1);
            
            try {
              await todoList.save();
              console.log('Todo item deleted successfully');
              
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify(todoList)
              };
            } catch (saveError) {
              console.error('Error saving todo list after deletion:', saveError);
              return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                  error: 'Server error', 
                  message: 'Failed to delete todo: ' + saveError.message 
                })
              };
            }
          }
        }
      }
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Todo lists error:', error.message);
    
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
