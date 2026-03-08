const nodemailer = require('nodemailer');

// Get email configuration
const getEmailConfig = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  // Check if email is configured
  if (!emailUser || !emailPassword || 
      emailUser === 'your-email@gmail.com' || 
      emailPassword === 'your-app-password') {
    return null;
  }
  
  return {
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  };
};

// Create transporter only if email is configured
let transporter = null;
const initTransporter = () => {
  if (!transporter) {
    const config = getEmailConfig();
    if (config) {
      try {
        transporter = nodemailer.createTransport(config);
      } catch (error) {
        console.error('Failed to create email transporter:', error);
        transporter = null;
      }
    }
  }
  return transporter;
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification OTP
const sendVerificationOTP = async (email, name, otp) => {
  const emailConfig = getEmailConfig();
  
  // If email is not configured, log OTP to console (for development)
  if (!emailConfig) {
    console.log('\n========================================');
    console.log('📧 EMAIL VERIFICATION OTP (Development Mode)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true; // Return true so signup doesn't fail
  }

  // Initialize transporter
  const mailTransporter = initTransporter();
  if (!mailTransporter) {
    console.log('\n========================================');
    console.log('📧 EMAIL VERIFICATION OTP (Email service unavailable)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true;
  }

  const mailOptions = {
    from: emailConfig.auth.user,
    to: email,
    subject: 'Verify Your Email - Farmora Crops',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5530;">Welcome to Farmora Crops, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address by entering the OTP below:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c5530; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with Farmora Crops, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Farmora Crops - Pure Organic Grains</p>
      </div>
    `
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    // Log OTP to console as fallback
    console.log('\n========================================');
    console.log('📧 EMAIL VERIFICATION OTP (Fallback)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true; // Return true so signup doesn't fail
  }
};

// Send password reset OTP
const sendPasswordResetOTP = async (email, name, otp) => {
  const emailConfig = getEmailConfig();
  
  // If email is not configured, log OTP to console (for development)
  if (!emailConfig) {
    console.log('\n========================================');
    console.log('📧 PASSWORD RESET OTP (Development Mode)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true;
  }

  // Initialize transporter
  const mailTransporter = initTransporter();
  if (!mailTransporter) {
    console.log('\n========================================');
    console.log('📧 PASSWORD RESET OTP (Email service unavailable)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true;
  }

  const mailOptions = {
    from: emailConfig.auth.user,
    to: email,
    subject: 'Password Reset - Farmora Crops',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5530;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Please use the OTP below to proceed:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2c5530; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Farmora Crops - Pure Organic Grains</p>
      </div>
    `
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    // Log OTP to console as fallback
    console.log('\n========================================');
    console.log('📧 PASSWORD RESET OTP (Fallback)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`OTP: ${otp}`);
    console.log('========================================\n');
    return true; // Return true so password reset doesn't fail
  }
};

module.exports = {
  generateOTP,
  sendVerificationOTP,
  sendPasswordResetOTP
};

