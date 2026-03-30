const mongoose = require('mongoose');
const User = require('./models/User');
const Outlet = require('./models/Outlet');
const Order = require('./models/Order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔍 DEBUGGING ORDER ASSIGNMENT');
    console.log('===============================\n');
    
    // Step 1: Find the Rajkot outlet
    console.log('📝 Step 1: Find Rajkot Outlet');
    const rajkotOutlet = await Outlet.findOne({ 
      'address.district': 'Rajkot',
      isActive: true 
    });
    
    if (rajkotOutlet) {
      console.log('✅ Rajkot Outlet Found:');
      console.log(`   Name: ${rajkotOutlet.name}`);
      console.log(`   Email: ${rajkotOutlet.outletEmail}`);
      console.log(`   District: ${rajkotOutlet.address.district}`);
      console.log(`   ID: ${rajkotOutlet._id}`);
      console.log(`   Active: ${rajkotOutlet.isActive}`);
    } else {
      console.log('❌ Rajkot Outlet NOT found');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Find recent customer orders
    console.log('📝 Step 2: Find Recent Customer Orders');
    const recentOrders = await Order.find({ 
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${recentOrders.length} recent orders:\n`);
    
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order._id.toString().slice(-8)}`);
      console.log(`   Customer: ${order.customerId}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Outlet ID: ${order.outletId}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log('---');
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 3: Check customer details for orders
    console.log('📝 Step 3: Check Customer Details');
    for (const order of recentOrders) {
      const customer = await User.findById(order.customerId);
      if (customer) {
        console.log(`Order #${order._id.toString().slice(-8)} Customer:`);
        console.log(`   Name: ${customer.name}`);
        console.log(`   Email: ${customer.email}`);
        console.log(`   District: ${customer.district}`);
        console.log(`   State: ${customer.state}`);
        console.log(`   Active: ${customer.isActive}`);
        console.log('---');
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 4: Check if orders are assigned to correct outlet
    console.log('📝 Step 4: Check Order Assignment');
    for (const order of recentOrders) {
      const customer = await User.findById(order.customerId);
      if (customer && rajkotOutlet) {
        const shouldAssignToRajkot = customer.district === 'Rajkot';
        const isAssignedToRajkot = order.outletId && order.outletId.toString() === rajkotOutlet._id.toString();
        
        console.log(`Order #${order._id.toString().slice(-8)}:`);
        console.log(`   Customer District: ${customer.district}`);
        console.log(`   Should be Rajkot: ${shouldAssignToRajkot}`);
        console.log(`   Currently assigned to Rajkot: ${isAssignedToRajkot}`);
        console.log(`   Current Outlet ID: ${order.outletId}`);
        
        if (shouldAssignToRajkot && !isAssignedToRajkot) {
          console.log(`   🔧 NEEDS FIX: Should be assigned to Rajkot outlet`);
        }
        console.log('---');
      }
    }
    
    console.log('\n🎯 DEBUG COMPLETE');
    console.log('==================');
    console.log('💡 If orders are not assigned to Rajkot, we need to fix the assignment logic');
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
