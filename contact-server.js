const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5002; // Different port to avoid conflict with booking backend

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for contact messages (replace with a database in production)
let messages = [];

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});


// Start server
app.listen(port, () => {
  console.log(`Contact server running on port ${port}`);
});
