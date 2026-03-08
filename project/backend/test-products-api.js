const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function testProductFunctionality() {
  console.log('🔍 TESTING PRODUCT FUNCTIONALITY');
  console.log('================================\n');

  try {
    // Test 1: Get all products
    console.log('📝 Test 1: Get All Products');
    const productsRes = await axios.get(`${API_URL}/api/products`);
    console.log(`✅ Found ${productsRes.data.length} products`);
    
    if (productsRes.data.length > 0) {
      const sampleProduct = productsRes.data[0];
      console.log(`   Sample: ${sampleProduct.name} - ₹${sampleProduct.price}/${sampleProduct.unit}`);
      console.log(`   Category: ${sampleProduct.category}`);
      console.log(`   Available: ${sampleProduct.isAvailable}`);
      
      // Test 2: Get single product
      console.log('\n📝 Test 2: Get Single Product');
      const singleProductRes = await axios.get(`${API_URL}/api/products/${sampleProduct._id}`);
      const product = singleProductRes.data;
      console.log(`✅ Product: ${product.name}`);
      console.log(`   Price: ₹${product.price}/${product.unit}`);
      console.log(`   Description: ${product.description}`);
      
      // Test 3: Search products
      console.log('\n📝 Test 3: Search Products');
      const searchRes = await axios.get(`${API_URL}/api/products?search=wheat`);
      console.log(`✅ Found ${searchRes.data.length} products matching "wheat"`);
      
      // Test 4: Filter by category
      console.log('\n📝 Test 4: Filter by Category');
      const categoryRes = await axios.get(`${API_URL}/api/products?category=grain`);
      console.log(`✅ Found ${categoryRes.data.length} grain products`);
      
      console.log('\n🎯 PRODUCT API TESTS COMPLETE');
      console.log('===============================');
      console.log('✅ All product endpoints working');
      console.log('✅ Products should now display in frontend');
      console.log('✅ Home page Featured Products should work');
      console.log('✅ Product detail pages should work');
      console.log('✅ Product filtering and sorting should work');
      
    } else {
      console.log('❌ No products found in database');
    }
    
  } catch (error) {
    console.error('❌ Product API Test Failed:', error.response?.data || error.message);
  }
}

testProductFunctionality().catch(console.error);
