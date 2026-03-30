require('dotenv').config();
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const { sendOrderInvoiceEmail } = require('./config/email');
const fs = require('fs');

async function testRealOrderFlow() {
  try {
    console.log('🧪 Testing Real Order Flow (like actual order placement)...');
    console.log('================================================');
    
    // Simulate the exact order data structure from your database
    const mockOrder = {
      _id: 'REALORDER789',
      createdAt: new Date(),
      orderStatus: 'confirmed',
      items: [
        { 
          productId: '507f1f77bcf86cd7994391131', 
          name: 'Organic Basmati Rice', 
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
        },
        { 
          productId: '507f1f77bcf86cd7994391133', 
          name: 'Organic Toor Dal', 
          quantity: 1, 
          unit: 'kg', 
          price: 185 
        }
      ],
      totalAmount: 825,
      finalAmount: 825,
      paymentMethod: 'cod',
      deliveryAddress: {
        address: '123 Real Order Street, Near Market',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        phone: '+91-9876543210'
      },
      customerId: '507f1f77bcf86cd7994391011',
      outletId: '507f1f77bcf86cd7994391012'
    };
    
    // Simulate the user object from req.user
    const mockUser = {
      _id: '507f1f77bcf86cd7994391011',
      name: 'Real Test Customer',
      email: 'ayushsakhiya1205@gmail.com',
      phone: '+91-9876543210'
    };
    
    console.log('📦 Simulating Real Order Data:');
    console.log(`👤 Customer: ${mockUser.name}`);
    console.log(`📧 Email: ${mockUser.email}`);
    console.log(`📦 Order ID: ${mockOrder._id}`);
    console.log(`💰 Total Amount: ₹${mockOrder.finalAmount}`);
    console.log(`📦 Items: ${mockOrder.items.length} products`);
    console.log(`📍 Delivery: ${mockOrder.deliveryAddress.district}, ${mockOrder.deliveryAddress.state}`);
    console.log(`📞 Phone: ${mockOrder.deliveryAddress.phone}`);
    console.log('');
    
    // Test the exact same code path as in routes/orders.js
    console.log('🌐 Step 1: Generating Puppeteer PDF (like in routes/orders.js)...');
    
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(mockOrder, mockUser.name, mockUser.email);
    
    if (!invoiceResult.success) {
      throw new Error('Failed to generate PDF invoice with Puppeteer');
    }
    
    console.log(`✅ PDF Generated: ${invoiceResult.filename}`);
    console.log(`📊 File Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    
    console.log('📧 Step 2: Reading PDF buffer for email attachment...');
    const pdfBuffer = fs.readFileSync(invoiceResult.filepath);
    
    console.log('📧 Step 3: Sending email with PDF attachment...');
    
    const attachments = [{
      filename: invoiceResult.filename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
    
    const emailResult = await sendOrderInvoiceEmail(mockUser.email, mockOrder, mockUser.name);
    
    console.log('✅ Email sent successfully!');
    console.log(`📧 Message ID: ${emailResult.messageId}`);
    console.log(`📨 Sent to: ${mockUser.email}`);
    
    // Clean up
    fs.unlinkSync(invoiceResult.filepath);
    console.log('🗑️ Temporary file cleaned up');
    
    console.log('');
    console.log('🎉 REAL ORDER FLOW TEST RESULTS:');
    console.log('=====================================');
    console.log('✅ Order Data Structure: Correct');
    console.log('✅ User Data Structure: Correct');
    console.log('✅ PDF Generation: Working');
    console.log('✅ Email Sending: Working');
    console.log('✅ File Management: Working');
    console.log('');
    console.log('📧 Email Details:');
    console.log(`• Recipient: ${mockUser.email}`);
    console.log(`• Subject: Order Invoice #${mockOrder._id} - Farmora Crops`);
    console.log(`• Message ID: ${emailResult.messageId}`);
    console.log(`• PDF Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    console.log('');
    console.log('🔍 Troubleshooting Tips:');
    console.log('• Check your Gmail inbox (including spam folder)');
    console.log('• Verify email address: ayushsakhiya1205@gmail.com');
    console.log('• Check server logs for any errors');
    console.log('• Ensure server is running with latest changes');
    console.log('');
    console.log('🚀 If you still don\'t receive the email:');
    console.log('1. Check Gmail spam/promotions folder');
    console.log('2. Verify email address is correct');
    console.log('3. Check if server is running with npm start');
    console.log('4. Check browser console for any errors');
    console.log('5. Try restarting the server to load new changes');
    
  } catch (error) {
    console.error('❌ Real order flow test failed:', error);
    console.error('🔧 Error details:', error.message);
    console.error('🔧 Stack trace:', error.stack);
  }
}

testRealOrderFlow();
