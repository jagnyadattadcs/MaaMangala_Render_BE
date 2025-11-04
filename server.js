const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_SENDER_NAME = process.env.EMAIL_FROM_NAME || 'Maa Mangala Auto Works';
const EMAIL_SENDER_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const EMAIL_SENDER = `${EMAIL_SENDER_NAME} <${EMAIL_SENDER_EMAIL}>`;
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || 'maamangalaautoworks5@gmail.com';
const CONTACT_NOTIFICATION_EMAIL = process.env.CONTACT_EMAIL || 'maamangalaautoworks5@gmail.com';

// Improved Email Function with better debugging
const sendEmail = async ({ to, subject, html, type = 'general' }) => {
  if (!to) {
    console.log(`[${type}] No recipient email provided`);
    return { success: false, error: 'No recipient email' };
  }

  try {
    console.log(`[${type}] Attempting to send email to: ${to}`);
    console.log(`[${type}] Subject: ${subject}`);
    console.log(`[${type}] From: ${EMAIL_SENDER}`);
    
    const result = await resend.emails.send({
      from: EMAIL_SENDER,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log(`[${type}] Email sent successfully:`, result);
    
    if (result.error) {
      console.error(`[${type}] Email error:`, result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result };

  } catch (error) {
    console.error(`[${type}] Error sending email:`, error);
    if (error && error.statusCode === 403 && error.name === 'validation_error') {
      return {
        success: false,
        error: 'Email sending blocked: verify your domain in Resend and set EMAIL_FROM to the verified address.',
        details: error
      };
    }
    return {
      success: false,
      error: error.message,
      details: error
    };
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
  console.log('MongoDB connected');
  // ... existing seed code ...
})
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const serviceRoutes = require('./routes/services');
const galleryRoutes = require('./routes/gallery');

// Use routes
app.use('/api/services', serviceRoutes);
app.use('/api/gallery', galleryRoutes);

let messages = [];

// Enhanced test endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { to, type = 'test' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Test Email</h2>
        <p>This is a test email from Maa Mangala Auto Works.</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>If you received this email, your email system is working correctly.</p>
        <p>Thank you,<br><strong>Maa Mangala Auto Works Team</strong></p>
      </div>
    `;

    const result = await sendEmail({
      to,
      subject: `Test Email - ${type}`,
      html: testHtml,
      type: 'test'
    });

    res.json({
      message: 'Test email sent',
      success: result.success,
      result: result
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

// Enhanced Booking submission endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    console.log('Received booking data:', bookingData);

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

    console.log('Booking created successfully:', booking._id);

    const servicesDisplay = normalizedServices.length > 0 ? normalizedServices.join(', ') : 'Not specified';
    const serviceTypeLabel = normalizedServiceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
    const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

    // Customer email template
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Booking Confirmation</h1>
          <p style="margin: 5px 0 0 0;">Maa Mangala Auto Works</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear <strong>${booking.name}</strong>,</p>
          <p>Thank you for booking a car service with us. We have received your booking request and will contact you shortly to confirm the appointment.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Booking Reference: #${booking._id.toString().slice(-6).toUpperCase()}</h3>
          </div>

          <h3 style="color: #374151; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">Vehicle Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Brand:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.brand}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Model:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.model}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Year:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.year || 'Not specified'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Registration:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.registrationNumber || 'Not specified'}</td></tr>
          </table>

          <h3 style="color: #374151; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-top: 20px;">Service Details</h3>
          <p><strong>Services Requested:</strong> ${servicesDisplay}</p>
          <p><strong>Service Type:</strong> ${serviceTypeLabel}</p>
          ${booking.description ? `<p><strong>Issue Description:</strong> ${booking.description}</p>` : ''}

          <h3 style="color: #374151; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-top: 20px;">Appointment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.date || 'Not specified'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.time || 'Not specified'}</td></tr>
          </table>

          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #065f46; margin: 0;">Next Steps</h4>
            <p style="margin: 10px 0 0 0;">Our team will contact you within 2 hours to confirm your appointment and discuss any additional details.</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p><strong>Need immediate assistance?</strong></p>
            <p>📞 Call us: +91 98765 43210</p>
            <p>📧 Email: maamangalaautoworks5@gmail.com</p>
          </div>
        </div>
        
        <div style="text-align: center; background: #f8fafc; padding: 15px; border-radius: 0 0 10px 10px; margin-top: 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            &copy; 2024 Maa Mangala Auto Works. All rights reserved.
          </p>
        </div>
      </div>
    `;

    // Admin email template
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">NEW BOOKING ALERT</h1>
          <p style="margin: 5px 0 0 0;">Action Required</p>
        </div>
        
        <div style="padding: 20px;">
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Booking Reference: #${booking._id.toString().slice(-6).toUpperCase()}</h3>
            <p style="margin: 5px 0;"><strong>Received:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.email || 'Not provided'}</td></tr>
            ${addressDisplay ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Address:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${addressDisplay}</td></tr>` : ''}
          </table>

          <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px; margin-top: 20px;">Vehicle & Service Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.brand} ${booking.model}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Services:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${servicesDisplay}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Service Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceTypeLabel}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Preferred Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.date || 'Not specified'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Preferred Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.time || 'Not specified'}</td></tr>
          </table>

          ${booking.description ? `
          <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px; margin-top: 20px;">Customer Notes</h3>
          <p>${booking.description}</p>
          ` : ''}

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0;">⚠️ Immediate Action Required</h4>
            <p style="margin: 10px 0 0 0;">Please contact the customer within 2 hours to confirm this booking.</p>
          </div>
        </div>
      </div>
    `;

    // Send confirmation email to customer
    let customerEmailResult = { success: false };
    if (booking.email) {
      console.log('Sending confirmation email to customer:', booking.email);
      customerEmailResult = await sendEmail({
        to: booking.email,
        subject: `Booking Confirmation #${booking._id.toString().slice(-6).toUpperCase()} - Maa Mangala Auto Works`,
        html: customerEmailHtml,
        type: 'customer_booking'
      });
    } else {
      console.log('No customer email provided, skipping customer confirmation email');
    }

    // Send notification email to admin
    console.log('Sending notification email to admin:', ADMIN_NOTIFICATION_EMAIL);
    const adminEmailResult = await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `🚨 New Booking - ${booking.name} - ${booking.brand} ${booking.model}`,
      html: adminEmailHtml,
      type: 'admin_notification'
    });

    // Response with detailed email status
    res.status(200).json({
      message: 'Booking submitted successfully',
      bookingId: booking._id,
      emailStatus: {
        customer: {
          sent: customerEmailResult.success,
          email: booking.email || 'Not provided',
          error: customerEmailResult.error
        },
        admin: {
          sent: adminEmailResult.success,
          email: ADMIN_NOTIFICATION_EMAIL,
          error: adminEmailResult.error
        }
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

// Enhanced Accept Booking endpoint
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
    booking.updatedAt = new Date();
    await booking.save();

    console.log(`Booking ${booking._id} accepted by admin`);

    let emailResult = { success: false };
    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      const acceptEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; background: #059669; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Booking Accepted ✅</h1>
            <p style="margin: 5px 0 0 0;">Your appointment is confirmed</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear <strong>${booking.name}</strong>,</p>
            <p>Great news! Your booking has been accepted and confirmed by our team.</p>
            
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">Appointment Confirmed</h3>
              <p style="margin: 5px 0;"><strong>Booking Reference:</strong> #${booking._id.toString().slice(-6).toUpperCase()}</p>
            </div>

            <h3 style="color: #374151; border-bottom: 2px solid #059669; padding-bottom: 5px;">Confirmed Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.brand} ${booking.model}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.date || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.time || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Service Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${serviceTypeLabel}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Services:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${servicesDisplay}</td></tr>
            </table>

            ${addressDisplay && booking.serviceType === 'pickup' ? `
            <h3 style="color: #374151; border-bottom: 2px solid #059669; padding-bottom: 5px; margin-top: 20px;">Pickup Address</h3>
            <p>${addressDisplay}</p>
            ` : ''}

            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0;">What to Expect</h4>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Our team will arrive 15 minutes before the scheduled time</li>
                <li>Please keep your vehicle accessible</li>
                <li>Have your vehicle documents ready</li>
                <li>We'll provide a detailed service estimate before starting work</li>
              </ul>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p><strong>Need to make changes?</strong></p>
              <p>📞 Call us: +91 98765 43210</p>
              <p>📧 Email: maamangalaautoworks5@gmail.com</p>
            </div>
          </div>
          
          <div style="text-align: center; background: #f8fafc; padding: 15px; border-radius: 0 0 10px 10px; margin-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              We look forward to serving you!<br>
              &copy; 2024 Maa Mangala Auto Works
            </p>
          </div>
        </div>
      `;

      emailResult = await sendEmail({
        to: booking.email,
        subject: `✅ Booking Accepted - #${booking._id.toString().slice(-6).toUpperCase()} - Maa Mangala Auto Works`,
        html: acceptEmailHtml,
        type: 'booking_accepted'
      });
    }

    res.status(200).json({ 
      message: 'Booking accepted successfully', 
      booking,
      emailSent: emailResult.success,
      emailError: emailResult.error
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ 
      error: 'Failed to accept booking',
      details: error.message 
    });
  }
});

