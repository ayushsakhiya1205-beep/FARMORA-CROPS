const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testOutletDashboard() {
  console.log('🔍 TESTING OUTLET DASHBOARD');
  console.log('=============================\n');

  try {
    // Step 1: Login as Rajkot outlet
    console.log('📝 Step 1: Login as Rajkot Outlet');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'rajkot@farmora.in',
      password: 'Rajkot@123'
    });
    
    if (loginRes.data.success) {
      const token = loginRes.data.token;
      console.log('✅ Outlet Login Successful');
      console.log(`   User: ${loginRes.data.user.name}`);
      console.log(`   Role: ${loginRes.data.userType}`);
      
      // Step 2: Get outlet orders
      console.log('\n📝 Step 2: Get Outlet Orders');
      const ordersRes = await axios.get(`${API_URL}/api/outlet/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`✅ Found ${ordersRes.data.length} orders for Rajkot outlet:\n`);
      
      if (ordersRes.data.length === 0) {
        console.log('❌ No orders found - this is the issue!');
      } else {
        ordersRes.data.forEach((order, index) => {
          console.log(`${index + 1}. Order #${order._id.toString().slice(-8)}`);
          console.log(`   Customer: ${order.customerId?.name || 'Unknown'}`);
          console.log(`   Status: ${order.orderStatus}`);
          console.log(`   Total: ₹${order.totalAmount}`);
          console.log(`   Created: ${order.createdAt}`);
          console.log('---');
        });
      }
      
      // Step 3: Test with specific status
      console.log('\n📝 Step 3: Test Pending Orders');
      const pendingRes = await axios.get(`${API_URL}/api/outlet/orders?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`✅ Found ${pendingRes.data.length} pending orders`);
      
      // Step 4: Get outlet stats
      console.log('\n📝 Step 4: Get Outlet Stats');
      const statsRes = await axios.get(`${API_URL}/api/outlet/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Outlet Stats:', statsRes.data);
      
    } else {
      console.log('❌ Outlet Login Failed');
    }
    
    console.log('\n🎯 OUTLET DASHBOARD TEST COMPLETE');
    console.log('==================================');
    console.log('💡 If no orders are showing, the issue is in the outlet API routes');
    
  } catch (error) {
    console.error('❌ Outlet Dashboard Test Failed:', error.response?.data || error.message);
  }
}

testOutletDashboard().catch(console.error);
