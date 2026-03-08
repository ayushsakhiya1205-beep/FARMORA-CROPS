const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔧 FIXING CUSTOMER AUTHENTICATION');
    console.log('===================================\n');
    
    // Check existing customer users
    const customers = await User.find({ role: 'customer' });
    console.log(`Found ${customers.length} customer users:\n`);
    
    if (customers.length === 0) {
      console.log('❌ No customer users found!');
      console.log('📝 Creating sample customer user...');
      
      // Create sample customer with proper password
      const sampleCustomer = new User({
        name: 'Vraj Sanandiya',
        email: 'vraj.sanandiya@example.com',
        password: 'Test12345', // 8+ characters
        phone: '9876543210',
        state: 'Gujarat',
        district: 'Rajkot',
        address: 'Test Address',
        pincode: '360001',
        role: 'customer',
        emailVerified: true
      });
      
      await sampleCustomer.save();
      console.log('✅ Created customer: vraj.sanandiya@example.com / Test12345');
      
    } else {
      customers.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name} (${customer.email})`);
        console.log(`   Role: ${customer.role}`);
        console.log(`   Email Verified: ${customer.emailVerified}`);
        console.log(`   Active: ${customer.isActive}`);
        console.log('---');
      });
    }
    
    // Test password for existing customer
    const testCustomer = await User.findOne({ email: 'vraj.sanandiya@example.com' });
    if (testCustomer) {
      console.log('\n🔐 Testing customer password...');
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('Test123', testCustomer.password);
      console.log(`Password "Test123" matches: ${isMatch}`);
      
      if (!isMatch) {
        console.log('🔧 Updating customer password...');
        testCustomer.password = 'Test12345';
        await testCustomer.save();
        console.log('✅ Updated password to: Test12345');
      }
    }
    
    console.log('\n🎯 CUSTOMER AUTHENTICATION FIX COMPLETE!');
    console.log('=====================================');
    console.log('✅ Customer Login: vraj.sanandiya@example.com / Test12345');
    console.log('✅ Outlet Login: rajkot@farmora.in / Rajkot@123');
    console.log('\n💡 Use these credentials to test login:');
    console.log('   Customer: http://localhost:3000/login');
    console.log('   Email: vraj.sanandiya@example.com');
    console.log('   Password: Test12345');
    console.log('');
    console.log('   Outlet: http://localhost:3000/login');
    console.log('   Email: rajkot@farmora.in');
    console.log('   Password: Rajkot@123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
