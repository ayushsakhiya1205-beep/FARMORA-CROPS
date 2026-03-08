const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create invoices directory if it doesn't exist
const invoicesDir = path.join(__dirname, '../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

const generateOrderInvoiceWithPuppeteer = async (orderDetails, customerName, customerEmail) => {
  let browser = null;
  
  try {
    console.log('🌐 Launching Puppeteer for PDF generation...');
    
    // Launch Puppeteer
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    let executablePath = null;
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        executablePath = chromePath;
        break;
      }
    }
    
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };
    
    if (executablePath) {
      launchOptions.executablePath = executablePath;
      console.log('🌐 Using system Chrome:', executablePath);
    } else {
      console.log('🌐 Using bundled Chrome (may need installation)');
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    
    // Generate unique filename
    const filename = `invoice_${orderDetails._id}_${Date.now()}.pdf`;
    const filepath = path.resolve(invoicesDir, filename); // Use absolute path
    
    // Calculate estimated delivery days
    const estimatedDeliveryDays = Math.max(3, Math.ceil(orderDetails.items.length * 2));
    
    // Create HTML template for invoice
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice - Farmora Crops</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
            font-size: 12px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #114714;
          }
          
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #114714;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 10px;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .invoice-info {
            flex: 1;
          }
          
          .invoice-info h3 {
            margin: 0 0 15px 0;
            color: #114714;
            font-size: 16px;
            border-bottom: 2px solid #114714;
            padding-bottom: 5px;
          }
          
          .invoice-info p {
            margin: 8px 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .invoice-info strong {
            color: #114714;
            font-weight: 600;
          }
          
          .order-items {
            margin: 30px 0;
          }
          
          .order-items h3 {
            color: #114714;
            margin-bottom: 20px;
            font-size: 18px;
            border-bottom: 2px solid #114714;
            padding-bottom: 8px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          
          .items-table th {
            background: #114714;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            border: 1px solid #114714;
          }
          
          .items-table td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          
          .items-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .total-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 14px;
            align-items: center;
          }
          
          .total-row.grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #114714;
            border-top: 2px solid #114714;
            padding-top: 15px;
            margin-top: 20px;
          }
          
          .delivery-info {
            margin: 30px 0;
            padding: 20px;
            background: #e8f5e8;
            border-radius: 8px;
            border-left: 4px solid #114714;
            border: 1px solid #c3e6cb;
          }
          
          .delivery-info h3 {
            color: #114714;
            margin-bottom: 15px;
            font-size: 16px;
          }
          
          .delivery-info p {
            margin: 8px 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .tracking-info {
            margin: 20px 0;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            border: 1px solid #ffeaa7;
          }
          
          .tracking-info h3 {
            color: #856404;
            margin-bottom: 10px;
            font-size: 14px;
          }
          
          .tracking-info p {
            margin: 5px 0;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .tracking-id {
            background: #f8f9fa;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
            border: 1px solid #dee2e6;
            display: inline-block;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            background: #ffc107;
            color: #000;
            border: 1px solid #e0a800;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(17, 71, 20, 0.05);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
          
          @media print {
            body { margin: 0; }
            .container { box-shadow: none; border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">FARMORA CROPS</div>
        <div class="container">
          <div class="header">
            <div class="logo">
              🌾 Farmora Crops
            </div>
            <div class="invoice-title">Order Invoice</div>
          </div>
          
          <div class="invoice-header">
            <div class="invoice-info">
              <h3>Invoice Details</h3>
              <p><strong>Invoice #:</strong> ${orderDetails._id}</p>
              <p><strong>Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${orderDetails.orderStatus}</span></p>
            </div>
            <div class="invoice-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Phone:</strong> ${orderDetails.deliveryAddress?.phone || 'N/A'}</p>
            </div>
            <div class="invoice-info">
              <h3>📍 Delivery Address (from Cart)</h3>
              <p><strong>Address:</strong> ${orderDetails.deliveryAddress?.address || 'N/A'}</p>
              <p><strong>District:</strong> ${orderDetails.deliveryAddress?.district || 'N/A'}</p>
              <p><strong>State:</strong> ${orderDetails.deliveryAddress?.state || 'N/A'}</p>
              <p><strong>Pincode:</strong> ${orderDetails.deliveryAddress?.pincode || 'N/A'}</p>
              <p><strong>Phone:</strong> ${orderDetails.deliveryAddress?.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div class="order-items">
            <h3>Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40%">Product Name</th>
                  <th style="width: 15%">Quantity</th>
                  <th style="width: 15%">Unit Price</th>
                  <th style="width: 15%">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderDetails.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity} ${item.unit}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${(orderDetails.totalAmount || orderDetails.finalAmount || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Delivery Charges:</span>
                <span>FREE</span>
              </div>
              <div class="total-row grand-total">
                <span>Total Amount:</span>
                <span>₹${(orderDetails.finalAmount || orderDetails.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="delivery-info">
            <h3>📦 Shipping Information</h3>
            <p><strong>Estimated Delivery:</strong> ${estimatedDeliveryDays} business days</p>
            <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
            <p><strong>Order Status:</strong> <span class="status-badge">${orderDetails.orderStatus}</span></p>
          </div>
          
          <div class="tracking-info">
            <h3>📍 Order Tracking</h3>
            <p><strong>Tracking ID:</strong> <span class="tracking-id">${orderDetails._id}</span></p>
            <p>You can track your order status using this tracking ID on our website or mobile app.</p>
            <p><strong>Customer Support:</strong> support@farmoracrops.com | +91-XXXXXXXXXX</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Farmora Crops. All rights reserved.</p>
            <p>Thank you for choosing Farmora Crops for your organic agricultural needs!</p>
            <p>This is an automated invoice. Please keep it for your records.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Set content and wait for page to load
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('📄 Generating PDF with Puppeteer...');
    
    // Wait for PDF to be fully generated and written to disk
    const pdfBuffer = await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
          Farmora Crops - Order Invoice
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; color: #666; text-align: center; width: 100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      preferCSSPageSize: true
    });
    
    // Wait a moment to ensure file is fully written to disk
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the file exists and has content
    let fileExists = false;
    let fileSize = 0;
    let retries = 0;
    const maxRetries = 10;
    
    while (!fileExists && retries < maxRetries) {
      try {
        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          fileSize = stats.size;
          if (fileSize > 0) {
            fileExists = true;
            console.log(`✅ PDF file verified: ${filename} (${fileSize} bytes)`);
          } else {
            console.log(`⏳ File exists but empty, retrying... (${retries + 1}/${maxRetries})`);
          }
        } else {
          console.log(`⏳ File not yet created, retrying... (${retries + 1}/${maxRetries})`);
        }
      } catch (error) {
        console.log(`⏳ Error checking file, retrying... (${retries + 1}/${maxRetries}): ${error.message}`);
      }
      
      if (!fileExists) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    if (!fileExists) {
      throw new Error(`PDF file could not be verified after ${maxRetries} attempts`);
    }
    
    console.log(`✅ Puppeteer PDF generated: ${filename}`);
    
    // Close page before browser
    await page.close();
    console.log('📄 Puppeteer page closed');
    
    return {
      filename,
      filepath,
      success: true,
      size: fileSize
    };
    
  } catch (error) {
    console.error('❌ Puppeteer PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Puppeteer browser closed');
    }
  }
};

module.exports = {
  generateOrderInvoiceWithPuppeteer
};
