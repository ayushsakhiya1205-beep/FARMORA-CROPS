const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const outletSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  outletEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: {
      type: String,
      enum: ["Gujarat", "Rajasthan", "Maharashtra"],
      required: true
    },
    district: {
      type: String,
      required: true
    },
    pincode: String,
    landmark: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  phone: {
    type: String,
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['outletManager'],
    default: 'outletManager'
  },
  // Login OTP
  loginOTP: {
    type: String,
    default: null
  },
  loginOTPExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
outletSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
outletSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Outlet', outletSchema);

