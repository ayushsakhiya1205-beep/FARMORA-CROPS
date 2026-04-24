const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  outletId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Outlet', 
    required: true 
  },
  productId: { 
    type: String, 
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['grains', 'pulses', 'masala', 'oil', 'dryfruits', 'others']
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  unit: { 
    type: String, 
    required: true, 
    enum: ['kg', 'L', 'pcs'],
    default: 'kg'
  },
  lowStockThreshold: { 
    type: Number, 
    default: 10 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Unique index ensures no duplicate inventory for same outlet+product
inventorySchema.index({ outletId: 1, productId: 1 }, { unique: true });
inventorySchema.index({ outletId: 1, category: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
