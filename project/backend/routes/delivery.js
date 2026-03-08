const express = require('express');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/delivery/orders
// @desc    Get assigned orders for delivery boy
// @access  Private (Delivery Boy)
router.get('/orders', auth, authorize('delivery_boy'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = { deliveryBoyId: req.user._id };

    if (status) {
      query.orderStatus = status;
    } else {
      // Default: show pending, assigned, and out_for_delivery
      query.orderStatus = { $in: ['assigned', 'out_for_delivery'] };
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone address')
      .populate('outletId', 'name address phone')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/delivery/orders/:id/out-for-delivery
// @desc    Mark order as out for delivery
// @access  Private (Delivery Boy)
router.put('/orders/:id/out-for-delivery', auth, authorize('delivery_boy'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryBoyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.orderStatus = 'out_for_delivery';
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/delivery/orders/:id/delivered
// @desc    Mark order as delivered and handle payment
// @access  Private (Delivery Boy)
router.put('/orders/:id/delivered', auth, authorize('delivery_boy'), async (req, res) => {
  try {
    const { paymentReceived } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryBoyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.orderStatus = 'delivered';
    order.deliveryDate = new Date();

    if (order.paymentMethod === 'cod') {
      order.paymentStatus = paymentReceived ? 'completed' : 'pending';
    } else {
      order.paymentStatus = 'completed';
    }

    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