// Enhanced Cancel Booking endpoint
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
    booking.updatedAt = new Date();
    await booking.save();

    console.log(`Booking ${booking._id} cancelled by admin`);

    let emailResult = { success: false };
    if (booking.email) {
      const servicesDisplay = booking.services && booking.services.length > 0 ? booking.services.join(', ') : 'Not specified';
      const serviceTypeLabel = booking.serviceType === 'pickup' ? 'Pickup & Drop' : 'Workshop Visit';
      const addressDisplay = [booking.address, booking.city, booking.pincode].filter(Boolean).join(', ');

      const cancelEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; background: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Booking Update</h1>
            <p style="margin: 5px 0 0 0;">Important Information</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear <strong>${booking.name}</strong>,</p>
            <p>We regret to inform you that your booking has been cancelled due to unavailability of slots for your preferred time.</p>
            
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Booking Cancelled</h3>
              <p style="margin: 5px 0;"><strong>Reference:</strong> #${booking._id.toString().slice(-6).toUpperCase()}</p>
            </div>

            <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.brand} ${booking.model}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Requested Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.date || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Requested Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.time || 'Not specified'}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Services:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${servicesDisplay}</td></tr>
            </table>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0;">Alternative Options</h4>
              <p style="margin: 10px 0 0 0;">We apologize for the inconvenience. Please contact us to reschedule for another available slot.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p><strong>Reschedule Your Appointment</strong></p>
              <p>📞 Call us: +91 98765 43210</p>
              <p>📧 Email: maamangalaautoworks5@gmail.com</p>
              <p>🕒 Available: Monday - Saturday, 8:00 AM - 8:00 PM</p>
            </div>
          </div>
          
          <div style="text-align: center; background: #f8fafc; padding: 15px; border-radius: 0 0 10px 10px; margin-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              We hope to serve you soon!<br>
              &copy; 2024 Maa Mangala Auto Works
            </p>
          </div>
        </div>
      `;

      emailResult = await sendEmail({
        to: booking.email,
        subject: `Booking Update - #${booking._id.toString().slice(-6).toUpperCase()} - Maa Mangala Auto Works`,
        html: cancelEmailHtml,
        type: 'booking_cancelled'
      });
    }

    res.status(200).json({ 
      message: 'Booking cancelled successfully', 
      booking,
      emailSent: emailResult.success,
      emailError: emailResult.error
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      error: 'Failed to cancel booking',
      details: error.message 
    });
  }
});

