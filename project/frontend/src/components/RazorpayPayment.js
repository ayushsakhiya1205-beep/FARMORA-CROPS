import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const RazorpayPayment = ({ orderId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script on component mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = async () => {
    // Check if already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      onError('Failed to load payment gateway');
    };
    
    document.body.appendChild(script);
  };

  // Create Razorpay Order
  const handlePayment = async () => {
    if (!razorpayLoaded) {
      onError('Payment gateway not loaded');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(`${API_URL}/api/payment/create-order`, {
        orderId: orderId
      });

      if (response.data.success) {
        openRazorpayCheckout(response.data.data);
      } else {
        onError(response.data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      onError('Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  // Open Razorpay Checkout
  const openRazorpayCheckout = (orderData) => {
    const options = {
      key: orderData.keyId, // Razorpay key ID from backend
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'Farmora Crops',
      description: `Payment for Order #${orderId}`,
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        console.log('Payment successful:', response);
        // Verify payment with backend
        await verifyPayment(response);
      },
      modal: {
        ondismiss: function () {
          console.log('Payment cancelled');
          onError('Payment cancelled by user');
        },
        escape: true,
        backdropclose: false,
        handleback: true
      },
      prefill: {
        name: '', // You can prefill from user context
        email: '',
        contact: ''
      },
      theme: {
        color: '#2c5530', // Your brand color
        backdrop_color: '#ffffff'
      },
      notes: {
        order_id: orderId
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Verify Payment with Backend
  const verifyPayment = async (response) => {
    try {
      setLoading(true);
      
      const verifyResponse = await axios.post(`${API_URL}/api/payment/verify`, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyResponse.data.success) {
        console.log('Payment verified:', verifyResponse.data.data);
        onSuccess(verifyResponse.data.data);
      } else {
        onError('Payment verification failed');
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      onError('Payment verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="razorpay-payment">
      <button
        onClick={handlePayment}
        disabled={loading || !razorpayLoaded}
        className="razorpay-pay-button"
        style={{
          backgroundColor: loading || !razorpayLoaded ? '#ccc' : '#2c5530',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '5px',
          cursor: loading || !razorpayLoaded ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s',
          minWidth: '150px'
        }}
      >
        {loading ? (
          <span>Processing...</span>
        ) : !razorpayLoaded ? (
          <span>Loading...</span>
        ) : (
          <span>Pay ₹{amount}</span>
        )}
      </button>
      
      {!razorpayLoaded && (
        <p style={{ 
          color: '#666', 
          fontSize: '14px', 
          marginTop: '8px',
          textAlign: 'center'
        }}>
          Loading payment options...
        </p>
      )}
    </div>
  );
};

export default RazorpayPayment;
