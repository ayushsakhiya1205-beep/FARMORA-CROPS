const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testCompleteAuth() {
  console.log('🔍 FINAL AUTHENTICATION TEST');
  console.log('===============================\n');

  // Test Customer Login
  console.log('📝 Test Customer Login');
  try {
    const customerLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'vrajsanandiya111@gmail.com',
      password: 'Test12345'
    });
    console.log('✅ Customer Login SUCCESS!');
    console.log(`   User: ${customerLogin.data.user.name}`);
    console.log(`   Email: ${customerLogin.data.user.email}`);
    console.log(`   Role: ${customerLogin.data.userType}`);
    console.log(`   Token: ${customerLogin.data.token ? 'Generated' : 'Missing'}`);
  } catch (error) {
    console.log('❌ Customer Login FAILED:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test Outlet Login
  console.log('📝 Test Outlet Login');
  try {
    const outletLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'rajkot@farmora.in',
      password: 'Rajkot@123'
    });
    console.log('✅ Outlet Login SUCCESS!');
    console.log(`   User: ${outletLogin.data.user.name}`);
    console.log(`   Email: ${outletLogin.data.user.email}`);
    console.log(`   Role: ${outletLogin.data.userType}`);
    console.log(`   Token: ${outletLogin.data.token ? 'Generated' : 'Missing'}`);
  } catch (error) {
    console.log('❌ Outlet Login FAILED:', error.response?.data || error.message);
  }

  console.log('\n🎯 AUTHENTICATION TEST COMPLETE');
  console.log('=================================');
  console.log('💡 If both show SUCCESS, login should work in frontend!');
  console.log('🌐 Test in browser at: http://localhost:3000/login');
}

testCompleteAuth().catch(console.error);
