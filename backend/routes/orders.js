const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Outlet = require('../models/Outlet');
const Inventory = require('../models/Inventory');
const Reminder = require('../models/Reminder');
const { auth, authorize } = require('../middleware/auth');
const { sendOrderInvoiceEmail } = require('../config/email');
const { generateOrderInvoiceWithPuppeteer } = require('../utils/puppeteerInvoiceGenerator');
const { calculateDeliveryFee } = require('../config/deliveryFee');

const router = express.Router();

const normalizeInventoryKey = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const findMatchingInventoryItem = (inventoryItems, orderItem) => {
  const productObjectId = orderItem.productId?.toString();
  const normalizedName = normalizeInventoryKey(orderItem.name);
  const allMatches = [];

  for (const inventoryItem of inventoryItems) {
    const inventoryProductId = inventoryItem.productId?.toString();
    const inventoryProductName = normalizeInventoryKey(inventoryItem.productName);

    let matchType = null;

    // Check exact productId match (most reliable)
    if (inventoryProductId && productObjectId && inventoryProductId === productObjectId) {
      matchType = 'productId';
    }
    // Check exact normalized name match
    else if (normalizedName && inventoryProductName === normalizedName) {
      matchType = 'exactName';
    }
    // Check partial name match (handles "Jaggery (Gud)" vs "jaggery" etc.)
    else if (normalizedName && inventoryProductName &&
        (inventoryProductName.includes(normalizedName) || normalizedName.includes(inventoryProductName))) {
      matchType = 'partialName';
    }

    if (matchType) {
      allMatches.push({ inventoryItem, matchType, qty: Number(inventoryItem.quantity) || 0 });
    }
  }

  if (allMatches.length === 0) return null;

  // If multiple matches found (duplicates), log them and pick the one with most stock
  if (allMatches.length > 1) {
    console.log(`⚠️ Found ${allMatches.length} duplicate inventory entries for "${orderItem.name}":`);
    allMatches.forEach((m, i) => {
      console.log(`   [${i}] ${m.inventoryItem.productName} (ID: ${m.inventoryItem.productId}) qty=${m.qty} match=${m.matchType}`);
    });
  }

  // Prioritize: productId matches first, then by highest quantity
  allMatches.sort((a, b) => {
    // productId matches are most reliable
    if (a.matchType === 'productId' && b.matchType !== 'productId') return -1;
    if (b.matchType === 'productId' && a.matchType !== 'productId') return 1;
    // Then by quantity (highest first)
    return b.qty - a.qty;
  });

  const best = allMatches[0];
  if (allMatches.length > 1) {
    console.log(`✅ Selected best match: "${best.inventoryItem.productName}" qty=${best.qty} (${best.matchType})`);
  }

  return best.inventoryItem;
};


