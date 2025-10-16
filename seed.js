const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const seedServices = [
  {
    icon: 'Settings',
    title: 'Engine Repair',
    description: 'Complete engine diagnostics, repair, and maintenance services',
    features: ['Engine diagnostics', 'Oil change', 'Tune-up', 'Performance optimization'],
    price: 'From ₹2,000',
    duration: '2-4 hours',
    rating: 4.8
  },
  {
    icon: 'Car',
    title: 'AC Service',
    description: 'Air conditioning system repair and maintenance',
    features: ['AC gas refill', 'Filter replacement', 'Compressor repair', 'Temperature control'],
    price: 'From ₹1,500',
    duration: '1-2 hours',
    rating: 4.9
  },
  {
    icon: 'Wrench',
    title: 'Brake Service',
    description: 'Complete brake system inspection and repair',
    features: ['Brake pad replacement', 'Brake fluid change', 'Disc/drum service', 'ABS repair'],
    price: 'From ₹1,200',
    duration: '2-3 hours',
    rating: 4.7
  },
  {
    icon: 'Battery',
    title: 'Battery Service',
    description: 'Battery testing, maintenance, and replacement',
    features: ['Battery testing', 'Terminal cleaning', 'Battery replacement', 'Charging system check'],
    price: 'From ₹800',
    duration: '30 minutes',
    rating: 4.9
  },
  {
    icon: 'Car',
    title: 'Tyre Service',
    description: 'Complete tyre care and replacement services',
    features: ['Tyre rotation', 'Balancing & alignment', 'Puncture repair', 'Tyre replacement'],
    price: 'From ₹500',
    duration: '1 hour',
    rating: 4.8
  },
  {
    icon: 'Gauge',
    title: 'Transmission Service',
    description: 'Manual and automatic transmission repair',
    features: ['Transmission fluid change', 'Clutch repair', 'Gear box service', 'CVT maintenance'],
    price: 'From ₹3,000',
    duration: '4-6 hours',
    rating: 4.6
  },
  {
    icon: 'Zap',
    title: 'Electrical Service',
    description: 'Electrical system diagnostics and repair',
    features: ['Wiring inspection', 'Light replacement', 'Starter/alternator service', 'ECU diagnostics'],
    price: 'From ₹1,000',
    duration: '1-3 hours',
    rating: 4.7
  },
  {
    icon: 'Shield',
    title: 'Suspension Service',
    description: 'Suspension system repair and maintenance',
    features: ['Shock absorber replacement', 'Spring service', 'Strut repair', 'Steering alignment'],
    price: 'From ₹2,500',
    duration: '3-5 hours',
    rating: 4.8
  },
  {
    icon: 'PaintBucket',
    title: 'Paint & Body',
    description: 'Complete paint job and body repair services',
    features: ['Dent removal', 'Paint touch-up', 'Full body paint', 'Scratch repair'],
    price: 'From ₹5,000',
    duration: '1-3 days',
    rating: 4.5
  },
  {
    icon: 'Car',
    title: 'Interior Cleaning',
    description: 'Deep cleaning and detailing services',
    features: ['Seat cleaning', 'Dashboard polish', 'Carpet wash', 'Odor removal'],
    price: 'From ₹1,500',
    duration: '2-3 hours',
    rating: 4.8
  },
  {
    icon: 'CheckCircle',
    title: 'General Checkup',
    description: 'Comprehensive vehicle health inspection',
    features: ['Multi-point inspection', 'Diagnostic scan', 'Safety check', 'Performance report'],
    price: 'From ₹500',
    duration: '1 hour',
    rating: 4.9
  },
  {
    icon: 'Settings',
    title: 'Periodic Maintenance',
    description: 'Scheduled maintenance as per manufacturer guidelines',
    features: ['Service reminder', 'Warranty maintenance', 'Genuine parts', 'Service history'],
    price: 'From ₹2,000',
    duration: '2-4 hours',
    rating: 4.8
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-garage', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if services already exist
    const existingServices = await Service.countDocuments();
    if (existingServices > 0) {
      console.log('Services already exist in database');
      return;
    }

    // Insert seed data
    await Service.insertMany(seedServices);
    console.log('Database seeded successfully with initial services');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();