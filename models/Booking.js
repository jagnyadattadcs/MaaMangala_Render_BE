const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: String
  },
  registrationNumber: {
    type: String
  },
  fuel: {
    type: String
  },
  services: [{
    type: String,
    required: true
  }],
  description: {
    type: String
  },
  date: {
    type: String
  },
  time: {
    type: String
  },
  serviceType: {
    type: String,
    enum: ['pickup', 'workshop']
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  pincode: {
    type: String
  },
  email: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
