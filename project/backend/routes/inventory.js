const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { auth, authorize } = require('../middleware/auth');

// Get outlet inventory
router.get('/:outletId', auth, authorize(['outlet_manager', 'admin']), async (req, res) => {
  try {
    const { outletId } = req.params;
    const inventory = await Inventory.find({ outletId })
      .populate('updatedBy', 'name')
      .sort({ category: 1, productName: 1 });
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// Add or update inventory item
router.post('/add', auth, authorize(['outlet_manager', 'admin']), async (req, res) => {
  try {
    const { outletId, productId, productName, category, quantity, unit, lowStockThreshold } = req.body;
    
    // Check if item already exists
    const existingItem = await Inventory.findOne({ outletId, productId });
    
    if (existingItem) {
      // Update existing item
      existingItem.quantity = quantity;
      existingItem.lastUpdated = new Date();
      existingItem.updatedBy = req.user.id;
      if (lowStockThreshold) existingItem.lowStockThreshold = lowStockThreshold;
      
      await existingItem.save();
      res.json({ message: 'Inventory updated successfully', item: existingItem });
    } else {
      // Create new item
      const newItem = new Inventory({
        outletId,
        productId,
        productName,
        category,
        quantity,
        unit: unit || 'kg',
        lowStockThreshold: lowStockThreshold || 10,
        updatedBy: req.user.id
      });
      
      await newItem.save();
      res.status(201).json({ message: 'Inventory item added successfully', item: newItem });
    }
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ message: 'Error adding inventory item' });
  }
});

// Update inventory quantity
router.put('/update/:id', auth, authorize(['outlet_manager', 'admin']), async (req, res) => {
  try {
    const { quantity } = req.body;
    const inventoryItem = await Inventory.findById(req.params.id);
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    inventoryItem.quantity = quantity;
    inventoryItem.lastUpdated = new Date();
    inventoryItem.updatedBy = req.user.id;
    
    await inventoryItem.save();
    res.json({ message: 'Inventory updated successfully', item: inventoryItem });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Error updating inventory' });
  }
});

// Delete inventory item
router.delete('/:id', auth, authorize(['outlet_manager', 'admin']), async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);
    
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ message: 'Error deleting inventory' });
  }
});

// Get low stock items
router.get('/low-stock/:outletId', auth, authorize(['outlet_manager', 'admin']), async (req, res) => {
  try {
    const { outletId } = req.params;
    const lowStockItems = await Inventory.find({
      outletId,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).populate('updatedBy', 'name');
    
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
});

module.exports = router;
