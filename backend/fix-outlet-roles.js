const mongoose = require('mongoose');
const Outlet = require('./models/Outlet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔍 CHECKING OUTLET ROLE ISSUE');
    console.log('===============================\n');
    
    // Check Rajkot outlet
    const rajkotOutlet = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in' 
    });
    
    if (rajkotOutlet) {
      console.log('✅ Rajkot Outlet Found:');
      console.log(`   Name: ${rajkotOutlet.name}`);
      console.log(`   Email: ${rajkotOutlet.outletEmail}`);
      console.log(`   Has role field: ${rajkotOutlet.role ? 'Yes' : 'No'}`);
      console.log(`   Role value: ${rajkotOutlet.role}`);
      console.log(`   All fields: ${Object.keys(rajkotOutlet.toObject())}`);
    }
    
    console.log('\n🔧 FIXING OUTLET ROLE');
    console.log('========================');
    
    // Add role field to all outlets
    const result = await Outlet.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'outletManager' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} outlets with role: outletManager`);
    
    // Verify the fix
    const updatedOutlet = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in' 
    });
    
    if (updatedOutlet) {
      console.log(`✅ Rajkot outlet now has role: ${updatedOutlet.role}`);
    }
    
    console.log('\n🎯 OUTLET ROLE FIX COMPLETE');
    console.log('============================');
    console.log('✅ All outlets now have role: outletManager');
    console.log('✅ Outlet dashboard should now work');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
