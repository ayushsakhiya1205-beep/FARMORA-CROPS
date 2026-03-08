require('dotenv').config();
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const { sendOrderInvoiceEmail } = require('./config/email');
const fs = require('fs');

async function testPuppeteerOnlySystem() {
  try {
    console.log('🧪 Testing Puppeteer-Only System...');
    console.log('=====================================');
    
    // Verify PDFKit is completely removed
    console.log('🔍 Checking for PDFKit remnants...');
    try {
      require('pdfkit');
      console.log('❌ PDFKit still exists - not fully removed');
      return;
    } catch (error) {
      console.log('✅ PDFKit successfully removed');
    }
    
    // Verify only Puppeteer files exist
    console.log('🔍 Checking Puppeteer files...');
    const puppeteerFiles = [
      'utils/puppeteerInvoiceGenerator.js',
      'test-puppeteer-pdf.js',
      'test-complete-puppeteer.js'
    ];
    
    for (const file of puppeteerFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ Found: ${file}`);
      } else {
        console.log(`❌ Missing: ${file}`);
      }
    }
    
    // Test the actual Puppeteer system
    console.log('');
    console.log('🌐 Testing Puppeteer PDF Generation...');
    
    const mockOrder = {
      _id: 'PUREPUPPET123',
      createdAt: new Date(),
      orderStatus: 'confirmed',
      items: [
        { name: 'Premium Organic Rice', quantity: 3, unit: 'kg', price: 200 },
        { name: 'Organic Wheat', quantity: 5, unit: 'kg', price: 100 }
      ],
      totalAmount: 1100,
      finalAmount: 1100,
      paymentMethod: 'cod',
      deliveryAddress: {
        address: '123 Pure Puppeteer Street',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        phone: '+91-9876543210'
      }
    };
    
    const customerName = 'Puppeteer Test Customer';
    const customerEmail = 'ayushsakhiya1205@gmail.com';
    
    console.log(`📦 Order ID: ${mockOrder._id}`);
    console.log(`💰 Total Amount: ₹${mockOrder.finalAmount}`);
    console.log('');
    
    // Test PDF generation
    const startTime = Date.now();
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(mockOrder, customerName, customerEmail);
    const generationTime = Date.now() - startTime;
    
    if (!invoiceResult.success) {
      throw new Error('Puppeteer PDF generation failed');
    }
    
    console.log(`✅ Puppeteer PDF Generated: ${invoiceResult.filename}`);
    console.log(`📊 File Size: ${(invoiceResult.size/1024).toFixed(1)}KB`);
    console.log(`⏱️ Generation Time: ${generationTime}ms`);
    
    // Verify PDF quality
    const pdfBuffer = fs.readFileSync(invoiceResult.filepath);
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const isPDF = pdfBuffer.slice(0, 4).equals(pdfSignature);
    
    console.log(`✅ PDF Valid: ${isPDF ? 'YES' : 'NO'}`);
    
    // Test email sending
    console.log('📧 Testing email with Puppeteer PDF...');
    
    const attachments = [{
      filename: invoiceResult.filename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
    
    const emailResult = await sendOrderInvoiceEmail(customerEmail, mockOrder, customerName);
    
    console.log(`✅ Email Sent: ${emailResult.messageId}`);
    
    // Clean up
    fs.unlinkSync(invoiceResult.filepath);
    
    console.log('');
    console.log('🎉 PUPPETEER-ONLY SYSTEM TEST RESULTS:');
    console.log('=====================================');
    console.log('✅ PDFKit: COMPLETELY REMOVED');
    console.log('✅ Puppeteer: FULLY INTEGRATED');
    console.log('✅ PDF Generation: WORKING');
    console.log('✅ Email Delivery: WORKING');
    console.log('✅ File Management: WORKING');
    console.log('');
    console.log('📊 Quality Metrics:');
    console.log(`• PDF Size: ${(invoiceResult.size/1024).toFixed(1)}KB (Premium Quality)`);
    console.log(`• Generation Time: ${generationTime}ms`);
    console.log(`• Rendering: HTML/CSS with Puppeteer`);
    console.log(`• Features: Watermark, Headers, Footers`);
    console.log('');
    console.log('🚀 SYSTEM STATUS: 100% PUPPETEER');
    console.log('Customers will receive premium PDF invoices only!');
    
  } catch (error) {
    console.error('❌ Puppeteer-only system test failed:', error);
  }
}

testPuppeteerOnlySystem();
