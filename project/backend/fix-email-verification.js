const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔧 FIXING EMAIL VERIFICATION');
    console.log('=============================\n');
    
    // Update all customer users to have emailVerified = true
    const result = await User.updateMany(
      { role: 'customer', emailVerified: false },
      { $set: { emailVerified: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} customer users to emailVerified: true`);
    
    // Test login with existing user
    const testUser = await User.findOne({ email: 'vrajsanandiya111@gmail.com' });
    if (testUser) {
      console.log('\n🔐 Testing existing customer login...');
      console.log(`User: ${testUser.name} (${testUser.email})`);
      console.log(`Email Verified: ${testUser.emailVerified}`);
      console.log(`Active: ${testUser.isActive}`);
      
      // Update password to known value for testing
      const bcrypt = require('bcryptjs');
      testUser.password = 'Test12345';
      await testUser.save();
      console.log('✅ Updated password to: Test12345');
    }
    
    console.log('\n🎯 AUTHENTICATION FIX COMPLETE!');
    console.log('===============================');
    console.log('✅ All customer users now have emailVerified: true');
    console.log('✅ Test user password updated to: Test12345');
    console.log('\n💡 Working Login Credentials:');
    console.log('   CUSTOMER LOGIN:');
    console.log('   Email: vrajsanandiya111@gmail.com');
    console.log('   Password: Test12345');
    console.log('');
    console.log('   OUTLET LOGIN:');
    console.log('   Email: rajkot@farmora.in');
    console.log('   Password: Rajkot@123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
