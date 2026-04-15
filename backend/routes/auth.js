const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Outlet = require('../models/Outlet');
const { auth } = require('../middleware/auth');
const { generateOTP } = require('../utils/emailService');
const { determineUserRole } = require('../utils/roleHelper');
const { sendOTPEmail, testEmailConfig } = require('../config/email');

const router = express.Router();

// Generate JWT Token
const generateToken = (user, userType) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role || (userType === 'outlet' ? 'outletManager' : userType),
      userType: userType, // 'customer' or 'outlet'
      state: user.state,
      district: user.district
    },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    { expiresIn: '7d' }
  );
};

// --------------------------------------
// SIGNUP WITH AUTO-LOGIN
// --------------------------------------
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and number'),
    body('state').notEmpty().withMessage('State is required'),
    body('district').notEmpty().withMessage('District is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('pincode').notEmpty().withMessage('Pincode is required').isLength({ min: 6, max: 6 }),
    body('phone').notEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, phone, state, district, address, pincode } = req.body;

      // Check existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Determine role
      const role = determineUserRole(email);

      // Create new user (auto-verify for simplicity, remove OTP flow)
      const user = new User({
        name,
        email,
        password,
        phone,
        state,
        district,
        address,
        pincode,
        role,
        emailVerified: true // Auto-verify for better UX
      });

      await user.save();

      // Generate JWT token for auto-login
      const token = generateToken(user, 'customer');

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        message: 'Signup successful! You are now logged in.',
        token,
        userType: 'customer',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          state: user.state,
          district: user.district,
          address: user.address,
          pincode: user.pincode,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: 'Server error during signup' });
    }
  }
);

// --------------------------------------
// VERIFY EMAIL OTP
// --------------------------------------
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(400).json({ message: 'User not found' });
      if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

      if (user.emailVerificationOTP !== otp)
        return res.status(400).json({ message: 'Invalid OTP' });

      if (new Date() > user.emailVerificationOTPExpiry)
        return res.status(400).json({ message: 'OTP expired' });

      // Verify
      user.emailVerified = true;
      user.emailVerificationOTP = null;
      user.emailVerificationOTPExpiry = null;
      await user.save();

      const token = generateToken(user, 'customer');

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          state: user.state,
          district: user.district,
          address: user.address,
          pincode: user.pincode,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ message: 'Server error verifying email' });
    }
  }
);

// --------------------------------------
// REQUEST LOGIN OTP
// --------------------------------------
router.post(
  '/request-login-otp',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    console.log('🔍 DEBUG: OTP request received');
    console.log('🔍 DEBUG: Request body:', { email: req.body.email, password: '***' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ DEBUG: Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    try {
      const { email, password } = req.body;
      
      // Check if it's an outlet login
      const isOutletEmail = email.toLowerCase().endsWith('@farmora.in');
      
      if (isOutletEmail) {
        // Outlet OTP generation
        const district = email.split('@')[0].toLowerCase();
        
        const outlet = await Outlet.findOne({ 
          'address.district': { $regex: new RegExp(`^${district}$`, 'i') }
        });
        
        if (!outlet) {
          console.log('❌ DEBUG: Outlet not found for district:', district);
          return res.status(401).json({ 
            success: false,
            message: 'Invalid outlet credentials' 
          });
        }

        const isMatch = await outlet.comparePassword(password);
        if (!isMatch) {
          console.log('❌ DEBUG: Outlet password mismatch');
          return res.status(401).json({ 
            success: false,
            message: 'Invalid outlet credentials' 
          });
        }

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        outlet.loginOTP = otp;
        outlet.loginOTPExpiry = otpExpiry;
        await outlet.save();

        // Send OTP email (using existing email service)
        try {
          await sendOTPEmail(outlet.outletEmail || email, otp, 'Farmora Crops Outlet Login');
          console.log('✅ OTP sent to outlet:', outlet.name);
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          // Continue even if email fails
        }

        res.json({
          success: true,
          message: 'OTP sent to your email. Please check and enter the OTP to complete login.',
          requiresOTP: true,
          email: outlet.outletEmail || email,
          otp: otp // Include OTP in development for testing
        });
      } else {
        // Customer OTP generation
        const user = await User.findOne({ email });

        if (!user) {
          console.log('❌ DEBUG: User not found for email:', email);
          return res.status(401).json({ 
            success: false,
            message: 'Invalid credentials' 
          });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          console.log('❌ DEBUG: Customer password mismatch');
          return res.status(401).json({ 
            success: false,
            message: 'Invalid credentials' 
          });
        }

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        user.loginOTP = otp;
        user.loginOTPExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        try {
          await sendOTPEmail(user.email, otp, 'Farmora Crops Login');
          console.log('✅ OTP sent to customer:', user.name);
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          // Continue even if email fails
        }

        res.json({
          success: true,
          message: 'OTP sent to your email. Please check and enter the OTP to complete login.',
          requiresOTP: true,
          email: user.email,
          otp: otp // Include OTP in development for testing
        });
      }
    } catch (error) {
      console.error("❌ OTP request error:", error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during OTP request' 
      });
    }
  }
);

