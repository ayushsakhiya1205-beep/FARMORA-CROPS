const Razorpay = require('razorpay');

/**
 * Razorpay Configuration
 * 
 * This file initializes Razorpay instance with environment variables
 * Keep the key secret secure and never expose it to frontend
 */

const razorpayConfig = {
  // Get Razorpay credentials from environment variables
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
  
  // Initialize Razorpay instance
  instance: null,
  
  /**
   * Initialize Razorpay instance
   * @returns {Razorpay} Razorpay instance
   */
  init() {
    if (!this.key_id || !this.key_secret) {
      console.error('❌ Razorpay credentials not found in environment variables');
      console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file');
      return null;
    }
    
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: this.key_id,
        key_secret: this.key_secret,
      });
      
      console.log('✅ Razorpay initialized successfully');
    }
    
    return this.instance;
  },
  
  /**
   * Get Razorpay instance
   * @returns {Razorpay} Razorpay instance
   */
  getInstance() {
    return this.instance || this.init();
  },
  
  /**
   * Get public key for frontend
   * @returns {string} Razorpay key ID
   */
  getPublicKey() {
    return this.key_id;
  },
  
  /**
   * Check if Razorpay is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(this.key_id && this.key_secret);
  }
};

module.exports = razorpayConfig;
