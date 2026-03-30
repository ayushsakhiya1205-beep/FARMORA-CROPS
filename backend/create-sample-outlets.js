const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Outlet = require('./models/Outlet');
const User = require('./models/User');

// Sample outlets data
const sampleOutlets = [
  {
    name: 'Rajkot Farmora Outlet',
    outletEmail: 'rajkot@farmora.in',
    password: 'outlet123',
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
    password: 'outlet123',
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
    password: 'outlet123',
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
    password: 'outlet123',
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
    password: 'outlet123',
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

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find or create a dummy manager user
    let managerUser = await User.findOne({ email: 'manager@farmora.in' });
    if (!managerUser) {
      managerUser = new User({
        name: 'Outlet Manager',
        email: 'manager@farmora.in',
        password: 'manager123',
        phone: '9999999999',
        state: 'Gujarat',
        district: 'Rajkot',
        address: 'Manager Office',
        pincode: '360001',
        role: 'outletManager',
        emailVerified: true
      });
      await managerUser.save();
      console.log('Created manager user: manager@farmora.in / manager123');
    }
    
    // Clear existing outlets (optional - comment out if you want to keep existing)
    await Outlet.deleteMany({});
    console.log('Cleared existing outlets');
    
    // Insert sample outlets with managerId
    const outletsWithManager = sampleOutlets.map(outlet => ({
      ...outlet,
      managerId: managerUser._id
    }));
    
    const insertedOutlets = await Outlet.insertMany(outletsWithManager);
    console.log('Sample outlets created successfully:');
    insertedOutlets.forEach(outlet => {
      console.log(`- ${outlet.name}: ${outlet.outletEmail} (Password: outlet123)`);
    });
    
    console.log('\nYou can now test outlet login with these credentials:');
    console.log('Email: rajkot@farmora.in, Password: outlet123');
    console.log('Email: ahmedabad@farmora.in, Password: outlet123');
    console.log('Email: surat@farmora.in, Password: outlet123');
    console.log('Email: jaipur@farmora.in, Password: outlet123');
    console.log('Email: mumbai@farmora.in, Password: outlet123');
    
  } catch (error) {
    console.error('Error creating sample outlets:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('MongoDB connection error:', error);
});
