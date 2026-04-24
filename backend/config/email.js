const { sendMail, sendOrderInvoiceEmail: sendInvoiceEmail } = require('../sendmail');
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
    if (!userEmail) throw new Error('User email is required');
    if (!orderDetails || !orderDetails._id) throw new Error('Order details with _id are required');
    if (!customerName) throw new Error('Customer name is required');
    
    console.log(`📧 Preparing invoice email for: ${userEmail}`);
    
    // Generate PDF invoice
    const invoiceResult = await generateOrderInvoiceWithPuppeteer(orderDetails, customerName, userEmail);
    
    if (!invoiceResult.success) {
      throw new Error('Failed to generate PDF invoice');
    }
    
    console.log(`📄 PDF generated: ${invoiceResult.filename} (${invoiceResult.size} bytes)`);
    
    // Build items table rows for email
    const itemsRows = (orderDetails.items || []).map((item, i) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 12px; font-size: 14px; color: #333;">${i + 1}</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #1a1a1a; font-weight: 600;">${item.name}</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #666; text-align: center;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #666; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #1a1a1a; font-weight: 700; text-align: right;">₹${(item.price * item.quantity).toFixed(0)}</td>
      </tr>
    `).join('');

    const paymentText = orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' :
      orderDetails.paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Online Payment';

    // Build address string
    const addrParts = [
      orderDetails.deliveryAddress?.houseNo,
      orderDetails.deliveryAddress?.street
    ].filter(Boolean).join(', ');
    const areaLine = [
      orderDetails.deliveryAddress?.area,
      orderDetails.deliveryAddress?.taluka
    ].filter(Boolean).join(', ');
    const cityLine = [
      orderDetails.deliveryAddress?.city || orderDetails.deliveryAddress?.district,
      orderDetails.deliveryAddress?.state
    ].filter(Boolean).join(', ');
    const pincode = orderDetails.deliveryAddress?.pincode || '';
    const mobile = orderDetails.deliveryAddress?.mobileNumber || orderDetails.deliveryAddress?.phone || '';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice - Farmora Crops</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f0f4f0;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Green Header Bar -->
          <div style="background: linear-gradient(135deg, #114714 0%, #1a6b1f 100%); padding: 25px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🌾 Farmora Crops</h1>
            <p style="color: #a8e6a8; margin: 5px 0 0; font-size: 13px;">The Promise of Purity</p>
          </div>

          <div style="padding: 25px 30px;">

            <!-- Invoice Info -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f8faf8; border-radius: 8px; border-left: 4px solid #114714;">
              <div>
                <h2 style="margin: 0 0 8px; color: #114714; font-size: 20px;">Order Invoice</h2>
                <p style="margin: 3px 0; font-size: 13px; color: #666;">Order #${orderDetails._id.toString().slice(-8).toUpperCase()}</p>
                <p style="margin: 3px 0; font-size: 13px; color: #666;">Date: ${new Date(orderDetails.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p style="margin: 3px 0; font-size: 13px; color: #666;">Payment: ${paymentText}</p>
              </div>
            </div>

            <p style="font-size: 15px; color: #333;">Hello <strong>${customerName}</strong>,</p>
            <p style="font-size: 14px; color: #555;">Thank you for your order! Here are your order details:</p>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #114714;">
                  <th style="padding: 10px 12px; color: white; font-size: 12px; text-align: left;">#</th>
                  <th style="padding: 10px 12px; color: white; font-size: 12px; text-align: left;">Item</th>
                  <th style="padding: 10px 12px; color: white; font-size: 12px; text-align: center;">Qty</th>
                  <th style="padding: 10px 12px; color: white; font-size: 12px; text-align: right;">Rate</th>
                  <th style="padding: 10px 12px; color: white; font-size: 12px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="text-align: right; margin: 15px 0; padding: 15px; background: #f8faf8; border-radius: 8px;">
              <p style="margin: 4px 0; font-size: 14px; color: #666;">Subtotal: <strong style="color: #333;">₹${(orderDetails.totalAmount || 0).toFixed(2)}</strong></p>
              <p style="margin: 4px 0; font-size: 14px; color: #666;">Delivery Fee: <strong style="color: #333;">${orderDetails.deliveryFee > 0 ? '₹' + orderDetails.deliveryFee.toFixed(2) : 'FREE'}</strong></p>
              <hr style="border: none; border-top: 2px solid #114714; margin: 10px 0;">
              <p style="margin: 4px 0; font-size: 20px; color: #114714; font-weight: 800;">Total: ₹${(orderDetails.finalAmount || orderDetails.totalAmount || 0).toFixed(2)}</p>
            </div>

            <!-- Delivery Address -->
            <div style="margin: 20px 0; padding: 15px; background: #f0f7f0; border-radius: 8px; border-left: 4px solid #16a34a;">
              <h3 style="margin: 0 0 8px; color: #114714; font-size: 15px;">📍 Delivery Address</h3>
              ${addrParts ? `<p style="margin: 3px 0; font-size: 14px; color: #333;">${addrParts}</p>` : ''}
              ${areaLine ? `<p style="margin: 3px 0; font-size: 14px; color: #333;">${areaLine}</p>` : ''}
              <p style="margin: 3px 0; font-size: 14px; color: #333;">${cityLine}${pincode ? ' - ' + pincode : ''}</p>
              ${mobile ? `<p style="margin: 3px 0; font-size: 14px; color: #666;">📞 ${mobile}</p>` : ''}
            </div>

            <!-- PDF Notice -->
            <div style="margin: 15px 0; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 6px; text-align: center; font-size: 13px;">
              📄 A detailed PDF invoice is also attached to this email for your records.
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8faf8; padding: 15px 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="margin: 4px 0; font-size: 12px; color: #888;">© ${new Date().getFullYear()} Farmora Crops | farmoracrops@gmail.com | +91 8733040849</p>
            <p style="margin: 4px 0; font-size: 11px; color: #aaa;">This is an automated invoice. Please keep it for your records.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    // Send email using the invoice function from sendmail.js (supports attachments)
    const result = await sendInvoiceEmail({
      to: userEmail,
      subject: `Order Invoice #${orderDetails._id.toString().slice(-8).toUpperCase()} - Farmora Crops`,
      html: htmlTemplate,
      attachments: [{
        filename: invoiceResult.filename,
        path: invoiceResult.filepath
      }]
    });
    
    console.log('✅ Invoice email sent with PDF attachment!');
    return result;
    
  } catch (error) {
    console.error('❌ Error sending order invoice email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendOrderInvoiceEmail: sendOrderInvoiceEmailWithPDF,
  testEmailConfig
};
