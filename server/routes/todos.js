const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Import models
const TodoList = require('../models/TodoList');
const User = require('../models/User');

// @route   GET api/todos
// @desc    Get all todo lists for the user and their partner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get user with partner info
    const user = await User.findById(req.user.id);
    
    // Get todo lists for the user
    const userLists = await TodoList.find({ user: req.user.id });
    
    // Get partner's todo lists if partner exists
    let partnerLists = [];
    if (user.partner) {
      partnerLists = await TodoList.find({ user: user.partner });
    }
    
    // Combine lists
    const lists = [...userLists, ...partnerLists];
    
    res.json(lists);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/todos
// @desc    Create a new todo list
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, icon } = req.body;

      // Create new todo list
      const newList = new TodoList({
        user: req.user.id,
        title,
        icon: icon || '📝',
        todos: []
      });

      // Save to database
      const savedList = await newList.save();
      
      res.json(savedList);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/todos/:id
// @desc    Get todo list by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const todoList = await TodoList.findById(req.params.id);
    
    if (!todoList) {
      return res.status(404).json({ msg: 'Todo list not found' });
    }

    // Check if user owns the list or is the partner of the owner
    const user = await User.findById(req.user.id);
    if (todoList.user.toString() !== req.user.id && 
        (!user.partner || todoList.user.toString() !== user.partner.toString())) {
      return res.status(401).json({ msg: 'Not authorized to view this todo list' });
    }

    res.json(todoList);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Todo list not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/todos/:id
// @desc    Update a todo list
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, icon } = req.body;

    // Find todo list by id
    let todoList = await TodoList.findById(req.params.id);

    // Check if todo list exists
    if (!todoList) {
      return res.status(404).json({ msg: 'Todo list not found' });
    }

    // Check if user owns the todo list
    if (todoList.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this todo list' });
    }

    // Update fields
    todoList.title = title || todoList.title;
    todoList.icon = icon || todoList.icon;

    // Save updated todo list
    await todoList.save();
    
    res.json(todoList);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Todo list not found' });
    }
    res.status(500).send('Server Error');
  }
});

// DELETE route for todo lists is defined at the end of the file

// @route   POST api/todos/:id/todo
// @desc    Add a todo to a list
// @access  Private
router.post(
  '/:id/todo',
  [
    auth,
    [
      check('text', 'Todo text is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { text } = req.body;

      // Find todo list by id
      let todoList = await TodoList.findById(req.params.id);

      // Check if todo list exists
      if (!todoList) {
        return res.status(404).json({ msg: 'Todo list not found' });
      }

      // Check if user owns the todo list
      if (todoList.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to add to this todo list' });
      }

      // Add new todo
      const newTodo = {
        text,
        completed: false
      };

      todoList.todos.unshift(newTodo);

      // Save updated todo list
      await todoList.save();
      
      res.json(todoList);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Todo list not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/todos/:id/todo/:todo_id
// @desc    Update a todo in a list
// @access  Private
router.put('/:id/todo/:todo_id', auth, async (req, res) => {
  try {
    const { text, completed } = req.body;

    // Find todo list by id
    let todoList = await TodoList.findById(req.params.id);

    // Check if todo list exists
    if (!todoList) {
      return res.status(404).json({ msg: 'Todo list not found' });
    }

    // Check if user owns the todo list
    if (todoList.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this todo list' });
    }

    // Find the todo
    const todoIndex = todoList.todos.findIndex(todo => todo.id === req.params.todo_id);

    if (todoIndex === -1) {
      return res.status(404).json({ msg: 'Todo not found' });
    }

    // Update todo
    if (text) todoList.todos[todoIndex].text = text;
    if (completed !== undefined) todoList.todos[todoIndex].completed = completed;

    // Save updated todo list
    await todoList.save();
    
    res.json(todoList);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Todo list or todo not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/todos/:id/todo/:todo_id
// @desc    Delete a todo from a list
// @access  Private
router.delete('/:id/todo/:todo_id', auth, async (req, res) => {
  try {
    // Find todo list by id
    let todoList = await TodoList.findById(req.params.id);

    // Check if todo list exists
    if (!todoList) {
      return res.status(404).json({ msg: 'Todo list not found' });
    }

    // Check if user owns the todo list
    if (todoList.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this todo list' });
    }

    // Find the todo
    const todoIndex = todoList.todos.findIndex(todo => todo.id === req.params.todo_id);

    if (todoIndex === -1) {
      return res.status(404).json({ msg: 'Todo not found' });
    }

    // Remove todo
    todoList.todos.splice(todoIndex, 1);

    // Save updated todo list
    await todoList.save();
    
    res.json(todoList);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Todo list or todo not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/todos/:id
// @desc    Delete a todo list
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting todo list with ID:', req.params.id);
    
    // Delete the todo list directly by ID
    const result = await TodoList.findByIdAndDelete(req.params.id);
    
    // Check if todo list was found and deleted
    if (!result) {
      return res.status(404).json({ msg: 'Todo list not found' });
    }
    
    console.log('Todo list deleted successfully');
    res.json({ msg: 'Todo list deleted' });
  } catch (err) {
    console.error('Error deleting todo list:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Todo list not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
