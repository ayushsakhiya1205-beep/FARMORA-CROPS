const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

const DEFAULT_THRESHOLD_BY_CATEGORY = {
  dryfruits: 5,
  oil: 8
};

const getDefaultThreshold = (category) => DEFAULT_THRESHOLD_BY_CATEGORY[category] || 10;

const ensureOutletAccess = (req, outletId) => {
  if (req.user.role === 'admin') {
    return true;
  }

  const currentOutletId = req.user._id?.toString() || req.user.id?.toString();
  return currentOutletId === outletId.toString();
};

const buildInventoryCatalog = async (outletId) => {
  const [products, inventoryItems] = await Promise.all([
    Product.find({ isAvailable: true }).sort({ category: 1, name: 1 }),
    Inventory.find({ outletId }).populate('updatedBy', 'name')
  ]);

  const inventoryMap = new Map(
    inventoryItems.map((item) => [item.productId.toString(), item])
  );

  return products.map((product) => {
    const existingItem = inventoryMap.get(product._id.toString());
    return {
      _id: existingItem?._id || null,
      outletId,
      productId: product._id.toString(),
      productName: product.name,
      category: product.category,
      quantity: existingItem?.quantity || 0,
      unit: existingItem?.unit || product.unit || 'kg',
      lowStockThreshold: existingItem?.lowStockThreshold || getDefaultThreshold(product.category),
      image: product.image || '',
      lastUpdated: existingItem?.lastUpdated || null,
      updatedBy: existingItem?.updatedBy || null
    };
  });
};

router.get('/catalog/:outletId', auth, authorize('outletManager', 'admin'), async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!ensureOutletAccess(req, outletId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const catalog = await buildInventoryCatalog(outletId);
    res.json(catalog);
  } catch (error) {
    console.error('Error fetching inventory catalog:', error);
    res.status(500).json({ message: 'Error fetching inventory catalog' });
  }
});

router.post('/set', auth, authorize('outletManager', 'admin'), async (req, res) => {
  try {
    const {
      outletId,
      productId,
      quantity,
      productName,
      category,
      unit,
      lowStockThreshold
    } = req.body;

    if (!ensureOutletAccess(req, outletId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: 'Quantity must be 0 or more' });
    }

    const product =
      (productId && (await Product.findById(productId))) ||
      (productName && (await Product.findOne({ name: productName })));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const inventoryItem = await Inventory.findOneAndUpdate(
      { outletId, productId: product._id.toString() },
      {
        outletId,
        productId: product._id.toString(),
        productName: product.name,
        category: category || product.category,
        quantity: parsedQuantity,
        unit: unit || product.unit || 'kg',
        lowStockThreshold: lowStockThreshold || getDefaultThreshold(product.category),
        lastUpdated: new Date(),
        updatedBy: req.user._id || req.user.id
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      message: 'Inventory saved successfully',
      item: inventoryItem
    });
  } catch (error) {
    console.error('Error saving inventory item:', error);
    res.status(500).json({ message: 'Error saving inventory item' });
  }
});

router.post('/adjust', auth, authorize('outletManager', 'admin'), async (req, res) => {
  try {
    const { outletId, productId, delta } = req.body;

    if (!ensureOutletAccess(req, outletId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const parsedDelta = Number(delta);
    if (Number.isNaN(parsedDelta) || parsedDelta === 0) {
      return res.status(400).json({ message: 'Delta must be a non-zero number' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let inventoryItem = await Inventory.findOne({ outletId, productId: product._id.toString() });

    if (!inventoryItem) {
      inventoryItem = new Inventory({
        outletId,
        productId: product._id.toString(),
        productName: product.name,
        category: product.category,
        quantity: 0,
        unit: product.unit || 'kg',
        lowStockThreshold: getDefaultThreshold(product.category),
        updatedBy: req.user._id || req.user.id
      });
    }

    const nextQuantity = inventoryItem.quantity + parsedDelta;
    if (nextQuantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot go below 0' });
    }

    inventoryItem.quantity = nextQuantity;
    inventoryItem.lastUpdated = new Date();
    inventoryItem.updatedBy = req.user._id || req.user.id;
    await inventoryItem.save();

    res.json({
      message: 'Inventory adjusted successfully',
      item: inventoryItem
    });
  } catch (error) {
    console.error('Error adjusting inventory item:', error);
    res.status(500).json({ message: 'Error adjusting inventory item' });
  }
});

router.get('/low-stock/:outletId', auth, authorize('outletManager', 'admin'), async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!ensureOutletAccess(req, outletId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const catalog = await buildInventoryCatalog(outletId);
    const lowStockItems = catalog.filter((item) => item.quantity <= item.lowStockThreshold);
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
});

router.get('/:outletId', auth, authorize('outletManager', 'admin'), async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!ensureOutletAccess(req, outletId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const inventory = await Inventory.find({ outletId })
      .populate('updatedBy', 'name')
      .sort({ category: 1, productName: 1 });

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

module.exports = router;
