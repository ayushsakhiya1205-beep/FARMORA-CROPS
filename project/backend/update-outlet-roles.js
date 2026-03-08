const mongoose = require('mongoose');
const Outlet = require('./models/Outlet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔧 UPDATING OUTLET ROLES');
    console.log('==========================\n');
    
    // Update all outlets to have role
    const result = await Outlet.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'outletManager' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} outlets with role: outletManager`);
    
    // Verify the update
    const outlets = await Outlet.find({});
    console.log('\n📝 All Outlets:');
    outlets.forEach((outlet, index) => {
      console.log(`${index + 1}. ${outlet.name} (${outlet.outletEmail})`);
      console.log(`   Role: ${outlet.role}`);
      console.log(`   Active: ${outlet.isActive}`);
      console.log('---');
    });
    
    console.log('\n🎯 OUTLET ROLE UPDATE COMPLETE');
    console.log('==============================');
    console.log('✅ All outlets now have role: outletManager');
    console.log('✅ Outlet dashboard should now work');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
