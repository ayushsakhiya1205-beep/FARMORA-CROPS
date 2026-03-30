require('dotenv').config();
const express = require('express');
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const { sendOrderInvoiceEmail } = require('./config/email');
const fs = require('fs');

// Create a monitoring server to log all order email attempts
const app = express();
app.use(express.json());

// Store all email attempts for debugging
const emailAttempts = [];

// Log all order email attempts
app.post('/log-order-email', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const attempt = {
      timestamp,
      orderId: req.body.orderId || 'UNKNOWN',
      userEmail: req.body.userEmail || 'UNKNOWN',
      userName: req.body.userName || 'UNKNOWN',
      status: 'STARTED',
      details: req.body
    };
    
    emailAttempts.push(attempt);
    console.log('🔍 MONITOR: Order email attempt started');
    console.log(`📧 Order ID: ${attempt.orderId}`);
    console.log(`👤 User: ${attempt.userName} (${attempt.userEmail})`);
    console.log(`🕐 Time: ${timestamp}`);
    
    // Simulate the exact process
    if (req.body.order && req.body.user) {
      console.log('🌐 MONITOR: Starting PDF generation...');
      
      const invoiceResult = await generateOrderInvoiceWithPuppeteer(req.body.order, req.body.user.name, req.body.user.email);
      
      if (!invoiceResult.success) {
        attempt.status = 'PDF_FAILED';
        attempt.error = 'PDF generation failed';
        return res.json({ success: false, error: 'PDF generation failed' });
      }
      
      console.log('📧 MONITOR: Starting email sending...');
      
      const emailResult = await sendOrderInvoiceEmail(req.body.user.email, req.body.order, req.body.user.name);
      
      if (!emailResult.success) {
        attempt.status = 'EMAIL_FAILED';
        attempt.error = emailResult.error;
        return res.json({ success: false, error: emailResult.error });
      }
      
      attempt.status = 'SUCCESS';
      attempt.messageId = emailResult.messageId;
      attempt.pdfSize = invoiceResult.size;
      
      console.log('✅ MONITOR: Email sent successfully!');
      console.log(`📧 Message ID: ${emailResult.messageId}`);
      
      // Clean up
      fs.unlinkSync(invoiceResult.filepath);
      
      return res.json({ 
        success: true, 
        messageId: emailResult.messageId,
        pdfSize: invoiceResult.size
      });
    }
    
    res.json({ success: true, message: 'Logged' });
    
  } catch (error) {
    console.error('❌ MONITOR: Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all email attempts
app.get('/email-attempts', (req, res) => {
  res.json({
    totalAttempts: emailAttempts.length,
    attempts: emailAttempts
  });
});

// Clear email attempts
app.delete('/email-attempts', (req, res) => {
  emailAttempts.length = 0;
  res.json({ success: true, message: 'Email attempts cleared' });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Email monitoring server is running',
    timestamp: new Date().toISOString(),
    totalAttempts: emailAttempts.length
  });
});

const PORT = 8002;
app.listen(PORT, () => {
  console.log('🔍 EMAIL MONITORING SERVER STARTED');
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 View attempts: http://localhost:${PORT}/email-attempts`);
  console.log(`📝 Log endpoint: POST http://localhost:${PORT}/log-order-email`);
  console.log('');
  console.log('🔧 To monitor real order emails:');
  console.log('1. Add this to your order route:');
  console.log('   fetch("http://localhost:8002/log-order-email", {');
  console.log('     method: "POST",');
  console.log('     headers: { "Content-Type": "application/json" },');
  console.log('     body: JSON.stringify({');
  console.log('       orderId: order._id,');
  console.log('       userEmail: req.user.email,');
  console.log('       userName: req.user.name,');
  console.log('       order: order,');
  console.log('       user: req.user');
  console.log('     })');
  console.log('   });');
  console.log('');
  console.log('2. Then check: http://localhost:8002/email-attempts');
  console.log('');
  console.log('🚀 This will help identify if the order route is being called!');
});
