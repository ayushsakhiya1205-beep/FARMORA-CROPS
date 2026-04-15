const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Product = require('../models/Product');

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmora-crops';

async function migrate() {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to DB');

    // Access raw collection to bypass any strict schema rules
    const inventoriesCol = mongoose.connection.collection('inventories');
    const items = await inventoriesCol.find({}).toArray();
    
    console.log(`Found ${items.length} inventory documents.`);

    for (let item of items) {
      if (item.stock === undefined && item.productName && item.category && typeof item.productId === 'string') {
         continue; // already strictly migrated
      }

      console.log(`Processing item _id: ${item._id}`);
      const productIdStr = item.productId ? item.productId.toString() : null;
      let targetQ = item.quantity !== undefined && !isNaN(item.quantity) ? item.quantity : (item.stock || 0);
      
      let product = null;
      if (productIdStr) {
         try {
           product = await Product.findById(productIdStr);
         } catch(e) {}
      }

      const updates = {
         quantity: targetQ,
         productName: item.productName || (product ? product.name : 'Unknown Product'),
         category: item.category || (product ? product.category : 'grains'),
         unit: item.unit || (product ? product.unit : 'kg'),
         productId: productIdStr
      };

      // Check if another document ALREADY exists with the same string productId and outletId
      const existingNewFormat = await inventoriesCol.findOne({
          _id: { $ne: item._id },
          productId: productIdStr,
          outletId: item.outletId
      });

      if (existingNewFormat) {
          console.log(`Duplicate found! _id: ${item._id} conflicts with ${existingNewFormat._id}. Deleting old doc and merging quantities...`);
          // Add old quantity to the new document
          const finalQuantity = (existingNewFormat.quantity || existingNewFormat.stock || 0) + targetQ;
          await inventoriesCol.updateOne({ _id: existingNewFormat._id }, { $set: { quantity: finalQuantity } });
          // Delete this item
          await inventoriesCol.deleteOne({ _id: item._id });
      } else {
          // If no duplicate, just update this one
          await inventoriesCol.updateOne({ _id: item._id }, {
              $set: updates,
              $unset: { stock: "", reservedStock: "" }
          });
      }
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
}

migrate();
