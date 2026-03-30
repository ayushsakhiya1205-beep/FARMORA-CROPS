const mongoose = require('mongoose');
const Outlet = require('./models/Outlet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Update all outlet passwords to ensure they work
    const outlets = await Outlet.find({});
    console.log(`Updating passwords for ${outlets.length} outlets...`);
    
    for (const outlet of outlets) {
      outlet.password = 'outlet123';
      await outlet.save();
      console.log(`✅ Updated password for ${outlet.name} (${outlet.outletEmail})`);
    }
    
    console.log('\n🎉 All outlet passwords have been updated!');
    console.log('You can now login with any of these credentials:');
    console.log('- rajkot@farmora.in / outlet123');
    console.log('- ahmedabad@farmora.in / outlet123');
    console.log('- surat@farmora.in / outlet123');
    console.log('- jaipur@farmora.in / outlet123');
    console.log('- mumbai@farmora.in / outlet123');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('MongoDB connection error:', error);
});
