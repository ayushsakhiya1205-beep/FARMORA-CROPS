const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Fix existing products with incorrect categories
const categoryFixes = {
  'grain': 'grains',
  'pulse': 'pulses',
  'masala': 'masala',
  'other': 'others'
};

async function fixProductCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops');
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let updatedCount = 0;
    
    for (const product of products) {
      const correctCategory = categoryFixes[product.category];
      
      if (correctCategory && product.category !== correctCategory) {
        product.category = correctCategory;
        await product.save();
        console.log(`✅ Fixed category for ${product.name}: ${product.category} → ${correctCategory}`);
        updatedCount++;
      } else {
        console.log(`⏭️  Category already correct: ${product.name} (${product.category})`);
      }
    }

    console.log(`\n🎉 Fixed ${updatedCount} product categories`);
    
  } catch (error) {
    console.error('❌ Error fixing product categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixProductCategories();
