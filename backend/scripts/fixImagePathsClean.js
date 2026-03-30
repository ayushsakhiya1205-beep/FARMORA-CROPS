const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Map products to their correct image paths with actual file names
const productImageMap = {
  'Wheat': '/image/grains/10wheat1.jpg',
  'Basmati Rice': '/image/grains/3basmatirice1.jpg',
  'White Rice': '/image/grains/12rice1.jpg',
  'Black Wheat': '/image/grains/4blackwheat1.jpg',
  'Jowar (Sorghum)': '/image/grains/6juwar1.jpg',
  'Bajra (Pearl Millet)': '/image/grains/2bajro1.jpg',
  'Ragi (Finger Millet)': '/image/grains/9ragi1.jpg',
  'Low Sugar Wheat': '/image/grains/7lowsugerwheat1.jpg',
  'Makai (Corn)': '/image/grains/8makai1.jpg',
  'Aeranda': '/image/grains/1aeranda1.jpg',
  'Toor Dal (Tuver Dal)': '/image/pulses/23tuverdal1.jpg',
  'Moong Dal': '/image/pulses/20mug1.jpg',
  'Masoor Dal': '/image/pulses/18masurdal1.jpg',
  'Urad Dal': '/image/pulses/24uraddal1.jpg',
  'Chana Dal': '/image/pulses/14chanadal1.jpg',
  'Rajma (Kidney Beans)': '/image/pulses/21rajma1.jpg',
  'Chana (Whole Chickpeas)': '/image/pulses/13chanabig1.jpg',
  'Mug': '/image/pulses/20mug1.jpg',
  'Mug Dal': '/image/pulses/19mugdal1.jpg',
  'Soybean': '/image/pulses/22soyabean1.jpg',
  'Val': '/image/pulses/25val1.jpg',
  'Vatana': '/image/pulses/25vatana1.jpg',
  'Chana Small': '/image/pulses/15chana1.jpg',
  'Chori': '/image/pulses/16chori1.jpg',
  'Jiru': '/image/pulses/17jiru1.jpg',
  'Sunflower Oil': '/image/oil/sunflower oil.jpg',
  'Corn Oil': '/image/oil/corn oil.jpg',
  'Mustard Oil (Sarsav Oil)': '/image/oil/sarsav oil.jpg',
  'Cottonseed Oil (Kapasiya Oil)': '/image/oil/kapasiya oil.jpg',
  'Groundnut Oil': '/image/oil/groundatnt oil.jpg',
  'Turmeric Powder': '/image/massala/turmeric powder.jpg',
  'Coriender Powder': '/image/massala/coriender powder.jpg',
  'Cumin Powder': '/image/massala/cumin powder.jpg',
  'Chilli Powder': '/image/massala/chilli powder.jpg',
  'Garam Masala': '/image/massala/Garam Masala.jpg',
  'Kitchen King Masala': '/image/massala/Kitchen King Masala.jpg',
  'Kashmiri Red Chilli Powder': '/image/massala/Kashmiri Red Chilli powder.jpg',
  'Amchur (Dried Mango Powder)': '/image/massala/Amchur.jpg',
  'Asafoetida (Hing)': '/image/massala/Asafoetida.jpg',
  'Rock Salt': '/image/massala/rocksalt.jpg',
  'Dhana (Coriander Seeds)': '/image/other/dhana.jpg',
  'Gud (Jaggery)': '/image/other/gud.jpg',
  'Honey': '/image/other/honey.jpg',
  'Peanuts': '/image/other/peanuts.jpg',
  'Rai (Mustard Seeds)': '/image/other/rai.jpg',
  'Tal (Sesame Seeds)': '/image/other/tal.jpg',
  'Variyali (Fennel Seeds)': '/image/other/variyali.jpg',
  'Sugar': '/image/other/suger.jpg',
  'Coffee': '/image/other/coffee.jpg',
  'Chai Patti': '/image/other/chaipatti.jpg',
  'Ghee': '/image/other/ghee.jpg'
};

async function fixImagePaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops');
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let updatedCount = 0;
    
    for (const product of products) {
      const imagePath = productImageMap[product.name];
      
      if (imagePath && product.image !== imagePath) {
        product.image = imagePath;
        await product.save();
        console.log(`✅ Updated ${product.name}: ${imagePath}`);
        updatedCount++;
      } else if (imagePath && product.image === imagePath) {
        console.log(`⏭️  Already correct: ${product.name}`);
      } else {
        console.log(`❌ No image mapping found for: ${product.name}`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} product image paths`);
    
  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixImagePaths();
