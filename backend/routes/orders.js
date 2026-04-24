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

  return inventoryItems.find((inventoryItem) => {
    const inventoryProductId = inventoryItem.productId?.toString();
    const inventoryProductName = normalizeInventoryKey(inventoryItem.productName);

    return (
      inventoryProductId === productObjectId ||
      inventoryProductId === normalizedName ||
      inventoryProductName === normalizedName
    );
  });
};

const validateAndReduceInventory = async (outletId, orderItems) => {
  const inventoryItems = await Inventory.find({ outletId });
  const touchedInventory = [];

  for (const orderItem of orderItems) {
    const inventoryItem = findMatchingInventoryItem(inventoryItems, orderItem);

    if (!inventoryItem) {
      throw new Error(`Inventory not found for ${orderItem.name} in the selected outlet`);
    }

    if (inventoryItem.quantity < orderItem.quantity) {
      throw new Error(
        `Not enough stock for ${orderItem.name}. Available: ${inventoryItem.quantity}, required: ${orderItem.quantity}`
      );
    }

    inventoryItem.quantity -= orderItem.quantity;
    inventoryItem.lastUpdated = new Date();
    touchedInventory.push(inventoryItem);
  }

  for (const inventoryItem of touchedInventory) {
    await inventoryItem.save();
  }

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
const findOutletByDistrict = async (customerDistrict) => {
  try {
    const outlets = await Outlet.find({ isActive: true });
    
    console.log('🔍 Finding outlet for district:', customerDistrict);
    console.log('🔍 Available outlets:', outlets.length);
    
    if (outlets.length === 0) {
      console.log('❌ No active outlets found');
      return null;
    }

    // Log all available outlet districts for debugging
    console.log('🔍 Available outlet districts:');
    outlets.forEach(outlet => {
      console.log(`  - ${outlet.name}: ${outlet.address?.district} (${outlet.address?.state})`);
    });

    // Normalize district names for comparison (case-insensitive, trimmed)
    const normalizeDistrict = (district) => {
      if (!district) return '';
      return district.trim().toLowerCase();
    };

    const normalizedCustomerDistrict = normalizeDistrict(customerDistrict);
    console.log('🔍 Normalized customer district:', normalizedCustomerDistrict);

    // Priority 1: Match by exact district
    if (normalizedCustomerDistrict) {
      const districtMatch = outlets.find(o => {
        const outletDistrict = normalizeDistrict(o.address?.district);
        console.log(`🔍 Comparing "${outletDistrict}" with "${normalizedCustomerDistrict}"`);
        return outletDistrict === normalizedCustomerDistrict;
      });
      
      if (districtMatch) {
        console.log('✅ Matched by district:', districtMatch.name, districtMatch._id);
        return districtMatch._id;
      }
    }

    // Priority 2: If no exact match, try to find outlet in same state
    const customerState = outlets.find(o => 
      normalizeDistrict(o.address?.district) === 'rajkot' && 
      o.address?.state === 'Gujarat'
    );
    
    if (customerState) {
      console.log('✅ Found outlet in Gujarat state (fallback for Rajkot):', customerState.name);
      return customerState._id;
    }

    // Priority 3: Find any outlet in Gujarat
    const gujaratOutlet = outlets.find(o => o.address?.state === 'Gujarat');
    if (gujaratOutlet) {
      console.log('✅ Found outlet in Gujarat (state fallback):', gujaratOutlet.name);
      return gujaratOutlet._id;
    }

    // Priority 4: If no match, return first available outlet (fallback)
    console.log('⚠️ No district or state match found, using fallback outlet:', outlets[0].name);
    return outlets[0]._id;
  } catch (error) {
    console.error('❌ Error in findOutletByDistrict:', error);
    return null;
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

    // Special handling for Rajkot district
    if (customerDistrict.toLowerCase() === 'rajkot') {
      console.log('🔍 Special handling for Rajkot district');
    }

    // Find outlet based on district matching
    const outletId = await findOutletByDistrict(customerDistrict);

    if (!outletId) {
      console.error('❌ No outlet found for delivery');
      return res.status(400).json({ 
        message: `No outlet available for delivery to ${customerDistrict || 'your location'}. Please contact support or try a different delivery location.` 
      });
    }

    console.log('✅ Outlet assigned:', outletId);

    // Validate and reduce inventory for the matched outlet before saving order
    try {
      adjustedInventoryItems = await validateAndReduceInventory(outletId, items);
    } catch (inventoryError) {
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

    // Send invoice email in background (fire-and-forget) to avoid timeout
    // The order is already saved and cart cleared, so email failure won't affect the order
    setImmediate(async () => {
      try {
        console.log('📧 [Background] Starting invoice email process...');
        console.log('📧 [Background] User email:', req.user.email);
        
        const invoiceResult = await generateOrderInvoiceWithPuppeteer(order, req.user.name, req.user.email);
        
        if (invoiceResult.success) {
          console.log(`📄 [Background] PDF generated: ${invoiceResult.filename} (${invoiceResult.size} bytes)`);
          
          // Send email with the generated PDF
          await sendOrderInvoiceEmail(req.user.email, order, req.user.name);
          console.log('✅ [Background] Invoice email sent successfully to:', req.user.email);
          
          // Clean up temp PDF
          const fs = require('fs');
          if (fs.existsSync(invoiceResult.filepath)) {
            fs.unlinkSync(invoiceResult.filepath);
            console.log('🗑️ [Background] Cleaned up temp PDF');
          }
        } else {
          console.error('❌ [Background] PDF generation failed');
        }
      } catch (emailError) {
        console.error('❌ [Background] Invoice email failed:', emailError.message);
        // Email failure is non-critical - order is already placed
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
    
    const outletId = await findOutletByDistrict(district);
    
    if (outletId) {
      const outlet = await Outlet.findById(outletId);
      res.json({
        success: true,
        district,
        outletId,
        outletName: outlet.name,
        outletDistrict: outlet.address?.district,
        outletState: outlet.address?.state
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