// --------------------------------------
// DIRECT LOGIN SYSTEM - NO OTP
// --------------------------------------
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    console.log('🔍 DEBUG: Login attempt received');
    console.log('🔍 DEBUG: Request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ DEBUG: Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    try {
      const { email, password } = req.body;
      
      console.log('🔍 DEBUG: Processing login for email:', email);
      
      // Check if it's an outlet login (district@farmora.in format)
      const isOutletEmail = email.toLowerCase().endsWith('@farmora.in');
      
      if (isOutletEmail) {
        console.log('🔍 DEBUG: Outlet login detected');
        // Outlet Login Logic
        const district = email.split('@')[0].toLowerCase(); // Extract district from email
        
        const outlet = await Outlet.findOne({ 
          'address.district': { $regex: new RegExp(`^${district}$`, 'i') }
        });
        
        if (!outlet) {
          console.log('❌ DEBUG: Outlet not found for district:', district);
          return res.status(401).json({ 
            success: false,
            message: 'Invalid outlet credentials' 
          });
        }

        const isMatch = await outlet.comparePassword(password);
        if (!isMatch) {
          console.log('❌ DEBUG: Outlet password mismatch');
          return res.status(401).json({ 
            success: false,
            message: 'Invalid outlet credentials' 
          });
        }

        // Direct login - NO OTP required
        const token = generateToken(outlet, 'outlet');

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('✅ Outlet login successful:', outlet.name);
        res.json({
          success: true,
          message: 'Outlet login successful',
          token,
          userType: 'outlet',
          user: {
            _id: outlet._id,
            id: outlet._id,
            name: outlet.name,
            email: outlet.outletEmail,
            role: 'outletManager',
            state: outlet.address.state,
            district: outlet.address.district,
            phone: outlet.phone
          }
        });
      } else {
        console.log('🔍 DEBUG: Customer login detected');
        // Customer Login Logic
        const user = await User.findOne({ email });

        if (!user) {
          console.log('❌ DEBUG: User not found for email:', email);
          return res.status(401).json({ 
            success: false,
            message: 'Invalid credentials' 
          });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          console.log('❌ DEBUG: Customer password mismatch');
          return res.status(401).json({ 
            success: false,
            message: 'Invalid credentials' 
          });
        }

        // Direct login - NO OTP required
        const token = generateToken(user, 'customer');

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('✅ Customer login successful:', user.name);
        res.json({
          success: true,
          message: 'Customer login successful',
          token,
          userType: 'customer',
          user: {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            state: user.state,
            district: user.district,
            address: user.address,
            pincode: user.pincode,
            phone: user.phone
          }
        });
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during login' 
      });
    }
  }
);
// --------------------------------------
// VERIFY LOGIN OTP
// --------------------------------------
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { email, otp } = req.body;
      
      // Check if it's an outlet login
      const isOutletEmail = email.toLowerCase().endsWith('@farmora.in');
      
      if (isOutletEmail) {
        const district = email.split('@')[0].toLowerCase();
        
        const outlet = await Outlet.findOne({ 
          'address.district': { $regex: new RegExp(`^${district}$`, 'i') }
        });
        
        if (!outlet) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid outlet credentials' 
          });
        }

        // Verify OTP
        if (!outlet.loginOTP || outlet.loginOTP !== otp) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid OTP' 
          });
        }

        if (new Date() > outlet.loginOTPExpiry) {
          return res.status(401).json({ 
            success: false,
            message: 'OTP expired' 
          });
        }

        // Clear OTP
        outlet.loginOTP = null;
        outlet.loginOTPExpiry = null;
        await outlet.save();

        const token = generateToken(outlet, 'outlet');

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
          success: true,
          message: 'Outlet login successful',
          token,
          userType: 'outlet',
          user: {
            _id: outlet._id,
            id: outlet._id,
            name: outlet.name,
            email: outlet.outletEmail,
            role: 'outletManager',
            state: outlet.address.state,
            district: outlet.address.district,
            phone: outlet.phone
          }
        });
      } else {
        // Customer verification
        const user = await User.findOne({ email });

        if (!user) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid credentials' 
          });
        }

        // Verify OTP
        if (!user.loginOTP || user.loginOTP !== otp) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid OTP' 
          });
        }

        if (new Date() > user.loginOTPExpiry) {
          return res.status(401).json({ 
            success: false,
            message: 'OTP expired' 
          });
        }

        // Clear OTP
        user.loginOTP = null;
        user.loginOTPExpiry = null;
        await user.save();

        const token = generateToken(user, 'customer');

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
          success: true,
          message: 'Customer login successful',
          token,
          userType: 'customer',
          user: {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            state: user.state,
            district: user.district,
            address: user.address,
            pincode: user.pincode,
            phone: user.phone
          }
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during OTP verification' 
      });
    }
  }
);

