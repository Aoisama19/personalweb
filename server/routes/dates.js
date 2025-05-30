const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Import models
const ImportantDate = require('../models/ImportantDate');
const User = require('../models/User');

// @route   GET api/dates
// @desc    Get all important dates for the user and their partner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get user with partner info
    const user = await User.findById(req.user.id);
    
    // Get dates for the user
    const userDates = await ImportantDate.find({ user: req.user.id });
    
    // Get partner's dates if partner exists
    let partnerDates = [];
    if (user.partner) {
      partnerDates = await ImportantDate.find({ user: user.partner });
    }
    
    // Combine dates
    const dates = [...userDates, ...partnerDates];
    
    res.json(dates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/dates
// @desc    Create a new important date
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('date', 'Date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, date, category, recurring, notes } = req.body;

      // Create new date
      const newDate = new ImportantDate({
        user: req.user.id,
        title,
        date,
        category,
        recurring,
        notes
      });

      // Save to database
      const savedDate = await newDate.save();
      
      res.json(savedDate);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/dates/:id
// @desc    Update an important date
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, category, recurring, notes } = req.body;

    // Find date by id
    let importantDate = await ImportantDate.findById(req.params.id);

    // Check if date exists
    if (!importantDate) {
      return res.status(404).json({ msg: 'Date not found' });
    }

    // Check if user owns the date
    if (importantDate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this date' });
    }

    // Update fields
    importantDate.title = title || importantDate.title;
    importantDate.date = date || importantDate.date;
    importantDate.category = category || importantDate.category;
    importantDate.recurring = recurring !== undefined ? recurring : importantDate.recurring;
    importantDate.notes = notes !== undefined ? notes : importantDate.notes;

    // Save updated date
    await importantDate.save();
    
    res.json(importantDate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Date not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/dates/:id
// @desc    Delete an important date
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find date by id
    const importantDate = await ImportantDate.findById(req.params.id);

    // Check if date exists
    if (!importantDate) {
      return res.status(404).json({ msg: 'Date not found' });
    }

    // Check if user owns the date
    if (importantDate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this date' });
    }

    // Remove date
    await ImportantDate.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Date removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Date not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
