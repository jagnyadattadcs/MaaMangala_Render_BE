const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for bookings (replace with a database in production)
let bookings = [];
let messages = [];

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});

// Booking submission endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;

    // Basic validation
    if (!bookingData.brand || !bookingData.model || !bookingData.name || !bookingData.phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store booking
    const booking = {
      id: bookings.length + 1,
      ...bookingData,
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);

    // Prepare email content
    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingData.email || '', // Fallback email if not provided
      subject: 'Booking Confirmation - Car Service',
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${bookingData.name},</p>
        <p>Thank you for booking a car service with us. Below are your booking details:</p>
        <h3>Car Details</h3>
        <ul>
          <li><strong>Brand:</strong> ${bookingData.brand}</li>
          <li><strong>Model:</strong> ${bookingData.model}</li>
          <li><strong>Year:</strong> ${bookingData.year}</li>
          <li><strong>Registration:</strong> ${bookingData.registrationNumber}</li>
          <li><strong>Fuel Type:</strong> ${bookingData.fuel}</li>
        </ul>
        <h3>Services</h3>
        <p>${bookingData.services.join(', ')}</p>
        ${bookingData.description ? `<h3>Issue Description</h3><p>${bookingData.description}</p>` : ''}
        <h3>Appointment Details</h3>
        <ul>
          <li><strong>Date:</strong> ${bookingData.date}</li>
          <li><strong>Time:</strong> ${bookingData.time}</li>
          <li><strong>Service Type:</strong> ${bookingData.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit'}</li>
        </ul>
        <h3>Contact Information</h3>
        <ul>
          <li><strong>Name:</strong> ${bookingData.name}</li>
          <li><strong>Phone:</strong> ${bookingData.phone}</li>
          <li><strong>Address:</strong> ${bookingData.address}, ${bookingData.city}, ${bookingData.pincode}</li>
          ${bookingData.email ? `<li><strong>Email:</strong> ${bookingData.email}</li>` : ''}
        </ul>
        <p>We will contact you within 2 hours to confirm your appointment.</p>
        <p>Thank you,<br>Car Service Team</p>
      `,
    };

    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'maamangalaautoworks5@gmail.com', // Replace with service center's email
      subject: 'New Booking Received',
      html: `
        <h2>New Booking Notification</h2>
        <p>A new booking has been received with the following details:</p>
        <h3>Car Details</h3>
        <ul>
          <li><strong>Brand:</strong> ${bookingData.brand}</li>
          <li><strong>Model:</strong> ${bookingData.model}</li>
          <li><strong>Year:</strong> ${bookingData.year}</li>
          <li><strong>Registration:</strong> ${bookingData.registrationNumber}</li>
          <li><strong>Fuel Type:</strong> ${bookingData.fuel}</li>
        </ul>
        <h3>Services</h3>
        <p>${bookingData.services.join(', ')}</p>
        ${bookingData.description ? `<h3>Issue Description</h3><p>${bookingData.description}</p>` : ''}
        <h3>Appointment Details</h3>
        <ul>
          <li><strong>Date:</strong> ${bookingData.date}</li>
          <li><strong>Time:</strong> ${bookingData.time}</li>
          <li><strong>Service Type:</strong> ${bookingData.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit'}</li>
        </ul>
        <h3>Customer Information</h3>
        <ul>
          <li><strong>Name:</strong> ${bookingData.name}</li>
          <li><strong>Phone:</strong> ${bookingData.phone}</li>
          <li><strong>Address:</strong> ${bookingData.address}, ${bookingData.city}, ${bookingData.pincode}</li>
          ${bookingData.email ? `<li><strong>Email:</strong> ${bookingData.email}</li>` : ''}
        </ul>
        <p>Please process this booking and contact the customer.</p>
      `,
    };

    // Send emails
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ message: 'Booking submitted successfully', booking });
  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({ error: 'Failed to process booking' });
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