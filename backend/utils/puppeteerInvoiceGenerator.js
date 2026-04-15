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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; color: #1e293b; padding: 30px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border-radius: 16px; border: 1px solid #f1f5f9; position: relative; overflow: hidden; }
          
          /* Top Gradient Bar */
          .invoice-box::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #16a34a, #22c55e); }
          
          header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px dashed #f1f5f9; }
          .logo { font-size: 32px; font-weight: 800; color: #16a34a; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
          .title { text-align: right; }
          .title h1 { font-size: 36px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
          .title p { color: #64748b; font-size: 15px; font-weight: 600; margin-top: 5px; }
          
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
          .info-col { flex: 1; padding: 25px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
          .info-col h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 12px; }
          .info-col p { font-size: 14px; color: #334155; margin-bottom: 6px; font-weight: 500; }
          .info-col p strong { color: #0f172a; }
          
          .status-badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 30px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #16a34a; color: white; padding: 14px 20px; text-align: left; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          th:first-child { border-radius: 8px 0 0 8px; }
          th:last-child { border-radius: 0 8px 8px 0; text-align: right; }
          td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; font-weight: 500; }
          td:last-child { text-align: right; font-weight: 700; color: #0f172a; }
          
          .summary { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .summary-box { width: 350px; background: #f8fafc; padding: 25px; border-radius: 12px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #64748b; }
          .summary-row.total { font-size: 24px; font-weight: 800; color: #16a34a; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #cbd5e1; }
          
          .footer-grid { display: flex; gap: 20px; margin-bottom: 30px; }
          .footer-box { flex: 1; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }
          .footer-box h4 { font-size: 14px; color: #0f172a; margin-bottom: 10px; }
          .footer-box p { font-size: 13px; color: #64748b; line-height: 1.6; }
          
          .thanks { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; }
          
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 140px; color: rgba(22, 163, 74, 0.03); font-weight: 900; z-index: -1; pointer-events: none; white-space: nowrap; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="watermark">FARMORA</div>
          
          <header>
            <div class="logo">🌾 Farmora</div>
            <div class="title">
              <h1>Invoice</h1>
              <p>#${orderDetails._id.toString().slice(-8).toUpperCase()}</p>
            </div>
          </header>
          
          <div class="info-grid">
            <div class="info-col">
              <h3>Billed To</h3>
              <p><strong>${customerName}</strong></p>
              <p>${customerEmail}</p>
              <p>${orderDetails.deliveryAddress?.mobileNumber || orderDetails.deliveryAddress?.phone || 'N/A'}</p>
            </div>
            
            <div class="info-col">
              <h3>Shipping Address</h3>
              <p>
                ${orderDetails.deliveryAddress?.houseNo ? orderDetails.deliveryAddress.houseNo + ', ' : ''}
                ${orderDetails.deliveryAddress?.street || orderDetails.deliveryAddress?.address?.split(',')[1]?.trim() || orderDetails.deliveryAddress?.address?.split(',')[0]?.trim() || 'N/A'}
              </p>
              <p>
                ${[orderDetails.deliveryAddress?.area, orderDetails.deliveryAddress?.taluka].filter(Boolean).join(', ')}
              </p>
              <p>
                ${[orderDetails.deliveryAddress?.city || orderDetails.deliveryAddress?.district, orderDetails.deliveryAddress?.state].filter(Boolean).join(', ')} 
                ${orderDetails.deliveryAddress?.pincode ? '- ' + orderDetails.deliveryAddress.pincode : ''}
              </p>
            </div>
            
            <div class="info-col">
              <h3>Invoice Details</h3>
              <p><strong>Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge">${orderDetails.orderStatus === 'archived' ? 'Completed' : orderDetails.orderStatus}</span></p>
              <p><strong>Payment:</strong> ${orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
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
          
          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${(orderDetails.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping Fee</span>
                <span>${orderDetails.deliveryFee > 0 ? '₹' + orderDetails.deliveryFee.toFixed(2) : 'FREE'}</span>
              </div>
              <div class="summary-row total">
                <span>Total Due</span>
                <span>₹${(orderDetails.finalAmount || orderDetails.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer-grid">
            <div class="footer-box">
              <h4>📦 Shipping Info</h4>
              <p>Estimated Delivery: <strong>${estimatedDeliveryDays} Business Days</strong></p>
              <p>Our delivery executive will contact you prior to arrival at the shipping address.</p>
            </div>
            <div class="footer-box">
              <h4>💬 Need Help?</h4>
              <p>Email: support@farmoracrops.com</p>
              <p>Call: +91-9876543210</p>
            </div>
          </div>
          
          <div class="thanks">
            <p><strong>Thank you for your business!</strong><br/>Generated automatically on ${new Date().toLocaleString()}</p>
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
