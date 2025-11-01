const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');

const resend = new Resend(process.env.RESEND_API_KEY);

// Verified domain से email send करें
const EMAIL_SENDER = 'onboarding@resend.dev'; // या आपका verified domain
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || 'maamangalaautoworks5@gmail.com';
const CONTACT_NOTIFICATION_EMAIL = process.env.CONTACT_EMAIL || 'maamangalaautoworks5@gmail.com';

// Improved Email Function
const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    //('No recipient email provided');
    return { success: false, error: 'No recipient email' };
  }

  try {
    //(`Attempting to send email to: ${to}`);
    //(`Subject: ${subject}`);
    
    const result = await resend.emails.send({
      from: EMAIL_SENDER,
      to,
      subject,
      html,
    });

    //('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

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
  //('MongoDB connected');

  // Seed database if empty
  const Service = require('./models/Service');
  const existingServices = await Service.countDocuments();
  if (existingServices === 0) {
    //('Seeding database with initial services...');
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
      //('Database seeded successfully with initial services');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  } else {
    //('Services already exist in database');
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

// Test endpoint for email functionality
app.post('/api/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const result = await sendEmail({
      to,
      subject: 'Test Email from Car Service',
      html: '<h1>Test Email</h1><p>This is a test email from your car service application.</p>'
    });

    res.json({
      message: 'Test email sent',
      result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

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
    //('Received booking data:', bookingData);

    // Validation
    if (!bookingData.brand || !bookingData.model || !bookingData.name || !bookingData.phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedServices = Array.isArray(bookingData.services) ? bookingData.services : [];
    const normalizedServiceType = bookingData.serviceType === 'pickup' ? 'pickup' : 'workshop';

    // Create booking
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

    //('Booking created successfully:', booking._id);

    const servicesDisplay = normalizedServices.length > 0 ? normalizedServices.join(', ') : 'Not specified';
    const serviceTypeLabel = normalizedServiceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
    const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

    // Send confirmation email to customer
    let customerEmailResult = { success: false };
    if (booking.email) {
      //('Sending confirmation email to customer:', booking.email);
      customerEmailResult = await sendEmail({
        to: booking.email,
        subject: 'Booking Confirmation - Car Service',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Booking Confirmation</h2>
          <p>Dear ${booking.name},</p>
          <p>Thank you for booking a car service with us. Below are your booking details:</p>
          
          <h3 style="color: #374151;">Car Details</h3>
          <ul>
            <li><strong>Brand:</strong> ${booking.brand}</li>
            <li><strong>Model:</strong> ${booking.model}</li>
            <li><strong>Year:</strong> ${booking.year || 'Not specified'}</li>
            <li><strong>Registration:</strong> ${booking.registrationNumber || 'Not specified'}</li>
            <li><strong>Fuel Type:</strong> ${booking.fuel || 'Not specified'}</li>
          </ul>
          
          <h3 style="color: #374151;">Services</h3>
          <p>${servicesDisplay}</p>
          
          ${booking.description ? `<h3 style="color: #374151;">Issue Description</h3><p>${booking.description}</p>` : ''}
          
          <h3 style="color: #374151;">Appointment Details</h3>
          <ul>
            <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
            <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
            <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
          </ul>
          
          <h3 style="color: #374151;">Contact Information</h3>
          <ul>
            <li><strong>Name:</strong> ${booking.name}</li>
            <li><strong>Phone:</strong> ${booking.phone}</li>
            ${addressDisplay ? `<li><strong>Address:</strong> ${addressDisplay}</li>` : ''}
            ${booking.email ? `<li><strong>Email:</strong> ${booking.email}</li>` : ''}
          </ul>
          
          <p style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
            <strong>Note:</strong> We will contact you within 2 hours to confirm your appointment.
          </p>
          
          <p>Thank you,<br><strong>Maa Mangala Auto Works Team</strong></p>
          <p style="color: #6b7280; font-size: 12px;">
            Contact: +91 98765 43210 | Email: maamangalaautoworks5@gmail.com
          </p>
        </div>
      `,
      });
    } else {
      //('No customer email provided, skipping customer confirmation email');
    }

    // Send notification email to admin
    //('Sending notification email to admin:', ADMIN_NOTIFICATION_EMAIL);
    const adminEmailResult = await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: 'New Booking Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Booking Notification</h2>
          <p>A new booking has been received with the following details:</p>
          
          <h3 style="color: #374151;">Car Details</h3>
          <ul>
            <li><strong>Brand:</strong> ${booking.brand}</li>
            <li><strong>Model:</strong> ${booking.model}</li>
            <li><strong>Year:</strong> ${booking.year || 'Not specified'}</li>
            <li><strong>Registration:</strong> ${booking.registrationNumber || 'Not specified'}</li>
            <li><strong>Fuel Type:</strong> ${booking.fuel || 'Not specified'}</li>
          </ul>
          
          <h3 style="color: #374151;">Services</h3>
          <p>${servicesDisplay}</p>
          
          ${booking.description ? `<h3 style="color: #374151;">Issue Description</h3><p>${booking.description}</p>` : ''}
          
          <h3 style="color: #374151;">Appointment Details</h3>
          <ul>
            <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
            <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
            <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
          </ul>
          
          <h3 style="color: #374151;">Customer Information</h3>
          <ul>
            <li><strong>Name:</strong> ${booking.name}</li>
            <li><strong>Phone:</strong> ${booking.phone}</li>
            ${addressDisplay ? `<li><strong>Address:</strong> ${addressDisplay}</li>` : ''}
            ${booking.email ? `<li><strong>Email:</strong> ${booking.email}</li>` : ''}
          </ul>
          
          <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px;">
            <strong>Action Required:</strong> Please process this booking and contact the customer.
          </p>
        </div>
      `,
    });

    // Response with email status
    res.status(200).json({
      message: 'Booking submitted successfully',
      booking,
      emailStatus: {
        customer: customerEmailResult.success ? 'sent' : 'failed',
        admin: adminEmailResult.success ? 'sent' : 'failed'
      }
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ 
      error: 'Failed to process booking',
      details: error.message 
    });
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

    let emailResult = { success: false };
    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      emailResult = await sendEmail({
        to: booking.email,
        subject: 'Booking Accepted - Car Service',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Booking Accepted</h2>
            <p>Dear ${booking.name},</p>
            <p>Your booking has been accepted.</p>
            
            <h3 style="color: #374151;">Booking Details</h3>
            <ul>
              <li><strong>Brand:</strong> ${booking.brand}</li>
              <li><strong>Model:</strong> ${booking.model}</li>
              <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
              <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
              <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
              <li><strong>Services:</strong> ${servicesDisplay}</li>
            </ul>
            
            ${addressDisplay ? `<p><strong>Address:</strong> ${addressDisplay}</p>` : ''}
            
            <p style="background-color: #d1fae5; padding: 15px; border-radius: 5px;">
              <strong>Next Steps:</strong> Our team will contact you shortly for further details.
            </p>
            
            <p>Thank you,<br><strong>Maa Mangala Auto Works Team</strong></p>
          </div>
        `,
      });
    }

    res.status(200).json({ 
      message: 'Booking accepted successfully', 
      booking,
      emailSent: emailResult.success
    });
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

    let emailResult = { success: false };
    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      emailResult = await sendEmail({
        to: booking.email,
        subject: 'Booking Cancellation - Car Service',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Booking Update</h2>
            <p>Dear ${booking.name},</p>
            <p>There are no available slots, so it has been cancelled.</p>
            
            <h3 style="color: #374151;">Booking Details</h3>
            <ul>
              <li><strong>Brand:</strong> ${booking.brand}</li>
              <li><strong>Model:</strong> ${booking.model}</li>
              <li><strong>Date:</strong> ${booking.date || 'Not specified'}</li>
              <li><strong>Time:</strong> ${booking.time || 'Not specified'}</li>
              <li><strong>Service Type:</strong> ${serviceTypeLabel}</li>
              <li><strong>Services:</strong> ${servicesDisplay}</li>
            </ul>
            
            ${addressDisplay ? `<p><strong>Address:</strong> ${addressDisplay}</p>` : ''}
            
            <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px;">
              <strong>Note:</strong> Please contact us for alternative appointment slots.
            </p>
            
            <p>Thank you,<br><strong>Maa Mangala Auto Works Team</strong></p>
          </div>
        `,
      });
    }

    res.status(200).json({ 
      message: 'Booking cancelled successfully', 
      booking,
      emailSent: emailResult.success
    });
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
    // //('Received contact data:', contactData);

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
    let customerEmailResult = { success: false };
    if (contactData.email) {
      //('Sending confirmation email to customer:', contactData.email);
      customerEmailResult = await sendEmail({
        to: contactData.email,
        subject: `Thank You for Your Message - ${contactData.subject}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Contact Confirmation</h2>
          <p>Dear ${contactData.name},</p>
          <p>Thank you for reaching out to Maa Mangala. We have received your message and will get back to you within 24 hours.</p>
          
          <h3 style="color: #374151;">Your Message Details</h3>
          <ul>
            <li><strong>Name:</strong> ${contactData.name}</li>
            <li><strong>Email:</strong> ${contactData.email}</li>
            <li><strong>Phone:</strong> ${contactData.phone}</li>
            <li><strong>Subject:</strong> ${contactData.subject}</li>
            <li><strong>Message:</strong> ${contactData.message}</li>
          </ul>
          
          <p style="background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
            <strong>Urgent Support:</strong> If you have any urgent queries, please call our 24/7 support line at <strong>+91 98765 43210</strong>.
          </p>
          
          <p>Thank you,<br><strong>Maa Mangala Auto Works Team</strong></p>
        </div>
      `,
      });
    }

    // Send notification email to admin
    //('Sending notification email to admin:', CONTACT_NOTIFICATION_EMAIL);
    const adminEmailResult = await sendEmail({
      to: CONTACT_NOTIFICATION_EMAIL,
      subject: `New Contact Message - ${contactData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Contact Message Received</h2>
          <p>A new contact message has been received with the following details:</p>
          
          <h3 style="color: #374151;">Message Details</h3>
          <ul>
            <li><strong>Name:</strong> ${contactData.name}</li>
            <li><strong>Email:</strong> ${contactData.email}</li>
            <li><strong>Phone:</strong> ${contactData.phone}</li>
            <li><strong>Subject:</strong> ${contactData.subject}</li>
            <li><strong>Message:</strong> ${contactData.message}</li>
          </ul>
          
          <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px;">
            <strong>Action Required:</strong> Please respond to the customer within 24 hours.
          </p>
        </div>
      `,
    });

    res.status(200).json({ 
      message: 'Contact message submitted successfully', 
      data: message,
      emailStatus: {
        customer: customerEmailResult.success ? 'sent' : 'failed',
        admin: adminEmailResult.success ? 'sent' : 'failed'
      }
    });
  } catch (error) {
    console.error('Error processing contact message:', error);
    res.status(500).json({ error: 'Failed to process contact message' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(port, () => {
  //(`Server running on port ${port}`);
  //(`Environment: ${process.env.NODE_ENV || 'development'}`);
  //(`Email Sender: ${EMAIL_SENDER}`);
  //(`Admin Email: ${ADMIN_NOTIFICATION_EMAIL}`);
});