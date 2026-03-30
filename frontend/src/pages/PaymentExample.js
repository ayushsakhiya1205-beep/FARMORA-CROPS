import React, { useState, useEffect } from 'react';
import RazorpayPayment from '../components/RazorpayPayment';
import axios from 'axios';
import { API_URL } from '../config';

const PaymentExample = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Load order data (replace with your actual order loading logic)
  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    try {
      // Example: Get order from your orders API
      // Replace this with your actual order loading logic
      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        finalAmount: 500,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        items: [
          {
            name: 'Wheat',
            quantity: 2,
            price: 250
          }
        ]
      };
      
      setOrder(mockOrder);
      
      // Check existing payment status
      await checkPaymentStatus(mockOrder._id);
      
    } catch (error) {
      setError('Failed to load order data');
      console.error('Load order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payment/status/${orderId}`);
      
      if (response.data.success) {
        setPaymentStatus(response.data.data.paymentStatus);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentStatus('completed');
    console.log('Payment successful:', paymentData);
    
    // Show success message
    alert('Payment successful! Order confirmed.');
    
    // You can redirect to success page
    // window.location.href = `/order-success/${order._id}`;
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    console.error('Payment error:', errorMessage);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={loadOrderData} style={{
          backgroundColor: '#2c5530',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Order Payment</h1>
      
      {/* Order Details */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Status:</strong> {order.orderStatus}</p>
        
        <h3>Items:</h3>
        {order.items.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span>{item.name} (x{item.quantity})</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '18px',
          fontWeight: 'bold',
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '2px solid #2c5530'
        }}>
          <span>Total Amount:</span>
          <span>₹{order.finalAmount}</span>
        </div>
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div style={{
          backgroundColor: paymentStatus === 'completed' ? '#d4edda' : '#fff3cd',
          color: paymentStatus === 'completed' ? '#155724' : '#856404',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: `1px solid ${paymentStatus === 'completed' ? '#c3e6cb' : '#ffeaa7'}`
        }}>
          {paymentStatus === 'completed' ? (
            <div>
              <h3>✅ Payment Successful!</h3>
              <p>Your order has been confirmed and is being processed.</p>
            </div>
          ) : (
            <div>
              <h3>⏳ Payment Status: {paymentStatus}</h3>
              <p>Please complete the payment to confirm your order.</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Button */}
      {order.paymentStatus === 'pending' && paymentStatus !== 'completed' && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h2>Complete Payment</h2>
          <p>Click the button below to pay securely using Razorpay.</p>
          
          <RazorpayPayment
            orderId={order._id}
            amount={order.finalAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
          
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#666'
          }}>
            <p>Supported payment methods:</p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '10px'
            }}>
              <span>💳 Cards</span>
              <span>📱 UPI</span>
              <span>🏦 Net Banking</span>
              <span>👛 Wallets</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Test Information */}
      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '14px'
      }}>
        <h4>🧪 Test Payment Information:</h4>
        <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
        <p><strong>Expiry:</strong> Any future date</p>
        <p><strong>CVV:</strong> Any 3 digits</p>
        <p><strong>UPI:</strong> test@ybl</p>
      </div>
    </div>
  );
};

export default PaymentExample;
