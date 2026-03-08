const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Outlet = require('../models/Outlet');

const auth = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    
    let user = null;
    
    // Check if it's an outlet or customer based on userType
    if (decoded.userType === 'outlet') {
      user = await Outlet.findById(decoded.userId).select('-password');
    } else {
      user = await User.findById(decoded.userId).select('-password');
    }
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Check if email is verified (only for customers)
    if (decoded.userType !== 'outlet' && !user.emailVerified) {
      return res.status(401).json({ message: 'Please verify your email before accessing this resource' });
    }

    req.user = user;
    req.userType = decoded.userType; // Add userType to request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { auth, authorize };

