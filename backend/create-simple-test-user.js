const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/User');

async function createSimpleTestUser() {
  try {
    // Delete existing test user if exists
    await User.deleteOne({ email: 'simple@test.com' });
    
    // Create simple test user with known password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = new User({
      name: 'Simple Test',
      email: 'simple@test.com',
      password: hashedPassword,
      phone: '9876543210',
      state: 'Gujarat',
      district: 'Rajkot',
      address: '123 Test Street',
      pincode: '360001',
      role: 'customer',
      emailVerified: true
    });

    await testUser.save();
    console.log('✅ Simple test user created successfully!');
    console.log('Email: simple@test.com');
    console.log('Password: password123');
    console.log('\nYou can now test the OTP flow with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createSimpleTestUser();
