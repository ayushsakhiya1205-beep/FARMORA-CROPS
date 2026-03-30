// Delivery Fee Configuration with Multiple Tiers
const DELIVERY_FEE_CONFIG = {
  // Tier 1: Free delivery
  TIER_1_THRESHOLD: 300,
  TIER_1_FEE: 0,
  TIER_1_DESCRIPTION: 'Free Delivery',
  
  // Tier 2: Small delivery fee
  TIER_2_MIN: 301,
  TIER_2_MAX: 1000,
  TIER_2_FEE: 210,
  TIER_2_DESCRIPTION: 'Standard Delivery',
  
  // Tier 3: Medium delivery fee
  TIER_3_MIN: 1001,
  TIER_3_MAX: 2000,
  TIER_3_FEE: 150,
  TIER_3_DESCRIPTION: 'Express Delivery',
  
  // Tier 4: Large delivery fee
  TIER_4_MIN: 2001,
  TIER_4_MAX: 5000,
  TIER_4_FEE: 100,
  TIER_4_DESCRIPTION: 'Premium Delivery',
  
  // Currency
  CURRENCY: '₹'
};

// Calculate delivery fee based on order amount with tiered structure
const calculateDeliveryFee = (orderAmount) => {
  console.log('💰 Calculating delivery fee for order amount:', orderAmount);
  
  // Tier 1: Free delivery (≤ 300)
  if (orderAmount <= DELIVERY_FEE_CONFIG.TIER_1_THRESHOLD) {
    console.log('✅ Tier 1 - Free delivery applied');
    return {
      fee: DELIVERY_FEE_CONFIG.TIER_1_FEE,
      description: DELIVERY_FEE_CONFIG.TIER_1_DESCRIPTION,
      finalAmount: orderAmount,
      tier: 1
    };
  }
  
  // Tier 2: Small delivery fee (301-1000)
  if (orderAmount > DELIVERY_FEE_CONFIG.TIER_1_THRESHOLD && orderAmount <= DELIVERY_FEE_CONFIG.TIER_2_MAX) {
    console.log('✅ Tier 2 - Small delivery fee applied');
    return {
      fee: DELIVERY_FEE_CONFIG.TIER_2_FEE,
      description: DELIVERY_FEE_CONFIG.TIER_2_DESCRIPTION,
      finalAmount: orderAmount + DELIVERY_FEE_CONFIG.TIER_2_FEE,
      tier: 2
    };
  }
  
  // Tier 3: Medium delivery fee (1001-2000)
  if (orderAmount > DELIVERY_FEE_CONFIG.TIER_2_MAX && orderAmount <= DELIVERY_FEE_CONFIG.TIER_3_MAX) {
    console.log('✅ Tier 3 - Medium delivery fee applied');
    return {
      fee: DELIVERY_FEE_CONFIG.TIER_3_FEE,
      description: DELIVERY_FEE_CONFIG.TIER_3_DESCRIPTION,
      finalAmount: orderAmount + DELIVERY_FEE_CONFIG.TIER_3_FEE,
      tier: 3
    };
  }
  
  // Tier 4: Large delivery fee (> 2000)
  if (orderAmount > DELIVERY_FEE_CONFIG.TIER_3_MAX) {
    console.log('✅ Tier 4 - Large delivery fee applied');
    return {
      fee: DELIVERY_FEE_CONFIG.TIER_4_FEE,
      description: DELIVERY_FEE_CONFIG.TIER_4_DESCRIPTION,
      finalAmount: orderAmount + DELIVERY_FEE_CONFIG.TIER_4_FEE,
      tier: 4
    };
  }
  
  // Default case (should not reach here, but just in case)
  console.log('⚠️ Order amount exceeds maximum tier, applying maximum fee');
  return {
    fee: DELIVERY_FEE_CONFIG.TIER_4_FEE,
    description: DELIVERY_FEE_CONFIG.TIER_4_DESCRIPTION,
    finalAmount: orderAmount + DELIVERY_FEE_CONFIG.TIER_4_FEE,
    tier: 4
  };
};

module.exports = {
  DELIVERY_FEE_CONFIG,
  calculateDeliveryFee
};
