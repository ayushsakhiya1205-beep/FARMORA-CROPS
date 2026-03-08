const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Outlet = require('./models/Outlet');
const User = require('./models/User');

// Complete Outlet Setup Guide
console.log('🏪 FARMORA OUTLET SETUP GUIDE');
console.log('================================\n');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    // Step 1: Create Manager User (required for outlets)
    console.log('📝 Step 1: Creating Manager User...');
    let managerUser = await User.findOne({ email: 'admin@farmora.in' });
    
    if (!managerUser) {
      managerUser = new User({
        name: 'Farmora Admin',
        email: 'admin@farmora.in',
        password: 'Admin123',
        phone: '9999999999',
        state: 'Gujarat',
        district: 'Rajkot',
        address: 'Farmora Headquarters',
        pincode: '360001',
        role: 'outletManager',
        emailVerified: true
      });
      await managerUser.save();
      console.log('✅ Created manager: admin@farmora.in / Admin123');
    } else {
      console.log('✅ Manager already exists: admin@farmora.in');
    }
    
    // Step 2: Clear existing outlets
    console.log('\n🗑️ Step 2: Clearing existing outlets...');
    await Outlet.deleteMany({});
    console.log('✅ Cleared all existing outlets');
    
    // Step 3: Create outlets with different passwords
    console.log('\n🏪 Step 3: Creating Outlets with Different Passwords...');
    
    const outletsData = [
      {
        name: 'Rajkot Farmora Outlet',
        outletEmail: 'rajkot@farmora.in',
        password: 'Rajkot@123',
        address: {
          street: 'Main Road, Rajkot',
          city: 'Rajkot',
          state: 'Gujarat',
          district: 'Rajkot',
          pincode: '360001',
          landmark: 'Near City Center'
        },
        phone: '9876543210'
      },
      {
        name: 'Ahmedabad Farmora Outlet',
        outletEmail: 'ahmedabad@farmora.in',
        password: 'Ahmedabad@123',
        address: {
          street: 'CG Road, Ahmedabad',
          city: 'Ahmedabad',
          state: 'Gujarat',
          district: 'Ahmedabad',
          pincode: '380001',
          landmark: 'Near Mall'
        },
        phone: '9876543211'
      },
      {
        name: 'Surat Farmora Outlet',
        outletEmail: 'surat@farmora.in',
        password: 'Surat@123',
        address: {
          street: 'Varachha Road, Surat',
          city: 'Surat',
          state: 'Gujarat',
          district: 'Surat',
          pincode: '395001',
          landmark: 'Near Railway Station'
        },
        phone: '9876543212'
      },
      {
        name: 'Jaipur Farmora Outlet',
        outletEmail: 'jaipur@farmora.in',
        password: 'Jaipur@123',
        address: {
          street: 'MI Road, Jaipur',
          city: 'Jaipur',
          state: 'Rajasthan',
          district: 'Jaipur',
          pincode: '302001',
          landmark: 'Near Bus Stand'
        },
        phone: '9876543213'
      },
      {
        name: 'Mumbai Farmora Outlet',
        outletEmail: 'mumbai@farmora.in',
        password: 'Mumbai@123',
        address: {
          street: 'Linking Road, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'Mumbai',
          pincode: '400001',
          landmark: 'Near Bandra'
        },
        phone: '9876543214'
      }
    ];
    
    // Step 4: Save outlets to database
    console.log('\n💾 Step 4: Saving outlets to database...');
    
    for (const outletData of outletsData) {
      const outlet = new Outlet({
        ...outletData,
        managerId: managerUser._id
      });
      
      await outlet.save();
      console.log(`✅ Created: ${outlet.name}`);
      console.log(`   📧 Email: ${outlet.outletEmail}`);
      console.log(`   🔑 Password: ${outletData.password}`);
      console.log(`   📱 Phone: ${outlet.phone}`);
      console.log(`   📍 District: ${outlet.address.district}, ${outlet.address.state}`);
      console.log('---');
    }
    
    // Step 5: Show login instructions
    console.log('\n🎯 LOGIN INSTRUCTIONS');
    console.log('==================\n');
    console.log('You can now login with these outlet credentials:\n');
    
    outletsData.forEach((outlet, index) => {
      console.log(`${index + 1}. ${outlet.name}`);
      console.log(`   Email: ${outlet.outletEmail}`);
      console.log(`   Password: ${outlet.password}`);
      console.log('');
    });
    
    console.log('📋 HOW TO ADD NEW OUTLETS MANUALLY:');
    console.log('=====================================');
    console.log('1. Connect to MongoDB: mongo');
    console.log('2. Switch to database: use farmora-crops');
    console.log('3. Insert outlet:');
    console.log(`
db.outlets.insertOne({
  name: "Your Outlet Name",
  outletEmail: "district@farmora.in",
  password: "YourPassword123",
  address: {
    street: "Street Address",
    city: "City Name",
    state: "Gujarat|Rajasthan|Maharashtra",
    district: "District Name",
    pincode: "123456",
    landmark: "Landmark"
  },
  phone: "9876543210",
  managerId: ObjectId("MANAGER_USER_ID"),
  isActive: true
});
    `);
    
    console.log('\n🎉 OUTLET SETUP COMPLETE!');
    console.log('All outlets are ready for login.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
