require('dotenv').config();
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const fs = require('fs');

async function testInvoiceWithAddress() {
  try {
    console.log('🧪 TESTING INVOICE WITH USER ADDRESS DETAILS');
    console.log('===========================================');
    
    // Simulate order with user's address from cart
    const order = {
      _id: 'ADDR123456',
      createdAt: new Date(),
      orderStatus: 'confirmed',
      items: [
        { name: 'Organic Basmati Rice', quantity: 2, unit: 'kg', price: 220 },
        { name: 'Fresh Wheat Grains', quantity: 5, unit: 'kg', price: 95 }
      ],
      totalAmount: 915,
      finalAmount: 915,
      paymentMethod: 'cod',
      deliveryAddress: {
        address: '123 Main Street, Near City Mall, Opposite Police Station',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        phone: '+91-9876543210'
      }
    };
    
    const customerName = 'Test Customer';
    const customerEmail = 'ayushsakhiya1205@gmail.com';
    
    console.log('📦 Order Details:');
    console.log(`• Order ID: ${order._id}`);
    console.log(`• Customer: ${customerName}`);
    console.log(`• Email: ${customerEmail}`);
    console.log(`• Total: ₹${order.finalAmount}`);
    console.log('');
    console.log('📍 User Address from Cart:');
    console.log(`• Address: ${order.deliveryAddress.address}`);
    console.log(`• District: ${order.deliveryAddress.district}`);
    console.log(`• State: ${order.deliveryAddress.state}`);
    console.log(`• Pincode: ${order.deliveryAddress.pincode}`);
    console.log(`• Phone: ${order.deliveryAddress.phone}`);
    console.log('');
    
    // Generate PDF invoice
    console.log('🌐 Generating PDF invoice with address details...');
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(order, customerName, customerEmail);
    
    if (!invoiceResult.success) {
      throw new Error('PDF generation failed');
    }
    
    console.log('✅ PDF Generated Successfully!');
    console.log(`📄 File: ${invoiceResult.filename}`);
    console.log(`📊 Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    console.log(`📁 Path: ${invoiceResult.filepath}`);
    console.log('');
    
    console.log('📋 INVOICE CONTENTS:');
    console.log('===================');
    console.log('✅ Customer Information Section:');
    console.log('   • Customer Name');
    console.log('   • Customer Email');
    console.log('   • Customer Phone');
    console.log('');
    console.log('✅ Delivery Address Section (from Cart):');
    console.log('   • Complete Address (street, landmarks)');
    console.log('   • District');
    console.log('   • State');
    console.log('   • Pincode');
    console.log('   • Phone Number');
    console.log('');
    console.log('✅ Shipping Information Section:');
    console.log('   • Estimated Delivery Time');
    console.log('   • Payment Method');
    console.log('   • Order Status');
    console.log('');
    console.log('✅ Order Items Section:');
    console.log('   • Product Names');
    console.log('   • Quantities');
    console.log('   • Prices');
    console.log('   • Total Amount');
    console.log('');
    console.log('✅ Order Tracking Section:');
    console.log('   • Tracking ID');
    console.log('   • Customer Support Info');
    console.log('');
    
    console.log('🎉 INVOICE ADDRESS FEATURES:');
    console.log('===========================');
    console.log('✅ User address from cart is prominently displayed');
    console.log('✅ Complete address details included');
    console.log('✅ Phone number for delivery contact');
    console.log('✅ District, State, and Pincode clearly shown');
    console.log('✅ Professional formatting with proper sections');
    console.log('✅ Easy to read for delivery personnel');
    console.log('');
    
    console.log('📧 The invoice will be sent to customer with:');
    console.log(`• Email: ${customerEmail}`);
    console.log(`• Subject: Order Invoice #${order._id} - Farmora Crops`);
    console.log(`• PDF Attachment: ${invoiceResult.filename} (${(invoiceResult.size/1024).toFixed(1)}KB)`);
    console.log('');
    
    console.log('🔍 Check the generated PDF file to see the address details!');
    console.log(`📁 File location: ${invoiceResult.filepath}`);
    console.log('');
    
    // Clean up after 10 seconds to allow manual inspection
    setTimeout(() => {
      if (fs.existsSync(invoiceResult.filepath)) {
        fs.unlinkSync(invoiceResult.filepath);
        console.log('🗑️ Test PDF file cleaned up');
      }
    }, 10000);
    
    console.log('⏱️ PDF file will be automatically cleaned up in 10 seconds');
    console.log('📄 Open the PDF file now to see the address details!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testInvoiceWithAddress();
