const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car-garage', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');

  // Seed database if empty
  const Service = require('./models/Service');
  const existingServices = await Service.countDocuments();
  if (existingServices === 0) {
    console.log('Seeding database with initial services...');
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
    try {
      await Service.insertMany(seedServices);
      console.log('Database seeded successfully with initial services');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  } else {
    console.log('Services already exist in database');
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const serviceRoutes = require('./routes/services');
const galleryRoutes = require('./routes/gallery');

// Use routes
app.use('/api/services', serviceRoutes);
app.use('/api/gallery', galleryRoutes);

let messages = [];

app.get('/api/bookings', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['pending', 'accepted', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const bookingList = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookingList);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Booking submission endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;

    if (!bookingData.brand || !bookingData.model || !bookingData.name || !bookingData.phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedServices = Array.isArray(bookingData.services) ? bookingData.services : [];
    const normalizedServiceType = bookingData.serviceType === 'pickup' ? 'pickup' : 'workshop';

    const booking = await Booking.create({
      brand: bookingData.brand,
      model: bookingData.model,
      year: bookingData.year,
      registrationNumber: bookingData.registrationNumber,
      fuel: bookingData.fuel,
      services: normalizedServices,
      description: bookingData.description,
      date: bookingData.date,
      time: bookingData.time,
      serviceType: normalizedServiceType,
      name: bookingData.name,
      phone: bookingData.phone,
      address: bookingData.address,
      city: bookingData.city,
      pincode: bookingData.pincode,
      email: bookingData.email
    });

    const servicesDisplay = normalizedServices.length > 0 ? normalizedServices.join(', ') : 'Not specified';
    const serviceTypeLabel = normalizedServiceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
    const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.email || '',
      subject: 'Booking Confirmation - Car Service',
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${booking.name},</p>
        <p>Thank you for booking a car service with us. Below are your booking details:</p>
        <h3>Car Details</h3>
        <ul>
          <li><strong>Brand:</strong> ${booking.brand}</li>
          <li><strong>Model:</strong> ${booking.model}</li>
          <li><strong>Year:</strong> ${booking.year || 'Not specified'}</li>
          <li><strong>Registration:</strong> ${booking.registrationNumber || 'Not specified'}</li>
          <li><strong>Fuel Type:</strong> ${booking.fuel || 'Not specified'}</li>
        </ul>
        <h3>Services</h3>
        <p>${servicesDisplay}</p>
        ${booking.description ? `<h3>Issue Description</h3><p>${booking.description}</p>` : ''}
        <h3>Appointment Details</h3>
        <ul>
          <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
          <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
          <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
        </ul>
        <h3>Contact Information</h3>
        <ul>
          <li><strong>Name:</strong> ${booking.name}</li>
          <li><strong>Phone:</strong> ${booking.phone}</li>
          ${addressDisplay ? `<li><strong>Address:</strong> ${addressDisplay}</li>` : ''}
          ${booking.email ? `<li><strong>Email:</strong> ${booking.email}</li>` : ''}
        </ul>
        <p>We will contact you within 2 hours to confirm your appointment.</p>
        <p>Thank you,<br>Car Service Team</p>
      `
    };

    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'maamangalaautoworks5@gmail.com',
      subject: 'New Booking Received',
      html: `
        <h2>New Booking Notification</h2>
        <p>A new booking has been received with the following details:</p>
        <h3>Car Details</h3>
        <ul>
          <li><strong>Brand:</strong> ${booking.brand}</li>
          <li><strong>Model:</strong> ${booking.model}</li>
          <li><strong>Year:</strong> ${booking.year || 'Not specified'}</li>
          <li><strong>Registration:</strong> ${booking.registrationNumber || 'Not specified'}</li>
          <li><strong>Fuel Type:</strong> ${booking.fuel || 'Not specified'}</li>
        </ul>
        <h3>Services</h3>
        <p>${servicesDisplay}</p>
        ${booking.description ? `<h3>Issue Description</h3><p>${booking.description}</p>` : ''}
        <h3>Appointment Details</h3>
        <ul>
          <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
          <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
          <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
        </ul>
        <h3>Customer Information</h3>
        <ul>
          <li><strong>Name:</strong> ${booking.name}</li>
          <li><strong>Phone:</strong> ${booking.phone}</li>
          ${addressDisplay ? `<li><strong>Address:</strong> ${addressDisplay}</li>` : ''}
          ${booking.email ? `<li><strong>Email:</strong> ${booking.email}</li>` : ''}
        </ul>
        <p>Please process this booking and contact the customer.</p>
      `
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ message: 'Booking submitted successfully', booking });
  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

app.patch('/api/bookings/:id/accept', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'accepted') {
      return res.status(200).json({ message: 'Booking already accepted', booking });
    }

    booking.status = 'accepted';
    await booking.save();

    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: 'Booking Accepted - Car Service',
        html: `
          <h2>Booking Accepted</h2>
          <p>Dear ${booking.name},</p>
          <p>Your booking has been accepted.</p>
          <h3>Booking Details</h3>
          <ul>
            <li><strong>Brand:</strong> ${booking.brand}</li>
            <li><strong>Model:</strong> ${booking.model}</li>
            <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
            <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
            <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
            <li><strong>Services:</strong> ${servicesDisplay}</li>
          </ul>
          ${addressDisplay ? `<p><strong>Address:</strong> ${addressDisplay}</p>` : ''}
          <p>Thank you,<br>Car Service Team</p>
        `
      });
    }

    res.status(200).json({ message: 'Booking accepted successfully', booking });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: 'Failed to accept booking' });
  }
});

app.patch('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(200).json({ message: 'Booking already cancelled', booking });
    }

    booking.status = 'cancelled';
    await booking.save();

    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: 'Booking Cancellation - Car Service',
        html: `
          <h2>Booking Update</h2>
          <p>Dear ${booking.name},</p>
          <p>There are no available slots, so it has been cancelled.</p>
          <h3>Booking Details</h3>
          <ul>
            <li><strong>Brand:</strong> ${booking.brand}</li>
            <li><strong>Model:</strong> ${booking.model}</li>
            <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
            <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
            <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
            <li><strong>Services:</strong> ${servicesDisplay}</li>
          </ul>
          ${addressDisplay ? `<p><strong>Address:</strong> ${addressDisplay}</p>` : ''}
          <p>Thank you,<br>Car Service Team</p>
        `
      });
    }

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.deleteOne();

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = req.body;

    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.phone || !contactData.subject || !contactData.message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Store message
    const message = {
      id: messages.length + 1,
      ...contactData,
      createdAt: new Date().toISOString(),
    };
    messages.push(message);

    // Prepare email content for customer
    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: contactData.email,
      subject: `Thank You for Your Message - ${contactData.subject}`,
      html: `
        <h2>Contact Confirmation</h2>
        <p>Dear ${contactData.name},</p>
        <p>Thank you for reaching out to Maa Mangala. We have received your message and will get back to you within 24 hours.</p>
        <h3>Your Message Details</h3>
        <ul>
          <li><strong>Name:</strong> ${contactData.name}</li>
          <li><strong>Email:</strong> ${contactData.email}</li>
          <li><strong>Phone:</strong> ${contactData.phone}</li>
          <li><strong>Subject:</strong> ${contactData.subject}</li>
          <li><strong>Message:</strong> ${contactData.message}</li>
        </ul>
        <p>If you have any urgent queries, please call our 24/7 support line at +91 98765 43210.</p>
        <p>Thank you,<br>Maa Mangala Team</p>
      `,
    };

    // Prepare email content for admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'chandanpradhan820@gmail.com', // Replace with service center's email
      subject: `New Contact Message - ${contactData.subject}`,
      html: `
        <h2>New Contact Message Received</h2>
        <p>A new contact message has been received with the following details:</p>
        <h3>Message Details</h3>
        <ul>
          <li><strong>Name:</strong> ${contactData.name}</li>
          <li><strong>Email:</strong> ${contactData.email}</li>
          <li><strong>Phone:</strong> ${contactData.phone}</li>
          <li><strong>Subject:</strong> ${contactData.subject}</li>
          <li><strong>Message:</strong> ${contactData.message}</li>
        </ul>
        <p>Please respond to the customer within 24 hours.</p>
      `,
    };

    // Send emails
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ message: 'Contact message submitted successfully', data: message });
  } catch (error) {
    console.error('Error processing contact message:', error);
    res.status(500).json({ error: 'Failed to process contact message' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});