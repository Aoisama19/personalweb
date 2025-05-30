const mongoose = require('mongoose');

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

module.exports = mongoose.model('album', AlbumSchema);