// --------------------------------------
// GET CURRENT USER (/me)
// --------------------------------------
router.get('/me', auth, async (req, res) => {
  try {
    // Get user data from token
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    
    let user = null;
    let userType = decoded.userType || 'customer';

    if (userType === 'outlet') {
      user = await Outlet.findById(decoded.userId).select('-password');
    } else {
      user = await User.findById(decoded.userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      userType,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email || user.outletEmail,
        role: user.role || 'outletManager',
        state: user.state || user.address?.state,
        district: user.district || user.address?.district,
        address: user.address,
        pincode: user.pincode,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// --------------------------------------
// PROFILE UPDATE
// --------------------------------------
router.put(
  '/profile',
  auth,
  [
    body('name').optional(),
    body('phone').optional(),
    body('state').optional(),
    body('district').optional(),
    body('address').optional(),
    body('pincode').optional()
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const fields = ['name', 'phone', 'state', 'district', 'address', 'pincode'];

      fields.forEach((f) => {
        if (req.body[f] !== undefined) user[f] = req.body[f];
      });

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: 'Server error updating profile' });
    }
  }
);

// --------------------------------------
// UPDATE DEFAULT ADDRESS
// --------------------------------------
router.put(
  '/address',
  auth,
  [
    body('phone').optional(),
    body('state').optional(),
    body('district').optional(),
    body('address').optional(),
    body('pincode').optional()
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const fields = ['phone', 'state', 'district', 'address', 'pincode'];

      fields.forEach((f) => {
        if (req.body[f] !== undefined) user[f] = req.body[f];
      });

      await user.save();

      res.json({
        message: 'Default address updated successfully',
        user
      });
    } catch (error) {
      console.error("Address update error:", error);
      res.status(500).json({ message: 'Server error updating address' });
    }
  }
);

// --------------------------------------
// LOGOUT
// --------------------------------------
router.post('/logout', auth, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
