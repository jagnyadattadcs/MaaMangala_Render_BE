const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    imageUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true,
      unique: true
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    isFeatured: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    width: Number,
    height: Number
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GalleryImage', galleryImageSchema);