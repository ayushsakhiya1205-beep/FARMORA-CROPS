const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function debugToken() {
  console.log('🔍 DEBUGGING TOKEN CONTENTS');
  console.log('============================\n');

  try {
    // Step 1: Login as Rajkot outlet
    console.log('📝 Step 1: Login as Rajkot Outlet');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'rajkot@farmora.in',
      password: 'Rajkot@123'
    });
    
    if (loginRes.data.success) {
      const token = loginRes.data.token;
      console.log('✅ Login Successful');
      console.log(`   Token: ${token.substring(0, 50)}...`);
      
      // Decode token to see contents
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('\n📝 Step 2: Token Contents');
      console.log(`   userId: ${decoded.userId}`);
      console.log(`   role: ${decoded.role}`);
      console.log(`   userType: ${decoded.userType}`);
      console.log(`   state: ${decoded.state}`);
      console.log(`   district: ${decoded.district}`);
      
      // Step 3: Test API call with token
      console.log('\n📝 Step 3: Test API Call');
      try {
        const ordersRes = await axios.get(`${API_URL}/api/outlet/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ API Success: Found ${ordersRes.data.length} orders`);
      } catch (error) {
        console.log('❌ API Failed:', error.response?.data);
      }
      
    } else {
      console.log('❌ Login Failed');
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.response?.data || error.message);
  }
}

debugToken().catch(console.error);
