const mongoose = require('mongoose');
const User = require('./models/User');
const Outlet = require('./models/Outlet');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔍 DEBUGGING LOGIN ISSUES');
    console.log('============================\n');
    
    // Test 1: Check Customer User
    console.log('📝 Test 1: Customer User Check');
    const customerUser = await User.findOne({ 
      email: 'vrajsanandiya111@gmail.com' 
    });
    
    if (customerUser) {
      console.log('✅ Customer found:');
      console.log(`   Name: ${customerUser.name}`);
      console.log(`   Email: ${customerUser.email}`);
      console.log(`   Role: ${customerUser.role}`);
      console.log(`   Email Verified: ${customerUser.emailVerified}`);
      console.log(`   Active: ${customerUser.isActive}`);
      
      // Test password comparison
      const passwordMatch = await bcrypt.compare('Test12345', customerUser.password);
      console.log(`   Password "Test12345" matches: ${passwordMatch}`);
      
      if (!passwordMatch) {
        console.log('🔧 Updating customer password...');
        customerUser.password = 'Test12345';
        await customerUser.save();
        console.log('✅ Password updated');
      }
    } else {
      console.log('❌ Customer user not found');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Check Outlet User
    console.log('📝 Test 2: Outlet User Check');
    const outletUser = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in' 
    });
    
    if (outletUser) {
      console.log('✅ Outlet found:');
      console.log(`   Name: ${outletUser.name}`);
      console.log(`   Email: ${outletUser.outletEmail}`);
      console.log(`   Active: ${outletUser.isActive}`);
      console.log(`   Manager ID: ${outletUser.managerId}`);
      
      // Test password comparison
      const outletPasswordMatch = await bcrypt.compare('Rajkot@123', outletUser.password);
      console.log(`   Password "Rajkot@123" matches: ${outletPasswordMatch}`);
      
      if (!outletPasswordMatch) {
        console.log('🔧 Updating outlet password...');
        outletUser.password = 'Rajkot@123';
        await outletUser.save();
        console.log('✅ Outlet password updated');
      }
    } else {
      console.log('❌ Outlet user not found');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Check Auth Routes
    console.log('📝 Test 3: Manual Login Test');
    
    // Test customer login route manually
    console.log('Testing customer login manually...');
    const testCustomer = await User.findOne({ 
      email: 'vrajsanandiya111@gmail.com',
      isActive: true 
    });
    
    if (testCustomer) {
      const customerPasswordMatch = await bcrypt.compare('Test12345', testCustomer.password);
      console.log(`✅ Customer login should work: ${customerPasswordMatch}`);
    }
    
    // Test outlet login route manually
    console.log('Testing outlet login manually...');
    const testOutlet = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in',
      isActive: true 
    });
    
    if (testOutlet) {
      const outletPasswordMatch = await bcrypt.compare('Rajkot@123', testOutlet.password);
      console.log(`✅ Outlet login should work: ${outletPasswordMatch}`);
    }
    
    console.log('\n🎯 DEBUG COMPLETE');
    console.log('==================');
    console.log('✅ If both show "true", login should work');
    console.log('❌ If any show "false", that\'s the issue');
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
