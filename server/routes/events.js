const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Import models
const Event = require('../models/Event');
const User = require('../models/User');

// @route   GET api/events
// @desc    Get all events for the user and their partner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get user with partner info
    const user = await User.findById(req.user.id);
    
    // Get events for the user
    const userEvents = await Event.find({ user: req.user.id });
    
    // Get partner's events if partner exists
    let partnerEvents = [];
    if (user.partner) {
      partnerEvents = await Event.find({ user: user.partner });
    }
    
    // Combine events
    const events = [...userEvents, ...partnerEvents];
    
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/events
// @desc    Create a new event
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('date', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, date, endDate, location, description, category } = req.body;

      // Create new event
      const newEvent = new Event({
        user: req.user.id,
        title,
        date,
        endDate,
        location,
        description,
        category
      });

      // Save to database
      const savedEvent = await newEvent.save();
      
      res.json(savedEvent);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if user owns the event or is the partner of the owner
    const user = await User.findById(req.user.id);
    if (event.user.toString() !== req.user.id && 
        (!user.partner || event.user.toString() !== user.partner.toString())) {
      return res.status(401).json({ msg: 'Not authorized to view this event' });
    }

    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/events/:id
// @desc    Update an event
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, endDate, location, description, category } = req.body;

    // Find event by id
    let event = await Event.findById(req.params.id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if user owns the event
    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this event' });
    }

    // Update fields
    event.title = title || event.title;
    event.date = date || event.date;
    event.endDate = endDate || event.endDate;
    event.location = location !== undefined ? location : event.location;
    event.description = description !== undefined ? description : event.description;
    event.category = category || event.category;

    // Save updated event
    await event.save();
    
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find event by id
    const event = await Event.findById(req.params.id);

    // Check if event exists
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if user owns the event
    if (event.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this event' });
    }

    // Remove event
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
