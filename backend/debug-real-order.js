require('dotenv').config();
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const { sendOrderInvoiceEmail } = require('./config/email');
const fs = require('fs');

// This simulates EXACTLY what happens in routes/orders.js when a user places an order
async function debugRealOrderFlow() {
  try {
    console.log('🔍 DEBUGGING REAL ORDER FLOW');
    console.log('==============================');
    
    // Simulate the exact data structure from your database when a user places order
    const order = {
      _id: 'DEBUG123456',
      createdAt: new Date(),
      orderStatus: 'confirmed',
      items: [
        { 
          productId: '507f1f77bcf86cd7994391131', 
          name: 'Premium Organic Basmati Rice', 
          quantity: 2, 
          unit: 'kg', 
          price: 220 
        },
        { 
          productId: '507f1f77bcf86cd7994391132', 
          name: 'Fresh Wheat Grains', 
          quantity: 5, 
          unit: 'kg', 
          price: 95 
        }
      ],
      totalAmount: 915,
      finalAmount: 915,
      paymentMethod: 'cod',
      deliveryAddress: {
        address: '123 Debug Street, Near Market',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        phone: '+91-9876543210'
      },
      customerId: '507f1f77bcf86cd7994391011',
      outletId: '507f1f77bcf86cd7994391012'
    };
    
    // Simulate req.user object from authentication
    const reqUser = {
      _id: '507f1f77bcf86cd7994391011',
      name: 'Debug Customer',
      email: 'ayushsakhiya1205@gmail.com',
      phone: '+91-9876543210'
    };
    
    console.log('📦 DEBUG: Simulating order placement...');
    console.log(`👤 Customer: ${reqUser.name}`);
    console.log(`📧 Email: ${reqUser.email}`);
    console.log(`📦 Order ID: ${order._id}`);
    console.log(`💰 Total Amount: ₹${order.finalAmount}`);
    console.log(`📦 Items: ${order.items.length} products`);
    console.log(`📍 Delivery: ${order.deliveryAddress.district}, ${order.deliveryAddress.state}`);
    console.log('');
    
    // STEP 1: This is EXACTLY what happens in routes/orders.js line 203
    console.log('🌐 STEP 1: generateOrderInvoiceWithPuppeteer(order, req.user.name, req.user.email)');
    console.log('🔍 DEBUG: Calling generateOrderInvoiceWithPuppeteer...');
    
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(order, reqUser.name, reqUser.email);
    
    console.log('🔍 DEBUG: generateOrderInvoiceWithPuppeteer returned:');
    console.log(JSON.stringify(invoiceResult, null, 2));
    
    if (!invoiceResult.success) {
      console.error('❌ DEBUG: PDF generation failed!');
      return;
    }
    
    console.log(`✅ DEBUG: PDF generated: ${invoiceResult.filename}`);
    console.log(`📊 DEBUG: File size: ${invoiceResult.size} bytes`);
    console.log(`📁 DEBUG: File path: ${invoiceResult.filepath}`);
    console.log('');
    
    // STEP 2: This is EXACTLY what happens in routes/orders.js line 221
    console.log('📄 STEP 2: fs.readFileSync(invoiceResult.filepath)');
    console.log('🔍 DEBUG: Reading PDF file...');
    
    let pdfBuffer;
    try {
      pdfBuffer = fs.readFileSync(invoiceResult.filepath);
      console.log(`✅ DEBUG: PDF buffer read successfully: ${pdfBuffer.length} bytes`);
    } catch (error) {
      console.error('❌ DEBUG: Failed to read PDF file:', error);
      return;
    }
    
    // Verify PDF signature
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const isPDF = pdfBuffer.slice(0, 4).equals(pdfSignature);
    console.log(`🔍 DEBUG: PDF signature check: ${isPDF ? 'VALID' : 'INVALID'}`);
    
    if (!isPDF) {
      console.error('❌ DEBUG: Generated file is not a valid PDF!');
      return;
    }
    
    console.log('');
    
    // STEP 3: This is EXACTLY what happens in routes/orders.js line 299
    console.log('📧 STEP 3: sendOrderInvoiceEmail(req.user.email, order, req.user.name)');
    console.log('🔍 DEBUG: Calling sendOrderInvoiceEmail...');
    
    const emailResult = await sendOrderInvoiceEmail(reqUser.email, order, reqUser.name);
    
    console.log('🔍 DEBUG: sendOrderInvoiceEmail returned:');
    console.log(JSON.stringify(emailResult, null, 2));
    
    if (!emailResult.success) {
      console.error('❌ DEBUG: Email sending failed!');
      console.error('🔍 DEBUG: Email error:', emailResult.error);
      return;
    }
    
    console.log('✅ DEBUG: Email sent successfully!');
    console.log(`📧 DEBUG: Message ID: ${emailResult.messageId}`);
    console.log(`📨 DEBUG: Sent to: ${reqUser.email}`);
    console.log('');
    
    // STEP 4: This is EXACTLY what happens in routes/orders.js line 310
    console.log('🗑️ STEP 4: fs.unlinkSync(invoiceResult.filepath)');
    console.log('🔍 DEBUG: Cleaning up temporary file...');
    
    try {
      fs.unlinkSync(invoiceResult.filepath);
      console.log('✅ DEBUG: Temporary file cleaned up');
    } catch (error) {
      console.error('❌ DEBUG: Failed to clean up file:', error);
    }
    
    console.log('');
    console.log('🎉 DEBUG: Real order flow completed successfully!');
    console.log('==================================================');
    console.log('✅ PDF Generation: WORKING');
    console.log('✅ File Reading: WORKING');
    console.log('✅ Email Sending: WORKING');
    console.log('✅ File Cleanup: WORKING');
    console.log('');
    console.log('📧 EMAIL DETAILS:');
    console.log(`• Recipient: ${reqUser.email}`);
    console.log(`• Subject: Order Invoice #${order._id} - Farmora Crops`);
    console.log(`• Message ID: ${emailResult.messageId}`);
    console.log(`• PDF Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    console.log('');
    console.log('🔍 If you still don\'t receive this email:');
    console.log('1. Check Gmail spam/promotions folder');
    console.log('2. Check if email address is correct');
    console.log('3. Check if Gmail is blocking the emails');
    console.log('4. Check server logs when placing real orders');
    console.log('5. Check if frontend is calling the correct endpoint');
    console.log('');
    console.log('🚀 The debugging shows the system is working correctly!');
    console.log('The issue might be in the frontend-backend communication.');
    
  } catch (error) {
    console.error('❌ DEBUG: Real order flow failed:', error);
    console.error('🔍 DEBUG: Full error details:', error);
    console.error('🔍 DEBUG: Stack trace:', error.stack);
  }
}

debugRealOrderFlow();
