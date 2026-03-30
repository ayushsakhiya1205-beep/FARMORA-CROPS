// Quick test script to verify OTP functionality
const axios = require('axios');

async function testOTPFlow() {
  console.log('🧪 Testing OTP Flow...\n');
  
  try {
    // Step 1: Login attempt (should trigger OTP)
    console.log('1. Attempting login...');
    const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'test@example.com', // Replace with actual user email
      password: 'password123'    // Replace with actual password
    });
    
    if (loginResponse.data.requiresOtp) {
      console.log('✅ Login successful - OTP required');
      console.log('📧 Check your email OR console for OTP');
      
      // For demo, we'll show where to find the OTP
      console.log('\n🔐 Check the backend console for: "FALLBACK - OTP for email: XXXXXX"');
      
    } else {
      console.log('❌ Expected OTP requirement but got direct login');
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Invalid credentials - use a real user account');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

// Instructions
console.log('📋 OTP System Setup Complete!\n');
console.log('🔧 To configure real email sending:');
console.log('1. Follow EMAIL_SETUP.md guide');
console.log('2. Update .env with your Gmail credentials');
console.log('3. Restart the backend server\n');

console.log('🧪 To test the OTP flow:');
console.log('1. Run: node test-otp.js');
console.log('2. Or login via the frontend at http://localhost:3000');
console.log('3. Check console for OTP if email not configured\n');

testOTPFlow();
