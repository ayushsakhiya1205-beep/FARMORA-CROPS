const http = require('http');

// Test OTP request with simple test user credentials
const testData = {
  email: 'simple@test.com',
  password: 'password123'
};

const postData = JSON.stringify(testData);

console.log('Testing OTP request flow with valid credentials...');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/request-login-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed Response:', JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success && jsonData.otp) {
        console.log(`\n✅ OTP Generated: ${jsonData.otp}`);
        console.log('✅ OTP flow is working correctly!');
        console.log('✅ User can now enter this OTP to complete login.');
        
        // Test OTP verification
        testOTPVerification(jsonData.otp);
      } else {
        console.log('❌ OTP generation failed');
      }
    } catch (e) {
      console.log('Non-JSON Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();

console.log('Sending OTP request for:', testData.email);

// Test OTP verification
function testOTPVerification(otp) {
  console.log('\nTesting OTP verification...');
  
  const verifyData = {
    email: 'simple@test.com',
    otp: otp
  };
  
  const verifyPostData = JSON.stringify(verifyData);
  
  const verifyOptions = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/auth/verify-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(verifyPostData)
    }
  };
  
  const verifyReq = http.request(verifyOptions, (res) => {
    console.log(`\nOTP Verification Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('OTP Verification Response:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed OTP Verification Response:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.success) {
          console.log('\n🎉 Complete OTP login flow successful!');
          console.log('✅ User authenticated successfully');
          console.log('✅ Token generated and user data returned');
        } else {
          console.log('❌ OTP verification failed');
        }
      } catch (e) {
        console.log('Non-JSON Response:', data);
      }
    });
  });
  
  verifyReq.on('error', (error) => {
    console.error('OTP Verification Error:', error.message);
  });
  
  verifyReq.write(verifyPostData);
  verifyReq.end();
}
