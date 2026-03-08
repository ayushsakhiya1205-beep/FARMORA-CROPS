const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestUser = async () => {
  try {
    await connectDB();

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@farmora.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email: test@farmora.com');
      console.log('🔑 Password: test123');
      process.exit(0);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 12);
    
    const testUser = new User({
      name: 'Test Customer',
      email: 'test@farmora.com',
      password: hashedPassword,
      phone: '9876543210',
      address: '123 Test Street, Test City, Gujarat 380001',
      pincode: '380001',
      state: 'Gujarat',
      district: 'Ahmedabad',
      role: 'customer',
      emailVerified: true,
      isActive: true
    });

    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@farmora.com');
    console.log('🔑 Password: test123');
    console.log('🌐 You can now login and test the cart functionality');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
