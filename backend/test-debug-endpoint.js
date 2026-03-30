const http = require('http');

const orderData = {
  order: {
    _id: "TEST123",
    createdAt: new Date(),
    orderStatus: "confirmed",
    items: [
      { name: "Test Product", quantity: 1, price: 1000 }
    ],
    totalAmount: 1000,
    finalAmount: 1000,
    paymentMethod: "cod",
    deliveryAddress: {
      address: "Test Address",
      district: "Rajkot",
      state: "Gujarat",
      pincode: "360001",
      phone: "+91-9876543210"
    }
  },
  user: {
    name: "Test User",
    email: "ayushsakhiya1205@gmail.com"
  }
};

const postData = JSON.stringify(orderData);

const options = {
  hostname: 'localhost',
  port: 8001,
  path: '/debug-order-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`📧 Status: ${res.statusCode}`);
  console.log(`📊 Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response:');
    console.log(JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(postData);
req.end();

console.log('🔍 Testing debug endpoint with order data...');
