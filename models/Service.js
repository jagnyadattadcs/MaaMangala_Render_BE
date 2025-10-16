const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true,
    enum: ['Settings', 'Battery', 'Wrench', 'Car', 'Zap', 'Gauge', 'PaintBucket', 'Shield', 'CheckCircle']
  },
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String,
    required: true
  }],
  price: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);