const validateAndReduceInventory = async (outletId, orderItems, outletName = 'Unknown') => {
  let inventoryItems = await Inventory.find({ outletId });

  console.log(`📦 Inventory check for outlet "${outletName}" (${outletId}):`);
  console.log(`📦 Total inventory items found: ${inventoryItems.length}`);

  if (inventoryItems.length === 0) {
    // Debug: check if inventory exists under any outletId
    console.log('⚠️ No inventory items found for this outlet!');
    const sampleInventory = await Inventory.find({}).limit(5);
    if (sampleInventory.length > 0) {
      console.log('⚠️ Inventory exists under different outletIds:');
      sampleInventory.forEach(item => {
        console.log(`   outletId: ${item.outletId}, product: ${item.productName}, qty: ${item.quantity}`);
      });
    }
    throw new Error(`No inventory configured for outlet "${outletName}". Please ask the outlet manager to set up inventory first.`);
  }

  // --- DEDUP: Clean up duplicate inventory entries ---
  // Group by productId AND by normalized name to catch all duplicates
  const productGroups = new Map();
  for (const item of inventoryItems) {
    // Primary grouping by productId
    const key = item.productId?.toString();
    if (!productGroups.has(key)) {
      productGroups.set(key, []);
    }
    productGroups.get(key).push(item);
  }

  // Also check for name-based duplicates (old entries might use name as productId)
  const nameGroups = new Map();
  for (const item of inventoryItems) {
    const nameKey = normalizeInventoryKey(item.productName);
    if (!nameGroups.has(nameKey)) {
      nameGroups.set(nameKey, []);
    }
    nameGroups.get(nameKey).push(item);
  }

  // Merge both groupings to find all duplicates
  const allGroups = new Map();
  const processed = new Set();
  
  // Process name-based groups (catches cross-productId duplicates)
  for (const [nameKey, group] of nameGroups) {
    if (group.length > 1) {
      const groupKey = `name:${nameKey}`;
      allGroups.set(groupKey, group);
      group.forEach(item => processed.add(item._id.toString()));
    }
  }
  
  // Process productId-based groups (only if not already handled by name grouping)
  for (const [productId, group] of productGroups) {
    if (group.length > 1) {
      const alreadyProcessed = group.every(item => processed.has(item._id.toString()));
      if (!alreadyProcessed) {
        allGroups.set(`id:${productId}`, group);
      }
    }
  }

  // For any product with duplicates, keep the one with highest quantity and delete the rest
  const idsToRemove = new Set();
  const idsToKeep = new Set();
  
  for (const [groupKey, group] of allGroups) {
    console.log(`🔧 Found ${group.length} duplicate entries (${groupKey}):`);
    // Sort by quantity descending - keep the first (highest stock)
    group.sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0));
    const keeper = group[0];
    idsToKeep.add(keeper._id.toString());
    console.log(`   ✅ Keeping: "${keeper.productName}" qty=${keeper.quantity} (ID: ${keeper._id})`);
    for (let i = 1; i < group.length; i++) {
      const itemId = group[i]._id.toString();
      if (!idsToKeep.has(itemId)) {
        console.log(`   🗑️ Removing: "${group[i].productName}" qty=${group[i].quantity} (ID: ${group[i]._id})`);
        idsToRemove.add(group[i]._id);
      }
    }
  }

  // Delete stale duplicates
  if (idsToRemove.size > 0) {
    const removeIds = Array.from(idsToRemove);
    console.log(`🔧 Cleaning up ${removeIds.length} duplicate inventory entries...`);
    await Inventory.deleteMany({ _id: { $in: removeIds } });
    // Re-fetch clean inventory after cleanup
    inventoryItems = await Inventory.find({ outletId });
    console.log(`✅ Cleanup complete. ${inventoryItems.length} items remaining.`);
  }

  // Log available inventory for debugging
  inventoryItems.forEach(item => {
    console.log(`  📋 ${item.productName} (ID: ${item.productId}) => Qty: ${item.quantity} ${item.unit || 'kg'}`);
  });

  const touchedInventory = [];

  for (const orderItem of orderItems) {
    console.log(`\n🔍 Looking for: "${orderItem.name}" (productId: ${orderItem.productId})`);

    const inventoryItem = findMatchingInventoryItem(inventoryItems, orderItem);

    if (!inventoryItem) {
      console.log(`❌ No inventory match found for "${orderItem.name}"`);
      throw new Error(
        `"${orderItem.name}" is not available in the "${outletName}" outlet inventory. Please contact the outlet manager.`
      );
    }

    console.log(`✅ Matched: "${inventoryItem.productName}" (Qty: ${inventoryItem.quantity})`);

    // Ensure both quantities are valid numbers to prevent NaN
    const currentStock = Number(inventoryItem.quantity) || 0;
    const requiredQty = Number(orderItem.quantity);

    if (Number.isNaN(requiredQty) || requiredQty <= 0) {
      throw new Error(`Invalid quantity for ${orderItem.name}`);
    }

    if (currentStock < requiredQty) {
      throw new Error(
        `Not enough stock for "${orderItem.name}" in "${outletName}" outlet. Available: ${currentStock}, Required: ${requiredQty}`
      );
    }

    inventoryItem.quantity = currentStock - requiredQty;
    inventoryItem.lastUpdated = new Date();

    // Fill in any missing required fields to prevent Mongoose validation errors
    if (!inventoryItem.productName) {
      inventoryItem.productName = orderItem.name || 'Unknown Product';
    }
    if (!inventoryItem.category) {
      try {
        const product = await Product.findById(orderItem.productId);
        inventoryItem.category = product?.category || 'others';
      } catch {
        inventoryItem.category = 'others';
      }
    }

    touchedInventory.push(inventoryItem);
  }

  for (const inventoryItem of touchedInventory) {
    await inventoryItem.save();
  }

  console.log(`✅ Inventory reduced successfully for ${touchedInventory.length} items`);
  return touchedInventory;
};

const restoreInventoryQuantities = async (inventoryItems, orderItems) => {
  for (const orderItem of orderItems) {
    const inventoryItem = findMatchingInventoryItem(inventoryItems, orderItem);
    if (inventoryItem) {
      inventoryItem.quantity += orderItem.quantity;
      inventoryItem.lastUpdated = new Date();
      await inventoryItem.save();
    }
  }
};

