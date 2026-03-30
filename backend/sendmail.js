const nodemailer = require("nodemailer");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

// Create transporter once (singleton pattern)
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    console.log('📧 Creating Gmail SMTP transporter...');
    
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Gmail credentials not found in environment variables');
      console.log('Required: EMAIL_USER and EMAIL_PASS in .env file');
      throw new Error('Gmail credentials not configured');
    }
    
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true, // Use connection pooling
      maxConnections: 2, // Reduced from 5
      maxMessages: 50,  // Reduced from 100
      rateDelta: 2000,  // Increased from 1000
      rateLimit: 3,    // Reduced from 5
      // Additional connection settings for better reliability
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,      // 60 seconds
      // Retry settings
      maxRetries: 3,
      retryDelay: 2000 // 2 seconds between retries
    });
    
    console.log('✅ Gmail transporter created successfully');
    console.log(`📧 Using email: ${process.env.EMAIL_USER}`);
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html, attachments }) => {
  let retries = 0;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  while (retries < maxRetries) {
    try {
      const mailTransporter = createTransporter();
      
      console.log(`📧 Sending email to: ${to}`);
      console.log(`📋 Subject: ${subject}`);
      
      const mailOptions = {
        from: `"Farmora Crops" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const info = await mailTransporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📨 Sent to: ${to}`);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      retries++;
      console.error(`❌ Email sending attempt ${retries} failed:`, error.message);
      
      if (retries < maxRetries) {
        console.log(`� Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('❌ All retries exhausted');
        
        // Provide specific error messages (but don't throw)
        if (error.code === 'EAUTH') {
          console.error('❌ Gmail authentication failed - check EMAIL_USER and EMAIL_PASS');
        } else if (error.code === 'ECONNECTION') {
          console.error('❌ Connection failed - check internet connection');
        } else if (error.code === 'EMESSAGE') {
          console.error('❌ Message rejected - check recipient email');
        } else if (error.code === 'ECONNRESET') {
          console.error('❌ Connection reset - Gmail connection issue');
        } else {
          console.error('❌ Unknown email error:', error.message);
        }
        
        return { 
          success: false, 
          error: error.message,
          code: error.code || 'UNKNOWN',
          retries: retries
        };
      }
    }
  }
};

const sendOrderInvoiceEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    const mailTransporter = createTransporter();
    
    console.log(`📧 Sending order invoice email to: ${to}`);
    console.log(`📋 Subject: ${subject}`);
    
    const mailOptions = {
      from: `"Farmora Crops" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('✅ Order invoice email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📨 Sent to: ${to}`);
    
    // Clean up temporary PDF files after sending
    if (attachments && attachments.length > 0) {
      attachments.forEach(attachment => {
        if (attachment.path && fs.existsSync(attachment.path)) {
          try {
            fs.unlinkSync(attachment.path);
            console.log(`🗑️ Cleaned up temporary file: ${attachment.path}`);
          } catch (cleanupError) {
            console.error(`⚠️ Failed to cleanup file ${attachment.path}:`, cleanupError);
          }
        }
      });
    }
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending order invoice email:', error);
    console.error('📧 Email details:', { to, subject });
    
    // Provide specific error messages
    if (error.code === 'EAUTH') {
      console.error('❌ Gmail authentication failed - check EMAIL_USER and EMAIL_PASS');
      throw new Error('Gmail authentication failed. Please check email credentials.');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ Connection failed - check internet connection');
      throw new Error('Failed to connect to email server. Please check internet connection.');
    } else if (error.code === 'EMESSAGE') {
      console.error('❌ Message rejected - check recipient email');
      throw new Error('Email address is invalid or rejected.');
    } else {
      console.error('❌ Unknown email error:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const mailTransporter = createTransporter();
    
    console.log('🔧 Testing email configuration...');
    await mailTransporter.verify();
    
    console.log('✅ Email server is ready to send messages');
    console.log(`📧 Using Gmail account: ${process.env.EMAIL_USER}`);
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
