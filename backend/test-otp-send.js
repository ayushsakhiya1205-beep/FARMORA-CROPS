require('dotenv').config();
const { sendMail } = require('./sendmail');

async function testOTPSend() {
  try {
    console.log('📧 Testing OTP email send...');
    
    const testOTP = Math.floor(100000 + Math.random() * 900000);
    const testEmail = 'ayushsakhiya1205@gmail.com'; // Test with your own email
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Farmora Crops - Login OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #114714; }
          .logo { font-size: 28px; font-weight: bold; color: #114714; margin-bottom: 10px; }
          .otp-container { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #114714; }
          .otp-code { font-size: 32px; font-weight: bold; color: #114714; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: white; border: 2px dashed #114714; border-radius: 8px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌾 Farmora Crops</div>
            <h2>Test OTP Email</h2>
          </div>
          <p>Hello User,</p>
          <p>This is a test OTP email from Farmora Crops.</p>
          <div class="otp-container">
            <h3>Your Test OTP is:</h3>
            <div class="otp-code">${testOTP}</div>
            <p><strong>This OTP will expire in 5 minutes.</strong></p>
          </div>
          <p>Thank you for choosing Farmora Crops!</p>
        </div>
      </body>
      </html>
    `;
    
    const result = await sendMail({
      to: testEmail,
      subject: `Test OTP - Farmora Crops`,
      text: `Your Farmora Crops Test OTP is: ${testOTP}. This OTP will expire in 5 minutes.`,
      html: htmlTemplate
    });
    
    console.log('✅ Test OTP email sent successfully!');
    console.log(`📧 Check your inbox for OTP: ${testOTP}`);
    console.log(`📨 Sent to: ${testEmail}`);
    console.log(`📋 Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.error('❌ Test OTP email failed:', error);
  }
}

testOTPSend();
