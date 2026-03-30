const mongoose = require('mongoose');
const Outlet = require('./models/Outlet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find all outlets
    const outlets = await Outlet.find({});
    console.log(`\nFound ${outlets.length} outlets in database:\n`);
    
    outlets.forEach((outlet, index) => {
      console.log(`${index + 1}. ${outlet.name}`);
      console.log(`   Email: ${outlet.outletEmail}`);
      console.log(`   Phone: ${outlet.phone}`);
      console.log(`   State: ${outlet.address?.state}`);
      console.log(`   District: ${outlet.address?.district}`);
      console.log(`   Active: ${outlet.isActive}`);
      console.log(`   Manager ID: ${outlet.managerId}`);
      console.log(`   Password Hash: ${outlet.password ? 'Present' : 'Missing'}`);
      console.log('---');
    });
    
    // Test specific outlet
    console.log('\nTesting ahmedabad@farmora.in...');
    const ahmedabadOutlet = await Outlet.findOne({ 
      outletEmail: 'ahmedabad@farmora.in',
      isActive: true 
    });
    
    if (ahmedabadOutlet) {
      console.log('✅ Found ahmedabad outlet');
      console.log(`   Name: ${ahmedabadOutlet.name}`);
      console.log(`   Email: ${ahmedabadOutlet.outletEmail}`);
      console.log(`   Active: ${ahmedabadOutlet.isActive}`);
      
      // Test password comparison
      const testPassword = 'outlet123';
      const isMatch = await ahmedabadOutlet.comparePassword(testPassword);
      console.log(`   Password "${testPassword}" match: ${isMatch}`);
      
      if (!isMatch) {
        console.log('❌ Password comparison failed!');
        console.log('   This might be a password hashing issue.');
        
        // Let's manually update the password
        console.log('\n🔧 Updating password...');
        ahmedabadOutlet.password = 'outlet123';
        await ahmedabadOutlet.save();
        console.log('✅ Password updated. Try logging in again.');
      }
    } else {
      console.log('❌ ahmedabad@farmora.in not found or not active');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('MongoDB connection error:', error);
});