// ... (rest of the code remains similar with enhanced email templates)

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

// Enhanced Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = req.body;
    console.log('Received contact data:', contactData);

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

    // Customer confirmation email
    const customerContactHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Message Received</h1>
          <p style="margin: 5px 0 0 0;">We'll get back to you soon</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear <strong>${contactData.name}</strong>,</p>
          <p>Thank you for contacting Maa Mangala Auto Works. We have received your message and will respond within 24 hours.</p>
          
          <h3 style="color: #374151; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">Your Message</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.subject}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.message}</td></tr>
          </table>

          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #374151; margin: 0;">Need Immediate Assistance?</h4>
            <p style="margin: 10px 0 0 0;">
              📞 Call us: +91 98765 43210<br>
              🕒 Available: 24/7 for emergency services
            </p>
          </div>
        </div>
      </div>
    `;

    // Admin notification email
    const adminContactHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; background: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">NEW CONTACT MESSAGE</h1>
          <p style="margin: 5px 0 0 0;">Customer Inquiry</p>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px;">Customer Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${contactData.subject}</td></tr>
          </table>

          <h3 style="color: #374151; border-bottom: 2px solid #dc2626; padding-bottom: 5px; margin-top: 20px;">Message</h3>
          <p>${contactData.message}</p>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin: 0;">Action Required</h4>
            <p style="margin: 10px 0 0 0;">Please respond to the customer within 24 hours.</p>
          </div>
        </div>
      </div>
    `;

    // Send confirmation email to customer
    let customerEmailResult = { success: false };
    if (contactData.email) {
      console.log('Sending confirmation email to customer:', contactData.email);
      customerEmailResult = await sendEmail({
        to: contactData.email,
        subject: `Message Received - ${contactData.subject} - Maa Mangala Auto Works`,
        html: customerContactHtml,
        type: 'contact_customer'
      });
    }

    // Send notification email to admin
    console.log('Sending notification email to admin:', CONTACT_NOTIFICATION_EMAIL);
    const adminEmailResult = await sendEmail({
      to: CONTACT_NOTIFICATION_EMAIL,
      subject: `New Contact: ${contactData.subject} - ${contactData.name}`,
      html: adminContactHtml,
      type: 'contact_admin'
    });

    res.status(200).json({ 
      message: 'Contact message submitted successfully', 
      data: message,
      emailStatus: {
        customer: {
          sent: customerEmailResult.success,
          error: customerEmailResult.error
        },
        admin: {
          sent: adminEmailResult.success,
          error: adminEmailResult.error
        }
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
    environment: process.env.NODE_ENV || 'development',
    email: {
      sender: EMAIL_SENDER,
      admin: ADMIN_NOTIFICATION_EMAIL
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Email Sender: ${EMAIL_SENDER}`);
  console.log(`Admin Email: ${ADMIN_NOTIFICATION_EMAIL}`);
  console.log(`Resend API Key: ${process.env.RESEND_API_KEY ? 'Configured' : 'Missing'}`);
});