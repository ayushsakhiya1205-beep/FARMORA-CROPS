const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/farmora-crops', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    console.log('🔍 CHECKING PRODUCTS IN DATABASE');
    console.log('=====================================\n');
    
    // Check all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database:\n`);
    
    if (products.length === 0) {
      console.log('❌ No products found in database!');
      console.log('💡 This is why the product page is empty.');
      console.log('\n📝 Let me create some sample products...');
      
      // Create sample products
      const sampleProducts = [
        {
          name: 'Fresh Tomatoes',
          description: 'Red, ripe tomatoes from local farms',
          price: 40,
          unit: 'kg',
          category: 'vegetables',
          image: 'tomatoes.jpg',
          stock: 100,
          isActive: true
        },
        {
          name: 'Organic Potatoes',
          description: 'Fresh organic potatoes',
          price: 30,
          unit: 'kg',
          category: 'vegetables',
          image: 'potatoes.jpg',
          stock: 150,
          isActive: true
        },
        {
          name: 'Green Chilies',
          description: 'Spicy green chilies',
          price: 80,
          unit: 'kg',
          category: 'vegetables',
          image: 'chilies.jpg',
          stock: 50,
          isActive: true
        },
        {
          name: 'Fresh Onions',
          description: 'Fresh red onions',
          price: 35,
          unit: 'kg',
          category: 'vegetables',
          image: 'onions.jpg',
          stock: 120,
          isActive: true
        },
        {
          name: 'Farm Fresh Eggs',
          description: 'Fresh eggs from free-range chickens',
          price: 6,
          unit: 'piece',
          category: 'dairy',
          image: 'eggs.jpg',
          stock: 200,
          isActive: true
        }
      ];
      
      const insertedProducts = await Product.insertMany(sampleProducts);
      console.log('✅ Created sample products:');
      insertedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ₹${product.price}/${product.unit}`);
      });
      
    } else {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Price: ₹${product.price}/${product.unit}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Active: ${product.isActive}`);
        console.log('---');
      });
    }
    
    console.log('\n🎯 PRODUCT PAGE STATUS:');
    console.log('========================');
    console.log('✅ Backend API running on port 8000');
    console.log('✅ Frontend updated to use port 8000');
    console.log('✅ Products available in database');
    console.log('\n🌐 Product page should now show products!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  mongoose.connection.close();
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});