// Helper function to find outlet based on district matching
// Returns { outletId, outletName } for better error messages
const findOutletByDistrict = async (customerDistrict) => {
  try {
    const outlets = await Outlet.find({ isActive: true });

    console.log('🔍 Finding outlet for district:', customerDistrict);
    console.log('🔍 Available outlets:', outlets.length);

    if (outlets.length === 0) {
      console.log('❌ No active outlets found');
      return { outletId: null, outletName: null };
    }

    // Log all available outlet districts for debugging
    console.log('🔍 Available outlet districts:');
    outlets.forEach(outlet => {
      console.log(`  - "${outlet.name}" (ID: ${outlet._id}): district="${outlet.address?.district}", state="${outlet.address?.state}"`);
    });

    // Normalize district names for comparison (case-insensitive, trimmed)
    const normalizeDistrict = (district) => {
      if (!district) return '';
      return district.trim().toLowerCase();
    };

    const normalizedCustomerDistrict = normalizeDistrict(customerDistrict);
    console.log('🔍 Normalized customer district:', normalizedCustomerDistrict);

    // Priority 1: Exact district match
    if (normalizedCustomerDistrict) {
      const districtMatch = outlets.find(o => {
        const outletDistrict = normalizeDistrict(o.address?.district);
        return outletDistrict === normalizedCustomerDistrict;
      });

      if (districtMatch) {
        console.log('✅ Matched by exact district:', districtMatch.name, districtMatch._id);
        return { outletId: districtMatch._id, outletName: districtMatch.name };
      }
    }

    // Priority 2: Partial district match (handles "Rajkot District" vs "Rajkot")
    if (normalizedCustomerDistrict) {
      const partialMatch = outlets.find(o => {
        const outletDistrict = normalizeDistrict(o.address?.district);
        return outletDistrict && (
          outletDistrict.includes(normalizedCustomerDistrict) ||
          normalizedCustomerDistrict.includes(outletDistrict)
        );
      });

      if (partialMatch) {
        console.log('✅ Matched by partial district:', partialMatch.name, partialMatch._id);
        return { outletId: partialMatch._id, outletName: partialMatch.name };
      }
    }

    // Priority 3: Find any outlet in Gujarat state
    const gujaratOutlet = outlets.find(o => o.address?.state === 'Gujarat');
    if (gujaratOutlet) {
      console.log('✅ Found outlet in Gujarat (state fallback):', gujaratOutlet.name);
      return { outletId: gujaratOutlet._id, outletName: gujaratOutlet.name };
    }

    // Priority 4: Fallback to first available outlet
    console.log('⚠️ No district/state match, using fallback outlet:', outlets[0].name);
    return { outletId: outlets[0]._id, outletName: outlets[0].name };
  } catch (error) {
    console.error('❌ Error in findOutletByDistrict:', error);
    return { outletId: null, outletName: null };
  }
};

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Customer)
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod = 'cod', notes } = req.body;
    let adjustedInventoryItems = [];

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get product details and calculate total
    const items = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        continue;
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      items.push({
        productId: product._id,
        name: product.name,
        image: product.image || '',
        quantity: item.quantity,
        price: product.price,
        unit: product.unit
      });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: 'No valid items in cart' });
    }

    // Get customer district details
    const customerDistrict = deliveryAddress?.district || req.user.district || '';

    console.log('🔍 Order creation - Customer district:', {
      customerDistrict,
      deliveryAddress,
      userDistrict: req.user.district
    });

    // Find outlet based on district matching (now returns { outletId, outletName })
    const { outletId, outletName } = await findOutletByDistrict(customerDistrict);

    if (!outletId) {
      console.error('❌ No outlet found for delivery');
      return res.status(400).json({
        message: `No outlet available for delivery to ${customerDistrict || 'your location'}. Please contact support or try a different delivery location.`
      });
    }

    console.log(`✅ Outlet assigned: "${outletName}" (${outletId})`);

    // Validate and reduce inventory for the matched outlet before saving order
    try {
      adjustedInventoryItems = await validateAndReduceInventory(outletId, items, outletName);
    } catch (inventoryError) {
      console.error('❌ Inventory validation error:', inventoryError.message);
      return res.status(400).json({
        message: inventoryError.message
      });
    }

    // Calculate delivery fee
    const deliveryFeeCalculation = calculateDeliveryFee(totalAmount);

    console.log('💰 Delivery Fee Calculation:', {
      orderAmount: totalAmount,
      threshold: 500,
      deliveryFee: deliveryFeeCalculation.fee,
      finalAmount: deliveryFeeCalculation.finalAmount
    });

    // Create order
    const order = new Order({
      customerId: req.user._id,
      outletId,
      items,
      totalAmount,
      deliveryFee: deliveryFeeCalculation.fee,
      finalAmount: deliveryFeeCalculation.finalAmount,
      deliveryAddress: deliveryAddress || req.user.address,
      paymentMethod,
      notes,
      orderStatus: 'pending'
    });

    try {
      await order.save();
    } catch (saveError) {
      if (adjustedInventoryItems.length > 0) {
        await restoreInventoryQuantities(adjustedInventoryItems, items);
      }
      throw saveError;
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Create reminders for products
    for (const item of items) {
      // Estimate days based on quantity (rough estimate: 1kg grain = ~30 days for family)
      const estimatedDays = Math.ceil(item.quantity * 30);
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + estimatedDays - 7); // Remind 7 days before

      await Reminder.create({
        customerId: req.user._id,
        productId: item.productId,
        lastOrderDate: new Date(),
        estimatedDaysToFinish: estimatedDays,
        reminderDate,
        isActive: true,
        isNotified: false
      });
    }

    await order.populate('outletId', 'name address phone');
    await order.populate('customerId', 'name phone');

    // Send invoice email in background (fire-and-forget)
    // sendOrderInvoiceEmail handles PDF generation + email sending
    setImmediate(async () => {
      try {
        console.log('📧 [Background] Starting invoice email...');
        await sendOrderInvoiceEmail(req.user.email, order, req.user.name);
        console.log('✅ [Background] Invoice email sent to:', req.user.email);
      } catch (emailError) {
        console.error('❌ [Background] Invoice email failed:', emailError.message);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Invoice will be sent to your email shortly.',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'outletManager') {
      query.outletId = req.user.outletId;
    } else if (req.user.role === 'delivery_boy') {
      query.deliveryBoyId = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone address')
      .populate('outletId', 'name address phone')
      .populate('deliveryBoyId', 'name phone')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone address')
      .populate('outletId', 'name address phone')
      .populate('deliveryBoyId', 'name phone')
      .populate('items.productId', 'name image description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Customer can cancel, Manager can confirm/process)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    if (req.user.role === 'customer') {
      if (order.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Customers can only cancel orders' });
      }
    }

    order.orderStatus = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/orders/:id - Delete an order (only for cancelled orders by customers)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Delete order request for ID:', req.params.id);
    console.log('🔍 DEBUG: User from auth:', req.user);
    console.log('🔍 DEBUG: User type:', req.userType);

    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('🔍 DEBUG: Order found:', order);
    console.log('🔍 DEBUG: Order customerId:', order.customerId);
    console.log('🔍 DEBUG: Order status:', order.orderStatus);

    // Check if order is cancelled
    if (order.orderStatus !== 'cancelled') {
      console.log('❌ Order is not cancelled');
      return res.status(400).json({ message: 'Only cancelled orders can be deleted' });
    }

    // For customers, check if they own the order
    if (req.userType === 'customer') {
      // Get user ID safely - handle both _id and id properties
      let currentUserId = null;
      if (req.user._id) {
        currentUserId = req.user._id.toString();
      } else if (req.user.id) {
        currentUserId = req.user.id.toString();
      } else {
        console.log('❌ User ID not found in user object');
        return res.status(401).json({ message: 'User authentication error' });
      }

      // Use customerId instead of userId (based on Order model)
      const orderCustomerId = order.customerId ? order.customerId.toString() : null;

      console.log('🔍 DEBUG: Comparing user IDs:', {
        orderCustomerId,
        currentUserId,
        orderCustomerIdType: typeof orderCustomerId,
        currentUserIdType: typeof currentUserId
      });

      if (!orderCustomerId || orderCustomerId !== currentUserId) {
        console.log('❌ Access denied - user does not own this order');
        return res.status(403).json({ message: 'Access denied - you can only delete your own orders' });
      }
    }

    // Delete the order
    await Order.findByIdAndDelete(req.params.id);

    console.log('✅ Order deleted successfully:', req.params.id);
    res.json({ message: 'Order deleted successfully' });

  } catch (error) {
    console.error('❌ Delete order error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint for outlet matching
router.get('/test-outlet/:district', async (req, res) => {
  try {
    const { district } = req.params;
    console.log('🧪 Testing outlet matching for district:', district);

    const { outletId, outletName } = await findOutletByDistrict(district);

    if (outletId) {
      const outlet = await Outlet.findById(outletId);

      // Also check inventory count for this outlet
      const inventoryCount = await Inventory.countDocuments({ outletId });
      const inventoryItems = await Inventory.find({ outletId }).select('productName quantity');

      res.json({
        success: true,
        district,
        outletId,
        outletName: outlet.name,
        outletDistrict: outlet.address?.district,
        outletState: outlet.address?.state,
        inventoryItemsCount: inventoryCount,
        inventoryItems: inventoryItems.map(i => ({
          name: i.productName,
          qty: i.quantity
        }))
      });
    } else {
      res.json({
        success: false,
        district,
        message: 'No outlet found'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/address - Update order delivery address
router.put('/:id/address', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Update order address request for ID:', req.params.id);
    console.log('🔍 DEBUG: User from auth:', req.user);

    // Get user type from user object
    const userType = req.user.role || 'customer';
    console.log('🔍 DEBUG: User type:', userType);

    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('🔍 DEBUG: Order found:', order);
    console.log('🔍 DEBUG: Order customerId:', order.customerId);
    console.log('🔍 DEBUG: Order status:', order.orderStatus);

    // Check if order can be updated (only pending or confirmed orders)
    if (order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed') {
      console.log('❌ Order cannot be updated - status:', order.orderStatus);
      return res.status(400).json({ message: 'Only pending or confirmed orders can have their address updated' });
    }

    // For customers, check if they own order
    if (userType === 'customer') {
      // Get user ID safely
      let currentUserId = null;
      if (req.user._id) {
        currentUserId = req.user._id.toString();
      } else if (req.user.id) {
        currentUserId = req.user.id.toString();
      } else {
        console.log('❌ User ID not found in user object');
        return res.status(401).json({ message: 'User authentication error' });
      }

      // Use customerId instead of userId
      const orderCustomerId = order.customerId ? order.customerId.toString() : null;

      console.log('🔍 DEBUG: Comparing user IDs:', {
        orderCustomerId,
        currentUserId,
        orderCustomerIdType: typeof orderCustomerId,
        currentUserIdType: typeof currentUserId
      });

      if (!orderCustomerId || orderCustomerId !== currentUserId) {
        console.log('❌ Access denied - user does not own this order');
        return res.status(403).json({ message: 'Access denied - you can only update your own orders' });
      }
    }

    // Validate delivery address
    const { deliveryAddress } = req.body;
    if (!deliveryAddress) {
      console.log('❌ Delivery address not provided');
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    console.log('🔍 DEBUG: Received delivery address object:', JSON.stringify(deliveryAddress, null, 2));

    // Update order delivery address
    console.log('🔍 DEBUG: Before update - Current order address:', order.deliveryAddress);
    console.log('🔍 DEBUG: New delivery address data:', deliveryAddress);

    // Update all individual address fields
    order.deliveryAddress.houseNo = deliveryAddress.houseNo || '';
    order.deliveryAddress.street = deliveryAddress.street || '';
    order.deliveryAddress.area = deliveryAddress.area || '';
    order.deliveryAddress.taluka = deliveryAddress.taluka || '';
    order.deliveryAddress.city = deliveryAddress.city || '';
    order.deliveryAddress.state = deliveryAddress.state || '';
    order.deliveryAddress.district = deliveryAddress.district || '';
    order.deliveryAddress.pincode = deliveryAddress.pincode || '';
    order.deliveryAddress.mobileNumber = deliveryAddress.mobileNumber || '';

    // Also update the address string for backward compatibility
    if (deliveryAddress.houseNo && deliveryAddress.street && deliveryAddress.area && deliveryAddress.state && deliveryAddress.pincode) {
      order.deliveryAddress.address = `${deliveryAddress.houseNo}, ${deliveryAddress.street}, ${deliveryAddress.area}, ${deliveryAddress.state}, ${deliveryAddress.pincode}`;
    }

    console.log('🔍 DEBUG: After update - Updated order address:', order.deliveryAddress);

    await order.save();

    console.log('🔍 DEBUG: After save - Order from database:', JSON.stringify(order.deliveryAddress, null, 2));

    console.log('✅ Order address updated successfully:', req.params.id);
    console.log('🔍 DEBUG: Updated order:', order);

    res.json({
      message: 'Order address updated successfully',
      order: order
    });

  } catch (error) {
    console.error('❌ Error updating order address:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
