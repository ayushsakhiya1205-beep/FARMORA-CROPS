import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { districts, states } from '../data/districts';
import { API_URL, getImageUrl } from '../config';
import ReactLeafletMap from '../components/ReactLeafletMap';
import RazorpayPayment from '../components/RazorpayPayment';
import './Cart.css';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [quantityAnimations, setQuantityAnimations] = useState(new Map());
  const [buttonAnimations, setButtonAnimations] = useState(new Map());
  const [quantityInputs, setQuantityInputs] = useState(new Map());
  const [showMap, setShowMap] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    houseNo: '',
    street: '',
    area: '',
    pincode: '',
    district: '',
    taluka: '',
    state: '',
    mobileNumber: '',
    address: ''
  });
  
  // Updated payment method state
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [map, setMap] = useState(null);

  // Payment options configuration
  const paymentOptions = [
    { 
      id: 'cod', 
      label: 'Cash on Delivery (COD)', 
      description: 'Pay cash when your order is delivered',
      icon: '💵'
    },
    { 
      id: 'razorpay', 
      label: 'Online Payment', 
      description: 'Pay instantly via UPI, Cards, Net Banking & Wallets',
      icon: '💳'
    }
  ];

  // Delivery fee calculation function
  const calculateDeliveryFee = (orderAmount) => {
    if (orderAmount <= 300) {
      return { fee: 0, description: 'Free Delivery', finalAmount: orderAmount };
    }
    return { fee: 30, description: 'Standard Delivery', finalAmount: orderAmount + 30 };
  };

  // Load cart data
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setInitialLoad(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setCart(response.data.cart);
        
        // Initialize quantity inputs
        const inputs = new Map();
        response.data.cart.items.forEach(item => {
          inputs.set(item.productId._id, item.quantity.toString());
        });
        setQuantityInputs(inputs);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // Optimistic update
      const updatedItems = cart.items.map(item =>
        item.productId._id === productId ? { ...item, quantity: newQuantity } : item
      );
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setCart({ items: updatedItems, totalAmount: updatedTotal });

      // Update input
      setQuantityInputs(new Map(quantityInputs).set(productId, newQuantity.toString()));

      // Animate button
      setButtonAnimations(new Map(buttonAnimations).set(productId, true));
      setTimeout(() => {
        setButtonAnimations(new Map(buttonAnimations).set(productId, false));
      }, 300);

      await axios.put(
        `${API_URL}/api/cart/update`,
        { productId, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      fetchCart(); // Revert on error
    }
  };

  // Remove item
  const removeFromCart = async (productId) => {
    try {
      // Optimistic update
      const updatedItems = cart.items.filter(item => item.productId._id !== productId);
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setCart({ items: updatedItems, totalAmount: updatedTotal });

      await axios.delete(
        `${API_URL}/api/cart/remove/${productId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Error removing from cart:', error);
      fetchCart(); // Revert on error
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      await axios.delete(`${API_URL}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCart({ items: [], totalAmount: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Handle quantity input change
  const handleQuantityInputChange = (productId, value) => {
    const numValue = parseInt(value) || 1;
    setQuantityInputs(new Map(quantityInputs).set(productId, numValue.toString()));
  };

  // Handle quantity input blur
  const handleQuantityInputBlur = (productId, currentValue) => {
    const inputValue = quantityInputs.get(productId);
    const newQuantity = parseInt(inputValue) || 1;
    
    if (newQuantity !== currentValue) {
      updateQuantity(productId, newQuantity);
    } else {
      // Reset input to current value if invalid
      setQuantityInputs(new Map(quantityInputs).set(productId, currentValue.toString()));
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setSelectedLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        
        // Update address fields with reverse geocoding (simplified)
        setDeliveryAddress(prev => ({
          ...prev,
          area: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        alert('Unable to get your location. Please enter address manually.');
      }
    );
  };

  // Handle map location select
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setDeliveryAddress(prev => ({
      ...prev,
      area: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    }));
    setShowMapModal(false);
  };

  // Validate delivery address
  const validateDeliveryAddress = () => {
    if (paymentMethod === 'cod') {
      return deliveryAddress.houseNo && deliveryAddress.area && deliveryAddress.district && 
             deliveryAddress.state && deliveryAddress.pincode && deliveryAddress.mobileNumber;
    } else {
      // For online payment, minimal validation
      return deliveryAddress.area && deliveryAddress.mobileNumber;
    }
  };

  // Razorpay payment success handler
  const handleRazorpaySuccess = (paymentData) => {
    console.log('✅ Razorpay payment successful:', paymentData);
    
    // Redirect to order success page
    navigate('/order-success', { 
      state: { 
        order: { 
          _id: createdOrderId, 
          paymentStatus: 'completed',
          paymentMethod: 'razorpay',
          ...paymentData 
        } 
      } 
    });
  };

  // Razorpay payment error handler
  const handleRazorpayError = (errorMessage) => {
    console.error('❌ Razorpay payment error:', errorMessage);
    alert('Payment failed: ' + errorMessage);
    
    // Reset to show payment options again
    setShowPaymentSection(false);
  };

  // Place order function
  const placeOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!validateDeliveryAddress()) {
      alert('Please fill in all required delivery details');
      return;
    }

    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }

    try {
      setOrderPlacing(true);
      
      const deliveryFee = calculateDeliveryFee(cart.totalAmount);
      const totalAmount = deliveryFee.finalAmount;
      
      // Create order data
      const orderData = {
        customerId: user.id,
        outletId: selectedOutlet._id,
        items: cart.items.map(item => ({
          productId: item.productId._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit
        })),
        totalAmount: cart.totalAmount,
        deliveryFee: deliveryFee.fee,
        finalAmount: totalAmount,
        deliveryAddress,
        paymentMethod // Will be 'cod' or 'razorpay'
      };

      console.log('🔍 DEBUG: Creating order with payment method:', paymentMethod);
      
      const response = await axios.post(`${API_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        const newOrder = response.data.order;
        
        if (paymentMethod === 'cod') {
          // COD: Order is complete, redirect to success
          console.log('✅ COD Order placed successfully');
          navigate('/order-success', { state: { order: newOrder } });
          
        } else if (paymentMethod === 'razorpay') {
          // Razorpay: Show payment component
          console.log('✅ Order created, initiating payment');
          setCreatedOrderId(newOrder._id);
          setShowPaymentSection(true);
        }
      } else {
        alert('Failed to place order: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('❌ Order placement error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setOrderPlacing(false);
    }
  };

  // Outlet selection (simplified for this example)
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/outlet`);
      if (response.data.success) {
        setOutlets(response.data.outlets);
        if (response.data.outlets.length > 0) {
          setSelectedOutlet(response.data.outlets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  if (initialLoad) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cart-empty">
        <h2>Please Login</h2>
        <p>You need to login to view your cart.</p>
        <button onClick={() => navigate('/login')} className="login-button">
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="loading-spinner"></div>
        <p>Updating cart...</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <p>Add some delicious products to your cart!</p>
        <button onClick={() => navigate('/products')} className="shop-button">
          Shop Now
        </button>
      </div>
    );
  }

  const deliveryFee = calculateDeliveryFee(cart.totalAmount);

  return (
    <div className="cart">
      <div className="cart-container">
        {/* Cart Items */}
        <div className="cart-items">
          <h2>Your Cart ({cart.items.length} items)</h2>
          
          {cart.items.map((item, index) => (
            <div key={item.productId._id} className="cart-item">
              <div className="item-image">
                {item.productId.image ? (
                  <img src={getImageUrl(item.productId.image)} alt={item.name} />
                ) : (
                  <div className="item-placeholder">🌾</div>
                )}
              </div>
              
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-price">₹{item.price}/{item.unit}</p>
                
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                    className="quantity-btn decrease"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    value={quantityInputs.get(item.productId._id) || item.quantity}
                    onChange={(e) => handleQuantityInputChange(item.productId._id, e.target.value)}
                    onBlur={() => handleQuantityInputBlur(item.productId._id, item.quantity)}
                    className="quantity-input"
                    min="1"
                    max="99"
                  />
                  
                  <button
                    onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                    className={`quantity-btn increase ${buttonAnimations.get(item.productId._id) ? 'animate' : ''}`}
                  >
                    +
                  </button>
                </div>
                
                <div className="item-subtotal">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
                
                <button
                  onClick={() => removeFromCart(item.productId._id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          
          <div className="cart-actions">
            <button onClick={clearCart} className="clear-cart-btn">
              Clear Cart
            </button>
            <button onClick={() => navigate('/products')} className="continue-shopping-btn">
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          {/* Outlet Selection */}
          <div className="outlet-selection">
            <h3>Select Outlet</h3>
            <select 
              value={selectedOutlet?._id || ''} 
              onChange={(e) => {
                const outlet = outlets.find(o => o._id === e.target.value);
                setSelectedOutlet(outlet);
              }}
              className="outlet-select"
            >
              <option value="">Select an outlet</option>
              {outlets.map(outlet => (
                <option key={outlet._id} value={outlet._id}>
                  {outlet.name} - {outlet.address.city}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Address */}
          <div className="delivery-address">
            <h3>Delivery Address</h3>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="House Number/Flat Number"
                value={deliveryAddress.houseNo}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, houseNo: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Street/Area"
                value={deliveryAddress.area}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, area: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="District"
                  value={deliveryAddress.district}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, district: e.target.value})}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="State"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="PIN Code"
                  value={deliveryAddress.pincode}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                  maxLength={6}
                />
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={deliveryAddress.mobileNumber}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, mobileNumber: e.target.value})}
                  maxLength={10}
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="location-btn"
            >
              {locationLoading ? 'Getting Location...' : '📍 Use Current Location'}
            </button>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-methods">
            <h3>Payment Method</h3>
            
            {paymentOptions.map((option) => (
              <label key={option.id} className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value={option.id}
                  checked={paymentMethod === option.id}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setShowPaymentSection(false);
                  }}
                />
                <div className="payment-option-content">
                  <span className="payment-label">
                    <span className="payment-icon">{option.icon}</span>
                    {option.label}
                  </span>
                  <span className="payment-description">{option.description}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Razorpay Payment Section */}
          {paymentMethod === 'razorpay' && showPaymentSection && (
            <div className="razorpay-payment-section">
              <h4>Complete Online Payment</h4>
              <p>Click the button below to pay securely using Razorpay</p>
              
              <RazorpayPayment
                orderId={createdOrderId}
                amount={deliveryFee.finalAmount}
                onSuccess={handleRazorpaySuccess}
                onError={handleRazorpayError}
              />
              
              <div className="supported-methods">
                <p>Supported payment methods:</p>
                <div className="payment-methods-list">
                  <span>💳 Credit/Debit Cards</span>
                  <span>📱 UPI (PhonePe, GPay, Paytm)</span>
                  <span>🏦 Net Banking</span>
                  <span>👛 Wallets</span>
                </div>
              </div>
              
              <div className="test-info">
                <h5>🧪 Test Payment Information:</h5>
                <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                <p><strong>Expiry:</strong> Any future date</p>
                <p><strong>CVV:</strong> Any 3 digits</p>
                <p><strong>UPI:</strong> test@ybl</p>
              </div>
            </div>
          )}

          {/* COD Payment Info */}
          {paymentMethod === 'cod' && (
            <div className="payment-info">
              <p>💵 Pay cash when your order is delivered</p>
            </div>
          )}

          {/* Order Summary */}
          <div className="summary-card">
            <h3>Order Summary</h3>
            
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{cart.totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery:</span>
              <span>
                {deliveryFee.fee === 0 ? 'Free' : `₹${deliveryFee.fee.toFixed(2)}`}
              </span>
            </div>
            
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{deliveryFee.finalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={paymentMethod === 'razorpay' && showPaymentSection ? 
              () => setShowPaymentSection(false) : // Reset to show payment options
              placeOrder // Create order or proceed with COD
            }
            disabled={orderPlacing || cart.items.length === 0}
            className="place-order-button"
          >
            {orderPlacing ? (
              <span>Processing...</span>
            ) : paymentMethod === 'razorpay' && showPaymentSection ? (
              <span>Change Payment Method</span>
            ) : (
              <span>
                {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Place Order (COD)'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
