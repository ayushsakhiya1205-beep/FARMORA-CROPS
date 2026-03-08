const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Outlet = require('./models/Outlet');
const User = require('./models/User');

// Outlet password mapping based on city names
const outletPasswords = {
  'Rajkot Farmora Outlet': 'Rajkot@123',
  'Ahmedabad Farmora Outlet': 'Ahmedabad@123',
  'Surat Farmora Outlet': 'Surat@123',
  'Jaipur Farmora Outlet': 'Jaipur@123',
  'Mumbai Farmora Outlet': 'Mumbai@123'
};

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Get all outlets
    const outlets = await Outlet.find({});
    console.log(`Found ${outlets.length} outlets`);
    
    // Update each outlet manager's password
    for (const outlet of outlets) {
      const newPassword = outletPasswords[outlet.name];
      
      if (newPassword) {
        // Find the outlet manager user
        const manager = await User.findOne({ 
          email: outlet.outletEmail,
          role: 'outletManager'
        });
        
        if (manager) {
          // Hash the new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          // Update the password
          manager.password = hashedPassword;
          await manager.save();
          
          console.log(`✅ Updated password for ${outlet.name}:`);
          console.log(`   Email: ${outlet.outletEmail}`);
          console.log(`   New Password: ${newPassword}`);
        } else {
          console.log(`❌ Manager not found for ${outlet.name}`);
        }
      } else {
        console.log(`⚠️  No password mapping found for ${outlet.name}`);
      }
    }
    
    console.log('\n🎉 Outlet manager passwords updated successfully!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('=====================================');
    
    for (const outlet of outlets) {
      const newPassword = outletPasswords[outlet.name];
      if (newPassword) {
        console.log(`${outlet.name}:`);
        console.log(`  Email: ${outlet.outletEmail}`);
        console.log(`  Password: ${newPassword}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('Error updating outlet manager passwords:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('MongoDB connection error:', error);
});
