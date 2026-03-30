const crypto = require('crypto');
const Order = require('../models/Order');
const razorpayConfig = require('../config/razorpay');

/**
 * Payment Controller
 * 
 * Handles Razorpay payment integration including:
 * - Creating Razorpay orders
 * - Verifying payment signatures
 * - Updating order payment status
 */

/**
 * Create Razorpay Order
 * 
 * Creates a new Razorpay order for the given order ID
 * Converts rupees to paise (amount × 100)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Check if Razorpay is configured
    if (!razorpayConfig.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured'
      });
    }

    // Fetch order from database
    const order = await Order.findById(orderId)
      .populate('customerId', 'name email')
      .populate('outletId', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Get total amount from order (convert rupees to paise)
    const amountInPaise = Math.round(order.finalAmount * 100);

    // Create Razorpay order
    const razorpay = razorpayConfig.getInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId.toString(),
      notes: {
        customerId: order.customerId._id.toString(),
        outletId: order.outletId._id.toString(),
        orderAmount: order.finalAmount
      }
    });

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Return Razorpay order details to frontend
    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayConfig.getPublicKey(),
        orderDetails: {
          orderId: order._id,
          totalAmount: order.finalAmount,
          customerName: order.customerId.name,
          outletName: order.outletId.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

/**
 * Verify Payment
 * 
 * Verifies Razorpay payment signature using HMAC SHA256
 * Updates order status based on verification result
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'All payment details are required'
      });
    }

    // Find order by Razorpay order ID
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this payment'
      });
    }

    // Generate signature for verification
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Verify signature
    const isSignatureValid = generatedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Signature matches - payment is successful
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
      order.paymentMethod = 'razorpay';  // Fixed: Changed from 'online' to 'razorpay'
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      order.paymentDate = new Date();
      
      await order.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          paymentId: razorpay_payment_id
        }
      });

    } else {
      // Signature verification failed
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: 'Invalid signature'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Get Payment Status
 * 
 * Returns the current payment status of an order
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId)
      .select('paymentStatus orderStatus paymentMethod finalAmount razorpayOrderId razorpayPaymentId paymentDate');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        amount: order.finalAmount,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        paymentDate: order.paymentDate
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus
};
