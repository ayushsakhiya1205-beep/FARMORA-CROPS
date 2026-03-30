const mongoose = require('mongoose');
const Order = require('./models/Order');
const Outlet = require('./models/Outlet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔧 FIXING ORDER ASSIGNMENT');
    console.log('============================\n');
    
    // Step 1: Get the problematic order
    console.log('📦 Step 1: Finding the order...');
    const order = await Order.findOne({ 
      customerId: '6965204e7315854fb08740d2' // vraj sanandiya's customer ID
    });
    
    if (!order) {
      console.log('❌ No order found for customer vraj sanandiya');
      return;
    }
    
    console.log('✅ Found order:');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Current Outlet: ${order.outletId}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ₹${order.totalAmount}`);
    
    // Step 2: Get correct Rajkot outlet
    console.log('\n🏪 Step 2: Getting correct Rajkot outlet...');
    const rajkotOutlet = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in',
      isActive: true 
    });
    
    if (!rajkotOutlet) {
      console.log('❌ Rajkot outlet not found');
      return;
    }
    
    console.log('✅ Found correct Rajkot outlet:');
    console.log(`   Outlet ID: ${rajkotOutlet._id}`);
    console.log(`   Outlet Name: ${rajkotOutlet.name}`);
    
    // Step 3: Update the order with correct outlet
    console.log('\n🔄 Step 3: Updating order assignment...');
    
    order.outletId = rajkotOutlet._id;
    order.status = 'pending'; // Set proper status
    await order.save();
    
    console.log('✅ Order updated successfully!');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   New Outlet: ${order.outletId}`);
    console.log(`   New Status: ${order.status}`);
    
    // Step 4: Verify the fix
    console.log('\n✅ Step 4: Verifying the fix...');
    const updatedOrder = await Order.findById(order._id);
    const rajkotOrders = await Order.find({ 
      outletId: rajkotOutlet._id 
    });
    
    console.log(`✅ Rajkot outlet now has ${rajkotOrders.length} orders`);
    console.log(`✅ Order status is now: ${updatedOrder.status}`);
    
    console.log('\n🎯 ORDER ASSIGNMENT FIXED!');
    console.log('============================');
    console.log('The order is now properly assigned to Rajkot outlet.');
    console.log('Login to Rajkot outlet dashboard to see the order.');
    console.log('\n📋 Login Credentials:');
    console.log('Email: rajkot@farmora.in');
    console.log('Password: Rajkot@123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
