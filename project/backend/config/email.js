const { sendMail, sendOrderInvoiceEmail } = require('../sendmail');
const { generateOrderInvoiceWithPuppeteer } = require('../utils/puppeteerInvoiceGenerator');

// Send OTP email template
const sendOTPEmail = async (userEmail, otp, userName = '') => {
  try {
    console.log(`📧 Sending OTP email to: ${userEmail}`);
    console.log(`🔢 OTP: ${otp}`);
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Farmora Crops - Login OTP</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #114714;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #114714;
            margin-bottom: 10px;
          }
          .otp-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #114714;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #114714;
            letter-spacing: 8px;
            margin: 20px 0;
            padding: 15px;
            background: white;
            border: 2px dashed #114714;
            border-radius: 8px;
            display: inline-block;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌾 Farmora Crops</div>
            <h2>Secure Login Verification</h2>
          </div>
          
          <p>Hello ${userName ? userName : 'User'},</p>
          
          <p>You have requested to log in to your Farmora Crops account. For your security, we've generated a One-Time Password (OTP) to complete the authentication process.</p>
          
          <div class="otp-container">
            <h3>Your Login OTP is:</h3>
            <div class="otp-code">${otp}</div>
            <p><strong>This OTP will expire in 5 minutes.</strong></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP via phone or email.
          </div>
          
          <p>If you didn't request this login attempt, please secure your account immediately by changing your password.</p>
          
          <p>Thank you for choosing Farmora Crops for your agricultural needs!</p>
          
          <div class="footer">
            <p>© 2024 Farmora Crops. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textTemplate = `Your Farmora Crops Login OTP is: ${otp}. This OTP will expire in 5 minutes. Never share this OTP with anyone.`;

    const result = await sendMail({
      to: userEmail,
      subject: 'Your Login OTP - Farmora Crops',
      text: textTemplate,
      html: htmlTemplate
    });
    
    console.log('✅ OTP email sent successfully!');
    return result;
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const { testEmailConfig: testConfig } = require('../sendmail');
    return await testConfig();
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

// Send Order Invoice Email with PDF attachment
const sendOrderInvoiceEmailWithPDF = async (userEmail, orderDetails, customerName) => {
  try {
    // Defensive checks
    if (!userEmail) {
      throw new Error('User email is required');
    }
    
    if (!orderDetails || !orderDetails._id) {
      throw new Error('Order details with _id are required');
    }
    
    if (!customerName) {
      throw new Error('Customer name is required');
    }
    
    console.log(`🌐 Generating Puppeteer PDF invoice for: ${userEmail}`);
    console.log(`📦 Order ID: ${orderDetails._id}`);
    console.log(`👤 Customer Name: ${customerName}`);
    console.log(`📊 Order Status: ${orderDetails.orderStatus}`);
    console.log(`💰 Final Amount: ₹${orderDetails.finalAmount}`);
    
    // Generate PDF invoice using Puppeteer
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(orderDetails, customerName, userEmail);
    
    if (!invoiceResult.success) {
      throw new Error('Failed to generate PDF invoice with Puppeteer');
    }
    
    console.log(`📄 Puppeteer PDF invoice generated: ${invoiceResult.filename} (${invoiceResult.size} bytes)`);
    
    // Calculate estimated delivery days
    const estimatedDeliveryDays = Math.max(3, Math.ceil(orderDetails.items.length * 2));
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice - Farmora Crops</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #114714;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #114714;
            margin-bottom: 10px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .invoice-info h3 {
            margin: 0 0 10px 0;
            color: #114714;
          }
          .invoice-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .delivery-info {
            margin: 30px 0;
            padding: 20px;
            background: #e8f5e8;
            border-radius: 8px;
            border-left: 4px solid #114714;
          }
          .tracking-info {
            margin: 20px 0;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .pdf-notice {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            background: #ffc107;
            color: #000;
          }
          .puppeteer-badge {
            background: #007bff;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌾 Farmora Crops</div>
            <h2>Order Invoice <span class="puppeteer-badge">Premium PDF</span></h2>
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
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Phone:</strong> ${orderDetails.deliveryAddress?.phone || 'N/A'}</p>
            </div>
          </div>
          
          <div class="pdf-notice">
            <h3>📄 Your Premium PDF Invoice is Attached!</h3>
            <p>Please find your professionally designed order invoice attached as a high-quality PDF file. Generated using advanced rendering technology for perfect formatting.</p>
          </div>
          
          <div class="delivery-info">
            <h3>📦 Delivery Information</h3>
            <p><strong>Delivery Address:</strong></p>
            <p>${orderDetails.deliveryAddress?.address || 'N/A'}</p>
            <p>${orderDetails.deliveryAddress?.district || ''}, ${orderDetails.deliveryAddress?.state || ''} - ${orderDetails.deliveryAddress?.pincode || ''}</p>
            <p><strong>Estimated Delivery:</strong> ${estimatedDeliveryDays} business days</p>
            <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
          </div>
          
          <div class="tracking-info">
            <h3>📍 Order Tracking</h3>
            <p><strong>Tracking ID:</strong> <code>${orderDetails._id}</code></p>
            <p>You can track your order status using this tracking ID on our website or mobile app.</p>
            <p><strong>Customer Support:</strong> support@farmoracrops.com | +91-XXXXXXXXXX</p>
          </div>
          
          <div class="footer">
            <p>📧 2024 Farmora Crops. All rights reserved.</p>
            <p>Thank you for choosing Farmora Crops for your organic agricultural needs!</p>
            <p>This is an automated premium invoice. Please keep it for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textTemplate = `Your Farmora Crops order #${orderDetails._id} has been confirmed. Total amount: ₹${orderDetails.finalAmount.toFixed(2)}. Please find your premium PDF invoice attached.`;

    // Prepare email attachment with PDF buffer
    const fs = require('fs');
    const pdfBuffer = fs.readFileSync(invoiceResult.filepath);
    
    const attachments = [{
      filename: invoiceResult.filename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];

    const result = await sendMail({
      to: userEmail,
      subject: `Order Invoice #${orderDetails._id} - Farmora Crops`,
      text: textTemplate,
      html: htmlTemplate,
      attachments: attachments
    });
    
    console.log('✅ Puppeteer PDF invoice email sent successfully!');
    return result;
    
  } catch (error) {
    console.error('❌ Error sending order invoice email:', error);
    console.error('📧 Email details:', { userEmail, orderId: orderDetails._id });
    
    // Don't fail the order creation if email fails, but log it
    // You could add a retry mechanism or queue system here
    console.log('⚠️ Email failed but order will still be created');
    
    // Return error info for debugging
    return { 
      success: false, 
      error: error.message,
      orderId: orderDetails._id
    };
  }
};

module.exports = {
  sendOTPEmail,
  sendOrderInvoiceEmail: sendOrderInvoiceEmailWithPDF,
  testEmailConfig
};
