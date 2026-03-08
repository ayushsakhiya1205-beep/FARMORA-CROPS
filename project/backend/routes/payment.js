const express = require('express');
const { body } = require('express-validator');
const { createOrder, verifyPayment, getPaymentStatus } = require('../controllers/paymentController');

const router = express.Router();

/**
 * Payment Routes
 * 
 * Handles all payment-related endpoints for Razorpay integration
 */

// --------------------------------------
// CREATE RAZORPAY ORDER
// --------------------------------------
router.post(
  '/create-order',
  [
    body('orderId')
      .notEmpty()
      .withMessage('Order ID is required')
      .isMongoId()
      .withMessage('Invalid order ID format')
  ],
  createOrder
);

// --------------------------------------
// VERIFY PAYMENT
// --------------------------------------
router.post(
  '/verify',
  [
    body('razorpay_payment_id')
      .notEmpty()
      .withMessage('Razorpay payment ID is required'),
    body('razorpay_order_id')
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('razorpay_signature')
      .notEmpty()
      .withMessage('Razorpay signature is required')
  ],
  verifyPayment
);

// --------------------------------------
// GET PAYMENT STATUS
// --------------------------------------
router.get(
  '/status/:orderId',
  getPaymentStatus
);

module.exports = router;
