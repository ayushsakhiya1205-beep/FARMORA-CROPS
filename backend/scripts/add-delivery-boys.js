const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');
const Outlet = require('../models/Outlet');

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops';

const names = ["Aman Sharma", "Ravi Patel", "Suresh Kumar", "Vikram Singh", "Amit Yadav", 
               "Rahul Verma", "Deepak Gupta", "Sunil Joshi", "Manish Tiwari", "Anil Chauhan"];
const vehicles = ['Bike', 'Scooter', 'Tempo', 'Truck', 'Van'];

async function addDeliveryBoys() {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB');

    const outlets = await Outlet.find({});
    if(outlets.length === 0) {
      console.log('No outlets found. Add an outlet first.');
      process.exit(1);
    }

    // Default to the first outlet if multiple exist
    const targetOutlet = outlets[0]; 
    
    // Clear old sample delivery boys if they exist
    await User.deleteMany({ role: 'delivery_boy' });

    const newUsers = names.map((name, index) => {
      return {
        name,
        email: `driver${index+1}@farmora.in`,
        password: 'password123', // Will be hashed via pre-save hook
        phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: `123 Main Street, Sector ${index+1}`,
        pincode: '380015',
        state: 'Gujarat',
        district: targetOutlet.district || 'Ahmedabad',
        role: 'delivery_boy',
        outletId: targetOutlet._id,
        vehicle: vehicles[index % vehicles.length],
        available: true,
        isActive: true,
      }
    });

    for(let user of newUsers) {
      await User.create(user);
    }
    console.log('10 Delivery boys added successfully with varying vehicles to outlet:', targetOutlet._id);
    process.exit(0);
  } catch (error) {
    console.error('Error adding delivery boys:', error);
    process.exit(1);
  }
}

addDeliveryBoys();
