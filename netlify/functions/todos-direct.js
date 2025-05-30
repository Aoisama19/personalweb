// Direct Todo Lists function without Express routing
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Define the Todo and TodoList schemas
const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TodoListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '📝'
  },
  todos: [TodoSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
const TodoList = mongoose.model('todoList', TodoListSchema);

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
    console.log('Todos direct function called with method:', event.httpMethod);
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
    
    console.log('Token validated successfully for user ID:', decoded.user.id);
    
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connection successful');
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError.message);
      throw dbError; // Re-throw to be caught by the outer try/catch
    }
    
    const userId = decoded.user.id;
    const pathParts = event.path.split('/');
    
    // Handle different HTTP methods for TodoLists
    if (pathParts.length <= 3) {
      // TodoList operations
      if (event.httpMethod === 'GET') {
        console.log('Processing GET request for todo lists, user ID:', userId);
        try {
          // Get all todo lists for the user
          console.log('Querying TodoList collection for user:', userId);
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
        const { title, icon } = JSON.parse(event.body);
        
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
        
        const newTodoList = new TodoList({
          user: userId,
          title,
          icon: icon || '📝',
          todos: []
        });
        
        await newTodoList.save();
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newTodoList)
        };
      } 
      else if (event.httpMethod === 'PUT') {
        // Update an existing todo list
        const listId = pathParts[2];
        const updates = JSON.parse(event.body);
        
        // Find the todo list and make sure it belongs to the user
        let todoList = await TodoList.findOne({ _id: listId, user: userId });
        
        if (!todoList) {
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
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(todoList)
        };
      } 
      else if (event.httpMethod === 'DELETE') {
        // Delete a todo list
        const listId = pathParts[2];
        
        // Find the todo list and make sure it belongs to the user
        const todoList = await TodoList.findOne({ _id: listId, user: userId });
        
        if (!todoList) {
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
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Todo list deleted successfully' })
        };
      }
    } 
    // Handle Todo item operations
    else if (pathParts.length >= 4) {
      const listId = pathParts[2];
      
      // Find the todo list and make sure it belongs to the user
      const todoList = await TodoList.findOne({ _id: listId, user: userId });
      
      if (!todoList) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            message: 'Todo list not found or does not belong to user' 
          })
        };
      }
      
      if (event.httpMethod === 'POST') {
        // Add a new todo to the list
        const { text } = JSON.parse(event.body);
        
        // Validate required fields
        if (!text) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Bad request', 
              message: 'Todo text is required' 
            })
          };
        }
        
        const newTodo = {
          text,
          completed: false,
          createdAt: new Date()
        };
        
        todoList.todos.push(newTodo);
        await todoList.save();
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newTodo)
        };
      } 
      else if (event.httpMethod === 'PUT') {
        // Update a todo in the list
        const todoId = pathParts[4];
        const { text, completed } = JSON.parse(event.body);
        
        // Find the todo in the list
        const todo = todoList.todos.id(todoId);
        
        if (!todo) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Todo not found in the list' 
            })
          };
        }
        
        // Update the todo
        if (text !== undefined) todo.text = text;
        if (completed !== undefined) todo.completed = completed;
        
        await todoList.save();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(todo)
        };
      } 
      else if (event.httpMethod === 'DELETE') {
        // Delete a todo from the list
        const todoId = pathParts[4];
        
        // Find the todo in the list
        const todo = todoList.todos.id(todoId);
        
        if (!todo) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: 'Not found', 
              message: 'Todo not found in the list' 
            })
          };
        }
        
        // Remove the todo
        todoList.todos.pull(todoId);
        await todoList.save();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Todo deleted successfully' })
        };
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
