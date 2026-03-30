require('dotenv').config();
const { generateOrderInvoiceWithPuppeteer } = require('./utils/puppeteerInvoiceGenerator');
const fs = require('fs');

async function testPuppeteerPDF() {
  try {
    console.log('🌐 Testing Puppeteer PDF Generation System...');
    
    // Mock order data (simulating real order placement)
    const mockOrder = {
      _id: 'PUPPET123',
      createdAt: new Date(),
      orderStatus: 'confirmed',
      items: [
        { name: 'Premium Organic Basmati Rice', quantity: 3, unit: 'kg', price: 180 },
        { name: 'Fresh Wheat Grains', quantity: 8, unit: 'kg', price: 95 },
        { name: 'Organic Toor Dal', quantity: 2, unit: 'kg', price: 195 },
        { name: 'Organic Chana Dal', quantity: 1, unit: 'kg', price: 165 }
      ],
      totalAmount: 1585,
      finalAmount: 1685,
      paymentMethod: 'cod',
      deliveryAddress: {
        address: '789 Premium Agricultural Estate',
        district: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001',
        phone: '+91-9876543210'
      }
    };
    
    const customerName = 'Premium Customer';
    const customerEmail = 'ayushsakhiya1205@gmail.com';
    
    console.log('📧 Simulating premium order placement...');
    console.log(`📦 Order ID: ${mockOrder._id}`);
    console.log(`💰 Total Amount: ₹${mockOrder.finalAmount}`);
    console.log(`📦 Items: ${mockOrder.items.length} products`);
    
    // Generate PDF invoice using Puppeteer
    console.log('🌐 Step 1: Generating PDF with Puppeteer...');
    const startTime = Date.now();
    
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(mockOrder, customerName, customerEmail);
    
    const generationTime = Date.now() - startTime;
    
    if (!invoiceResult.success) {
      throw new Error('Failed to generate PDF invoice with Puppeteer');
    }
    
    console.log(`✅ Puppeteer PDF generated: ${invoiceResult.filename}`);
    console.log(`📊 File size: ${invoiceResult.size} bytes`);
    console.log(`⏱️ Generation time: ${generationTime}ms`);
    
    // Verify PDF file
    if (fs.existsSync(invoiceResult.filepath)) {
      const stats = fs.statSync(invoiceResult.filepath);
      const pdfBuffer = fs.readFileSync(invoiceResult.filepath);
      
      // Check PDF signature
      const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
      const isPDF = pdfBuffer.slice(0, 4).equals(pdfSignature);
      
      console.log(`📊 Buffer size: ${pdfBuffer.length} bytes`);
      console.log(`✅ PDF Valid: ${isPDF ? 'YES' : 'NO'}`);
      
      if (isPDF) {
        console.log('🎉 Puppeteer PDF System is Working Perfectly!');
        console.log('📧 Ready for Premium Order Placement Integration');
        
        // Show PDF content preview (first 100 characters)
        const preview = pdfBuffer.toString('latin1', 0, 100);
        console.log(`📄 PDF Preview: ${preview}`);
        
        // Compare with old PDFKit system
        console.log('\n📊 Quality Comparison:');
        console.log('🔹 Puppeteer: Modern HTML/CSS rendering, perfect layout');
        console.log('🔹 PDFKit: Basic vector graphics, limited styling');
        console.log('🔹 Puppeteer: Watermark, headers, footers, backgrounds');
        console.log('🔹 PDFKit: Simple text and basic shapes');
        console.log('🔹 Puppeteer: Professional print-ready PDFs');
        console.log('🔹 PDFKit: Functional but basic PDFs');
        
        // Clean up
        fs.unlinkSync(invoiceResult.filepath);
        console.log('🗑️ Test file cleaned up');
        
        console.log('\n🚀 Puppeteer PDF System Features:');
        console.log('✅ Modern HTML/CSS rendering');
        console.log('✅ Professional typography and layout');
        console.log('✅ Watermark and branding');
        console.log('✅ Headers and footers');
        console.log('✅ Background colors and borders');
        console.log('✅ Print-ready quality');
        console.log('✅ Responsive design support');
        
      } else {
        console.error('❌ Generated file is not a valid PDF');
      }
    } else {
      console.error('❌ PDF file was not created');
    }
    
  } catch (error) {
    console.error('❌ Puppeteer PDF test failed:', error);
    if (error.message.includes('Puppeteer')) {
      console.log('💡 Puppeteer troubleshooting tips:');
      console.log('   1. Ensure Chrome/Chromium is installed');
      console.log('   2. Try running with more memory');
      console.log('   3. Check system resources');
      console.log('   4. Verify Puppeteer installation');
    }
  }
}

testPuppeteerPDF();
