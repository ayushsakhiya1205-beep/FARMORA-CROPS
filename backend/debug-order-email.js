require('dotenv').config();
const express = require('express');
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const { sendOrderInvoiceEmail } = require('./config/email');
const fs = require('fs');

// Create a simple test server to debug the order email issue
const app = express();
app.use(express.json());

// Add CORS to allow frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug endpoint to test order email
app.post('/debug-order-email', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Received order email request');
    console.log('📊 Request body:', JSON.stringify(req.body, null, 2));
    
    const { order, user } = req.body;
    
    if (!order || !user) {
      console.error('❌ Missing order or user data');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing order or user data' 
      });
    }
    
    console.log('📦 Order Details:');
    console.log(`• Order ID: ${order._id}`);
    console.log(`• Customer: ${user.name}`);
    console.log(`• Email: ${user.email}`);
    console.log(`• Total Amount: ₹${order.finalAmount}`);
    console.log(`• Items: ${order.items?.length || 0} products`);
    
    // Step 1: Generate PDF invoice
    console.log('🌐 Step 1: Generating Puppeteer PDF invoice...');
    const startTime = Date.now();
    
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(order, user.name, user.email);
    
    if (!invoiceResult.success) {
      console.error('❌ Failed to generate PDF invoice');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate PDF invoice' 
      });
    }
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ PDF Generated: ${invoiceResult.filename}`);
    console.log(`📊 File Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    console.log(`⏱️ Generation Time: ${generationTime}ms`);
    
    // Step 2: Send email
    console.log('📧 Step 2: Sending email with PDF attachment...');
    
    const emailResult = await sendOrderInvoiceEmail(user.email, order, user.name);
    
    if (!emailResult.success) {
      console.error('❌ Failed to send email:', emailResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send email',
        error: emailResult.error 
      });
    }
    
    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${emailResult.messageId}`);
    console.log(`📨 Sent to: ${user.email}`);
    
    // Clean up
    fs.unlinkSync(invoiceResult.filepath);
    console.log('🗑️ Temporary PDF file cleaned up');
    
    res.json({
      success: true,
      message: 'Order invoice email sent successfully',
      orderId: order._id,
      email: user.email,
      messageId: emailResult.messageId,
      pdfSize: invoiceResult.size,
      generationTime: generationTime
    });
    
  } catch (error) {
    console.error('❌ Debug order email error:', error);
    console.error('🔍 Full error:', error);
    console.error('📊 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint to verify server is working
app.get('/debug-test', (req, res) => {
  res.json({
    success: true,
    message: 'Debug server is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`🔍 Debug server running on port ${PORT}`);
  console.log(`📧 Test endpoint: http://localhost:${PORT}/debug-test`);
  console.log(`📦 Order email endpoint: http://localhost:${PORT}/debug-order-email`);
  console.log('');
  console.log('🔧 To test order email:');
  console.log('curl -X POST http://localhost:8001/debug-order-email \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"order":{"_id":"TEST123","finalAmount":1000,"items":[{"name":"Test Product","quantity":1,"price":1000}],"deliveryAddress":{"address":"Test Address","district":"Rajkot","state":"Gujarat","pincode":"360001","phone":"+91-9876543210"}},"user":{"name":"Test User","email":"ayushsakhiya1205@gmail.com"}}\'');
});
