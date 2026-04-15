const express = require('express');

const Order = require('../models/Order');

const Outlet = require('../models/Outlet');

const User = require('../models/User');

const { auth, authorize } = require('../middleware/auth');



const router = express.Router();



// @route   GET /api/outlet/orders

// @desc    Get all orders for outlet manager

// @access  Private (Outlet Manager)

router.get('/orders', auth, authorize('outletManager'), async (req, res) => {

  try {

    const { status } = req.query;

    let query = { outletId: req.user._id }; // Use _id for outlets



    if (status) {

      query.orderStatus = status;

    }



    const orders = await Order.find(query)

      .populate('customerId', 'name phone address')

      .populate('deliveryBoyId', 'name phone')

      .populate('items.productId', 'name image')

      .sort({ createdAt: -1 });



    res.json(orders);

  } catch (error) {

    console.error('Get outlet orders error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



// @route   PUT /api/outlet/orders/:id/confirm

// @desc    Confirm order (Outlet Manager)

// @access  Private (Outlet Manager)

router.put('/orders/:id/confirm', auth, authorize('outletManager'), async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);



    if (!order) {

      return res.status(404).json({ message: 'Order not found' });

    }



    if (order.outletId.toString() !== req.user._id.toString()) {

      return res.status(403).json({ message: 'Access denied' });

    }



    order.orderStatus = 'confirmed';

    await order.save();



    res.json(order);

  } catch (error) {

    console.error('Confirm order error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



// @route   PUT /api/outlet/orders/:id/process

// @desc    Mark order as processing (Outlet Manager)

// @access  Private (Outlet Manager)

router.put('/orders/:id/process', auth, authorize('outletManager'), async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);



    if (!order) {

      return res.status(404).json({ message: 'Order not found' });

    }



    if (order.outletId.toString() !== req.user._id.toString()) {

      return res.status(403).json({ message: 'Access denied' });

    }



    order.orderStatus = 'processing';

    await order.save();



    res.json(order);

  } catch (error) {

    console.error('Process order error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



// @route   PUT /api/outlet/orders/:id/cancel
// @desc    Cancel order (Outlet Manager)
// @access  Private (Outlet Manager)
router.put('/orders/:id/cancel', auth, authorize('outletManager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.outletId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['delivered', 'completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot cancel an order that is ${order.orderStatus}` });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = req.body.cancellationReason || 'Cancelled by outlet manager';
    
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/outlet/orders/:id
// @desc    Delete completed order
// @access  Private (Outlet Manager)
router.delete('/orders/:id', auth, authorize('outletManager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.outletId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!['delivered', 'completed'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Only completed or delivered orders can be deleted by outlet manager' });
    }

    order.orderStatus = 'archived';
    await order.save();
    res.json({ message: 'Order archived and removed from queue successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/outlet/orders/:id/assign
// @desc    Assign delivery boy to order

// @access  Private (Outlet Manager)

router.put('/orders/:id/assign', auth, authorize('outletManager'), async (req, res) => {

  try {

    const { deliveryBoyId } = req.body;



    if (!deliveryBoyId) {

      return res.status(400).json({ message: 'Delivery boy ID is required' });

    }



    const order = await Order.findById(req.params.id);

    if (!order) {

      return res.status(404).json({ message: 'Order not found' });

    }



    if (order.outletId.toString() !== req.user._id.toString()) {

      return res.status(403).json({ message: 'Access denied' });

    }



    // Verify delivery boy belongs to same outlet

    const deliveryBoy = await User.findById(deliveryBoyId);

    if (!deliveryBoy || deliveryBoy.role !== 'delivery_boy' || 

        deliveryBoy.outletId.toString() !== req.user._id.toString()) {

      return res.status(400).json({ message: 'Invalid delivery boy' });

    }



    order.deliveryBoyId = deliveryBoyId;

    order.orderStatus = 'assigned';

    await order.save();



    await order.populate('deliveryBoyId', 'name phone');

    res.json(order);

  } catch (error) {

    console.error('Assign delivery boy error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



// @route   PUT /api/outlet/orders/:id/out-for-delivery

// @desc    Mark order as out for delivery

// @access  Private (Outlet Manager)

router.put('/orders/:id/out-for-delivery', auth, authorize('outletManager'), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Out for delivery request for order:', req.params.id);
    console.log('🔍 DEBUG: User making request:', req.user._id, req.user.role);
    
    const order = await Order.findById(req.params.id);
    console.log('🔍 DEBUG: Order found:', order ? 'Yes' : 'No');

    if (!order) {
      console.log('🔍 DEBUG: Order not found error');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('🔍 DEBUG: Order outletId:', order.outletId);
    console.log('🔍 DEBUG: User outletId:', req.user._id);
    
    if (order.outletId.toString() !== req.user._id.toString()) {
      console.log('🔍 DEBUG: Access denied - outlet mismatch');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('🔍 DEBUG: Current order status:', order.orderStatus);

    if (order.orderStatus !== 'assigned') {
      console.log('🔍 DEBUG: Invalid order status error');
      return res.status(400).json({ message: 'Order must be assigned first' });
    }

    // Update order status to out_for_delivery
    order.orderStatus = 'out_for_delivery';
    order.outForDeliveryAt = new Date();
    
    await order.save();
    await order.populate('deliveryBoyId', 'name phone');
    
    console.log('🔍 DEBUG: Order updated successfully:', order.orderStatus);

    res.json({
      message: 'Order marked as out for delivery',
      order
    });
  } catch (error) {
    console.error('🔍 DEBUG: Mark out for delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   PUT /api/outlet/orders/:id/complete
// @desc    Mark order as completed
// @access  Private (Outlet Manager)

router.put('/orders/:id/complete', auth, authorize('outletManager'), async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'out_for_delivery') {
      return res.status(400).json({ message: 'Order must be out for delivery before marking as completed' });
    }

    order.orderStatus = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.json({ 
      message: 'Order marked as completed successfully',
      order: order
    });

  } catch (error) {
    console.error('🔍 DEBUG: Mark completed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   GET /api/outlet/delivery-boys

// @desc    Get all delivery boys for outlet

// @access  Private (Outlet Manager)

router.get('/delivery-boys', auth, authorize('outletManager'), async (req, res) => {

  try {

    const deliveryBoys = await User.find({
      role: 'delivery_boy',
      outletId: req.user._id,
      isActive: true
    }).select('name phone email vehicle available');



    res.json(deliveryBoys);

  } catch (error) {

    console.error('Get delivery boys error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



// @route   GET /api/outlet/stats

// @desc    Get outlet statistics

// @access  Private (Outlet Manager)

router.get('/stats', auth, authorize('outletManager'), async (req, res) => {

  try {

    const totalOrders = await Order.countDocuments({ outletId: req.user._id });

    const pendingOrders = await Order.countDocuments({ 

      outletId: req.user._id, 

      orderStatus: { $in: ['pending', 'confirmed', 'processing'] } 

    });

    const deliveredOrders = await Order.countDocuments({ 

      outletId: req.user._id, 

      orderStatus: { $in: ['delivered', 'completed', 'archived'] } 

    });



    res.json({

      totalOrders,

      pendingOrders,

      deliveredOrders

    });

  } catch (error) {

    console.error('Get outlet stats error:', error);

    res.status(500).json({ message: 'Server error' });

  }

});



module.exports = router;



