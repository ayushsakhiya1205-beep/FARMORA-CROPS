const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// All products that should be in the database with their details
const allProducts = [
  // Grains
  { name: 'Aeranda', category: 'grains', price: 50, unit: 'kg', image: '/image/grains/1aeranda1.jpg', description: 'Aeranda grain' },
  { name: 'Jau (Barley)', category: 'grains', price: 45, unit: 'kg', image: '/image/grains/5jau1.jpg', description: 'Barley grain' },
  { name: 'Makai (Corn)', category: 'grains', price: 40, unit: 'kg', image: '/image/grains/8makai1.jpg', description: 'Corn grain' },
  { name: 'Low Sugar Wheat', category: 'grains', price: 60, unit: 'kg', image: '/image/grains/7lowsugerwheat1.jpg', description: 'Low sugar wheat' },
  
  // Pulses
  { name: 'Chana', category: 'pulses', price: 80, unit: 'kg', image: '/image/pulses/15chana1.jpg', description: 'Whole chickpeas' },
  { name: 'Mug Dal', category: 'pulses', price: 90, unit: 'kg', image: '/image/pulses/19mugdal1.jpg', description: 'Moong dal' },
  { name: 'Soyabean', category: 'pulses', price: 70, unit: 'kg', image: '/image/pulses/22soyabean1.jpg', description: 'Soybeans' },
  { name: 'Vatana', category: 'pulses', price: 75, unit: 'kg', image: '/image/pulses/25vatana1.jpg', description: 'Green peas' },
  
  // Masala
  { name: 'Amchur', category: 'masala', price: 120, unit: 'kg', image: '/image/massala/Amchur.jpg', description: 'Dried mango powder' },
  { name: 'Asafoetida', category: 'masala', price: 300, unit: 'kg', image: '/image/massala/Asafoetida.jpg', description: 'Hing powder' },
  { name: 'Garam Masala', category: 'masala', price: 200, unit: 'kg', image: '/image/massala/Garam Masala.jpg', description: 'Garam masala blend' },
  { name: 'Kashmiri Red Chilli Powder', category: 'masala', price: 180, unit: 'kg', image: '/image/massala/Kashmiri Red Chilli powder.jpg', description: 'Kashmiri red chilli powder' },
  { name: 'Rock Salt', category: 'masala', price: 50, unit: 'kg', image: '/image/massala/rocksalt.jpg', description: 'Rock salt' },
  { name: 'Kitchen King Masala', category: 'masala', price: 220, unit: 'kg', image: '/image/massala/Kitchen King Masala.jpg', description: 'Kitchen king masala blend' },
  
  // Dryfruits
  { name: 'Akharot', category: 'dryfruits', price: 400, unit: 'kg', image: '/image/dryfruits/akharot.png', description: 'Carrot dryfruit' },
  { name: 'Anjeer', category: 'dryfruits', price: 350, unit: 'kg', image: '/image/dryfruits/anjeer.jpg', description: 'Figs' },
  { name: 'Aprikot', category: 'dryfruits', price: 380, unit: 'kg', image: '/image/dryfruits/aprikot.png', description: 'Apricots' },
  { name: 'Badam', category: 'dryfruits', price: 600, unit: 'kg', image: '/image/dryfruits/badam.jpg', description: 'Almonds' },
  { name: 'Black Kishmis', category: 'dryfruits', price: 320, unit: 'kg', image: '/image/dryfruits/black kishmis.png', description: 'Black raisins' },
  { name: 'Kaju', category: 'dryfruits', price: 700, unit: 'kg', image: '/image/dryfruits/kaju.jpg', description: 'Cashews' },
  { name: 'Khajoor', category: 'dryfruits', price: 280, unit: 'kg', image: '/image/dryfruits/khajoor.jpg', description: 'Dates' },
  { name: 'Kismis', category: 'dryfruits', price: 300, unit: 'kg', image: '/image/dryfruits/kismis.jpg', description: 'Raisins' },
  { name: 'Pista', category: 'dryfruits', price: 800, unit: 'kg', image: '/image/dryfruits/pista.png', description: 'Pistachios' },
  
  // Others
  { name: 'Chaipatti', category: 'others', price: 150, unit: 'kg', image: '/image/other/chaipatti.jpg', description: 'Tea leaves' },
  { name: 'Coffee', category: 'others', price: 250, unit: 'kg', image: '/image/other/coffee.jpg', description: 'Coffee powder' },
  { name: 'Ghee', category: 'others', price: 450, unit: 'kg', image: '/image/other/ghee.jpg', description: 'Clarified butter' },
  { name: 'Suger', category: 'others', price: 40, unit: 'kg', image: '/image/other/suger.jpg', description: 'Sugar' }
];

async function addMissingProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops');
    console.log('Connected to MongoDB');

    const existingProducts = await Product.find({});
    console.log(`Found ${existingProducts.length} existing products`);

    let addedCount = 0;
    
    for (const productData of allProducts) {
      const existingProduct = existingProducts.find(p => p.name === productData.name);
      
      if (!existingProduct) {
        const newProduct = new Product(productData);
        await newProduct.save();
        console.log(`✅ Added: ${productData.name} (${productData.category})`);
        addedCount++;
      } else {
        console.log(`⏭️  Already exists: ${productData.name}`);
      }
    }

    console.log(`\n🎉 Added ${addedCount} new products to database`);
    
  } catch (error) {
    console.error('❌ Error adding products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addMissingProducts();
