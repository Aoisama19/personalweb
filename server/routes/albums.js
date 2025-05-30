const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Import models
const Album = require('../models/Album');
const User = require('../models/User');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// @route   GET api/albums
// @desc    Get all albums for the user and their partner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Get user with partner info
    const user = await User.findById(req.user.id);
    
    // Get albums for the user
    const userAlbums = await Album.find({ user: req.user.id });
    
    // Get partner's albums if partner exists
    let partnerAlbums = [];
    if (user.partner) {
      partnerAlbums = await Album.find({ user: user.partner });
    }
    
    // Combine albums
    const albums = [...userAlbums, ...partnerAlbums];
    
    res.json(albums);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/albums
// @desc    Create a new album
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
      const { title, description, date } = req.body;

      // Create new album
      const newAlbum = new Album({
        user: req.user.id,
        title,
        description,
        date: date || Date.now(),
        photos: []
      });

      // Save to database
      const savedAlbum = await newAlbum.save();
      
      res.json(savedAlbum);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/albums/:id
// @desc    Get album by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Check if user owns the album or is the partner of the owner
    const user = await User.findById(req.user.id);
    if (album.user.toString() !== req.user.id && 
        (!user.partner || album.user.toString() !== user.partner.toString())) {
      return res.status(401).json({ msg: 'Not authorized to view this album' });
    }

    res.json(album);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/albums/:id
// @desc    Update an album
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, date, coverImage } = req.body;

    // Find album by id
    let album = await Album.findById(req.params.id);

    // Check if album exists
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Check if user owns the album
    if (album.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this album' });
    }

    // Update fields
    album.title = title || album.title;
    album.description = description !== undefined ? description : album.description;
    album.date = date || album.date;
    if (coverImage) album.coverImage = coverImage;

    // Save updated album
    await album.save();
    
    res.json(album);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/albums/:id
// @desc    Delete an album
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find album by id
    const album = await Album.findById(req.params.id);

    // Check if album exists
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Check if user owns the album
    if (album.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this album' });
    }

    // Remove album
    await Album.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Album removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Album not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/albums/:id/photos
// @desc    Add a photo to an album
// @access  Private
router.post(
  '/:id/photos',
  [auth, upload.single('photo')],
  async (req, res) => {
    try {
      // Find album by id
      let album = await Album.findById(req.params.id);

      // Check if album exists
      if (!album) {
        return res.status(404).json({ msg: 'Album not found' });
      }

      // Check if user owns the album
      if (album.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to add to this album' });
      }

      const { caption, date } = req.body;
      
      // In a real app, you would upload the file to a cloud storage service
      // For this demo, we'll just use the file path
      // Construct URL based on environment
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-url.onrender.com' 
        : 'http://localhost:5000';
      const photoUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : null;
      
      if (!photoUrl) {
        return res.status(400).json({ msg: 'No photo uploaded' });
      }

      // Add new photo
      const newPhoto = {
        url: photoUrl,
        caption,
        date: date || Date.now()
      };

      // If this is the first photo, set it as the cover image
      if (album.photos.length === 0 && !album.coverImage) {
        album.coverImage = photoUrl;
      }

      album.photos.unshift(newPhoto);

      // Save updated album
      await album.save();
      
      res.json(album);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Album not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/albums/:id/photos/:photo_id
// @desc    Delete a photo from an album
// @access  Private
router.delete('/:id/photos/:photo_id', auth, async (req, res) => {
  try {
    // Find album by id
    let album = await Album.findById(req.params.id);

    // Check if album exists
    if (!album) {
      return res.status(404).json({ msg: 'Album not found' });
    }

    // Check if user owns the album
    if (album.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this album' });
    }

    // Find the photo
    const photoIndex = album.photos.findIndex(photo => photo.id === req.params.photo_id);

    if (photoIndex === -1) {
      return res.status(404).json({ msg: 'Photo not found' });
    }

    // Check if the photo is the cover image
    if (album.coverImage === album.photos[photoIndex].url) {
      // If there are other photos, set the first one as the cover
      if (album.photos.length > 1) {
        const newCoverIndex = photoIndex === 0 ? 1 : 0;
        album.coverImage = album.photos[newCoverIndex].url;
      } else {
        album.coverImage = null;
      }
    }

    // Remove photo
    album.photos.splice(photoIndex, 1);

    // Save updated album
    await album.save();
    
    res.json(album);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Album or photo not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
