const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testAuth() {
  console.log('🔍 TESTING AUTHENTICATION ENDPOINTS');
  console.log('====================================\n');

  // Test 1: Customer Login
  console.log('📝 Test 1: Customer Login');
  try {
    const customerLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'vraj.sanandiya@example.com',
      password: 'Test123'
    });
    console.log('✅ Customer Login Success:', customerLogin.data);
  } catch (error) {
    console.log('❌ Customer Login Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Outlet Login
  console.log('📝 Test 2: Outlet Login');
  try {
    const outletLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'rajkot@farmora.in',
      password: 'Rajkot@123'
    });
    console.log('✅ Outlet Login Success:', outletLogin.data);
  } catch (error) {
    console.log('❌ Outlet Login Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Customer Signup
  console.log('📝 Test 3: Customer Signup');
  try {
    const customerSignup = await axios.post(`${API_URL}/api/auth/signup`, {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Test123',
      phone: '9876543210',
      state: 'Gujarat',
      district: 'Rajkot',
      address: 'Test Address',
      pincode: '360001'
    });
    console.log('✅ Customer Signup Success:', customerSignup.data);
  } catch (error) {
    console.log('❌ Customer Signup Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Check existing users
  console.log('📝 Test 4: Check Existing Users');
  try {
    const users = await axios.get(`${API_URL}/api/auth/users`);
    console.log('✅ Users Found:', users.data.length);
    users.data.slice(0, 3).forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
  } catch (error) {
    console.log('❌ Get Users Failed:', error.response?.data || error.message);
  }

  console.log('\n🎯 AUTHENTICATION TEST COMPLETE');
  console.log('================================');
}

testAuth().catch(console.error);
