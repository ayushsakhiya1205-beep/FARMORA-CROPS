const nodemailer = require("nodemailer");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

// Create transporter once (singleton pattern)
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    console.log('📧 Creating Brevo SMTP transporter...');
    
    if (!process.env.EMAIL_USER || !process.env.BREVO_API_KEY) {
      console.error('❌ Brevo credentials not found');
      throw new Error('Brevo credentials not configured');
    }

    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,       // Brevo email
        pass: process.env.BREVO_API_KEY     // Brevo API key
      }
    });

    console.log('✅ Brevo transporter created successfully');
  }
  return transporter;
};
const axios = require("axios");

const sendMail = async ({ to, subject, html }) => {
  try {
    console.log("📧 Sending email to:", to);
    console.log("API KEY:", process.env.BREVO_API_KEY); // debug

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Farmora Crops",
          email: process.env.EMAIL_USER,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent via Brevo");
    return { success: true };

  } catch (error) {
    console.error("❌ Email error:", error.response?.data || error.message);
    return { success: false };
  }
};

module.exports = { sendMail };
// Test email configuration
const testEmailConfig = async () => {
  try {
    const mailTransporter = createTransporter();
    
    console.log('🔧 Testing email configuration...');
    await mailTransporter.verify();
    
    console.log('✅ Email server is ready to send messages');
    console.log(`📧 Using BREVO ACCOUNT account: ${process.env.EMAIL_USER}`);
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    
    if (error.code === 'EAUTH') {
      console.error('❌ Gmail authentication failed');
      console.error('📝 Please check:');
      console.error('   1. EMAIL_USER is correct');
      console.error('   2. EMAIL_PASS is a valid App Password (not regular password)');
      console.error('   3. 2-factor authentication is enabled on Gmail account');
      console.error('   4. "Less secure app access" is enabled OR use App Password');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ Connection failed - check internet connection');
    } else {
      console.error('❌ Unknown error:', error.message);
    }
    
    return false;
  }
};

module.exports = {
  sendMail,
  sendOrderInvoiceEmail,
  testEmailConfig
};
