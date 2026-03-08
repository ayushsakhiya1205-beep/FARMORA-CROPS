const mongoose = require('mongoose');
const Order = require('./models/Order');
const Outlet = require('./models/Outlet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔍 DEBUGGING ORDER ASSIGNMENT ISSUE');
    console.log('=====================================\n');
    
    // Step 1: Find the customer vraj sanandiya
    console.log('📝 Step 1: Finding customer vraj sanandiya...');
    const customer = await User.findOne({ 
      $or: [
        { name: /vraj sanandiya/i },
        { email: /vraj sanandiya/i }
      ]
    });
    
    if (customer) {
      console.log('✅ Found customer:');
      console.log(`   Name: ${customer.name}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   District: ${customer.district}`);
      console.log(`   State: ${customer.state}`);
    } else {
      console.log('❌ Customer vraj sanandiya not found');
      console.log('📋 Available customers:');
      const allCustomers = await User.find({ role: 'customer' }).limit(5);
      allCustomers.forEach(c => {
        console.log(`   - ${c.name} (${c.email}) - District: ${c.district}`);
      });
    }
    
    // Step 2: Find Rajkot outlet
    console.log('\n🏪 Step 2: Finding Rajkot outlet...');
    const rajkotOutlet = await Outlet.findOne({ 
      outletEmail: 'rajkot@farmora.in',
      isActive: true 
    });
    
    if (rajkotOutlet) {
      console.log('✅ Found Rajkot outlet:');
      console.log(`   ID: ${rajkotOutlet._id}`);
      console.log(`   Name: ${rajkotOutlet.name}`);
      console.log(`   Email: ${rajkotOutlet.outletEmail}`);
      console.log(`   District: ${rajkotOutlet.address.district}`);
    } else {
      console.log('❌ Rajkot outlet not found');
    }
    
    // Step 3: Check all orders
    console.log('\n📦 Step 3: Checking all orders...');
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${allOrders.length} recent orders:\n`);
    
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order._id}`);
      console.log(`   Customer: ${order.customerId}`);
      console.log(`   Outlet: ${order.outletId}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log('---');
    });
    
    // Step 4: Check orders assigned to Rajkot outlet specifically
    console.log('\n🎯 Step 4: Orders assigned to Rajkot outlet...');
    const rajkotOrders = await Order.find({ 
      outletId: rajkotOutlet?._id 
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${rajkotOrders.length} orders for Rajkot outlet:\n`);
    
    rajkotOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order._id}`);
      console.log(`   Customer: ${order.customerId}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log(`   Items: ${order.items?.length || 0}`);
      console.log('---');
    });
    
    // Step 5: Check orders by customer vraj sanandiya
    if (customer) {
      console.log('\n👤 Step 5: Orders by customer vraj sanandiya...');
      const customerOrders = await Order.find({ 
        customerId: customer._id 
      }).sort({ createdAt: -1 });
      
      console.log(`Found ${customerOrders.length} orders by this customer:\n`);
      
      customerOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id}`);
        console.log(`   Assigned Outlet: ${order.outletId}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ₹${order.totalAmount}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log('---');
      });
    }
    
    console.log('\n🔧 DIAGNOSIS:');
    if (customer && rajkotOutlet) {
      const customerDistrict = customer.district?.toLowerCase();
      const outletDistrict = rajkotOutlet.address.district?.toLowerCase();
      
      console.log(`Customer District: ${customerDistrict}`);
      console.log(`Outlet District: ${outletDistrict}`);
      console.log(`Districts Match: ${customerDistrict === outletDistrict ? '✅ YES' : '❌ NO'}`);
      
      if (customerDistrict === outletDistrict) {
        console.log('✅ Order should be assigned to Rajkot outlet');
      } else {
        console.log('❌ Order assignment issue: Districts don\'t match');
        console.log('💡 This is why Rajkot outlet doesn\'t see the order');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
