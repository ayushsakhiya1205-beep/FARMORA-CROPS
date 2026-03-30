const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Map products to their correct image paths with subdirectories
const productImageMap = {
  'Wheat': '/image/anaj/wheat.jpg',
  'Basmati Rice': '/image/anaj/basmati rice.jpg',
  'White Rice': '/image/anaj/white rice.jpg',
  'Black Wheat': '/image/anaj/black wheat.jpg',
  'Jowar (Sorghum)': '/image/anaj/juvar.jpg',
  'Bajra (Pearl Millet)': '/image/anaj/bajro.jpg',
  'Ragi (Finger Millet)': '/image/anaj/ragi.jpg',
  'Toor Dal (Tuver Dal)': '/image/kathol/tuver dal.jpg',
  'Moong Dal': '/image/kathol/mug dal.jpg',
  'Masoor Dal': '/image/kathol/masur dal.jpg',
  'Urad Dal': '/image/kathol/urad dal.jpg',
  'Chana Dal': '/image/kathol/chana dal.jpg',
  'Rajma (Kidney Beans)': '/image/kathol/rajma.jpg',
  'Chana (Whole Chickpeas)': '/image/kathol/chana.jpg',
  'Sunflower Oil': '/image/oil/sunflower oil.jpg',
  'Corn Oil': '/image/oil/corn oil.jpg',
  'Mustard Oil (Sarsav Oil)': '/image/oil/mustard oil.jpg',
  'Cottonseed Oil (Kapasiya Oil)': '/image/oil/cottonseed oil.jpg',
  'Groundnut Oil': '/image/oil/groundnut oil.jpg',
  'Turmeric Powder': '/image/massala/turmeric powder.jpg',
  'Coriander Powder': '/image/massala/coriander powder.jpg',
  'Cumin Powder': '/image/massala/jeeru powder.jpg',
  'Red Chilli Powder': '/image/massala/red chilli powder.jpg',
  'Peanuts': '/image/other/peanuts.jpg',
  'Honey': '/image/other/honey.jpg',
  'Jaggery (Gud)': '/image/other/jaggery.jpg',
  'Coriander Seeds (Dhana)': '/image/massala/coriander seeds.jpg',
  'Mustard Seeds (Rai)': '/image/massala/mustard seeds.jpg',
  'Sesame Seeds (Tal)': '/image/massala/sesame seeds.jpg',
  'Fennel Seeds (Variyali)': '/image/massala/fennel seeds.jpg'
};

const fixProductImagePaths = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to update`);

    let updatedCount = 0;

    for (const product of products) {
      const correctImage = productImageMap[product.name];
      
      if (correctImage && product.image !== correctImage) {
        await Product.findByIdAndUpdate(product._id, { image: correctImage });
        console.log(`✅ Updated ${product.name}: ${product.image} → ${correctImage}`);
        updatedCount++;
      } else if (correctImage && product.image === correctImage) {
        console.log(`ℹ️  ${product.name} already has correct image`);
      } else {
        console.log(`⚠️  No image mapping found for ${product.name}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} product image paths!`);
    
    // Show final result
    const finalProducts = await Product.find({});
    console.log('\n📋 Final Product Image Paths:');
    finalProducts.forEach(p => {
      console.log(`📦 ${p.name}: ${p.image}`);
    });

  } catch (error) {
    console.error('❌ Error fixing product image paths:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixProductImagePaths();
