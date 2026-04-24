import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { API_URL, getImageUrl } from '../config';
import './Orders.css';

const Orders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [updatedAddress, setUpdatedAddress] = useState({
    houseNo: '',
    street: '',
    area: '',
    pincode: '',
    district: '',
    state: '',
    mobileNumber: ''
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'customer') {
        fetchReminders();
      }
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reminders`);
      setReminders(res.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status`, {
        status: 'cancelled'
      });
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/orders/${orderId}`);
      fetchOrders();
      alert('Order deleted successfully!');
    } catch (error) {
      console.error('Delete order error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete order';
      
      // Provide more specific error messages
      if (errorMessage.includes('Only cancelled orders can be deleted')) {
        alert('Only cancelled orders can be deleted. Please cancel the order first.');
      } else if (errorMessage.includes('Access denied')) {
        alert('You can only delete your own orders.');
      } else if (errorMessage.includes('Order not found')) {
        alert('Order not found. It may have been already deleted.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const deleteAllOrders = async () => {
    if (!window.confirm('Are you sure you want to delete ALL orders? This action cannot be undone!')) {
      return;
    }
    try {
      // Filter to only delete cancelled orders (backend restriction)
      const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
      
      if (cancelledOrders.length === 0) {
        alert('No cancelled orders to delete. Only cancelled orders can be deleted.');
        return;
      }
      
      if (cancelledOrders.length < orders.length) {
        const proceed = window.confirm(
          `Only ${cancelledOrders.length} out of ${orders.length} orders can be deleted (only cancelled orders). Proceed with deleting ${cancelledOrders.length} cancelled orders?`
        );
        if (!proceed) {
          return;
        }
      }
      
      // Delete only cancelled orders
      const deletePromises = cancelledOrders.map(order => 
        axios.delete(`${API_URL}/api/orders/${order._id}`)
      );
      
      await Promise.all(deletePromises);
      
      fetchOrders();
      alert(`${cancelledOrders.length} cancelled orders deleted successfully!`);
    } catch (error) {
      console.error('Error deleting all orders:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete some orders. Please try again.';
      
      // Provide specific error messages
      if (errorMessage.includes('Only cancelled orders can be deleted')) {
        alert('Only cancelled orders can be deleted. Please cancel orders first before deleting.');
      } else {
        alert(errorMessage);
      }
    }
  };

  const startEditAddress = (order) => {
    console.log('🔍 DEBUG: Starting edit for order:', order);
    console.log('🔍 DEBUG: Order status:', order.orderStatus);
    console.log('🔍 DEBUG: Current user:', user);
    console.log('🔍 DEBUG: Delivery address:', order.deliveryAddress);
    
    setEditingAddress(order._id);
    
    // Direct mapping from existing address fields
    setUpdatedAddress({
      houseNo: order.deliveryAddress.address ? order.deliveryAddress.address.split(',')[0]?.trim() : '',
      street: order.deliveryAddress.address ? order.deliveryAddress.address.split(',')[1]?.trim() : '',
      area: order.deliveryAddress.address ? order.deliveryAddress.address.split(',')[2]?.trim() : '',
      taluka: order.deliveryAddress.address ? order.deliveryAddress.address.split(',')[3]?.trim() : '',
      city: order.deliveryAddress.city || '',
      state: order.deliveryAddress.state || '',
      district: order.deliveryAddress.city || '',
      pincode: order.deliveryAddress.pincode || '',
      mobileNumber: order.deliveryAddress.phone || ''
    });
  };

  const handleReorder = async (order) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Add all items to cart sequentially
      for (const item of order.items) {
        await axios.post(
          `${API_URL}/api/cart`,
          { productId: item.productId, quantity: item.quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      alert('Items from this order have been added to your cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error adding items to cart:', error);
      alert('Failed to reorder some items. They may be out of stock.');
    }
  };

  const cancelEditAddress = () => {
    setEditingAddress(null);
    setUpdatedAddress({
      houseNo: '',
      street: '',
      area: '',
      taluka: '',
      city: '',
      state: '',
      district: '',
      pincode: '',
      mobileNumber: ''
    });
  };

  const updateOrderAddress = async (orderId) => {
    try {
      console.log('🔍 DEBUG: Updating address for order:', orderId);
      console.log('🔍 DEBUG: Updated address data:', updatedAddress);
      
      // Basic validation - just check if at least some fields are filled
      if (!updatedAddress.houseNo && !updatedAddress.street && !updatedAddress.city && !updatedAddress.pincode) {
        alert('Please fill in at least the basic address information (House No, Street, City, or Pincode)');
        return;
      }

      console.log('🔍 DEBUG: Basic validation passed, sending request...');
      
      // Update order address
      const response = await axios.put(`${API_URL}/api/orders/${orderId}/address`, {
        deliveryAddress: updatedAddress
      });
      
      console.log('🔍 DEBUG: Address update response:', response.data);
      console.log('🔍 DEBUG: Updated order from response:', response.data.order);

      // Refresh orders list
      await fetchOrders();
      
      // Reset editing state
      cancelEditAddress();
      
      alert('Address updated successfully!');
    } catch (error) {
      console.error('🔍 DEBUG: Full error object:', error);
      console.error('🔍 DEBUG: Error response:', error.response);
      console.error('🔍 DEBUG: Error status:', error.response?.status);
      console.error('🔍 DEBUG: Error data:', error.response?.data);
      
      alert(error.response?.data?.message || 'Failed to update address');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      processing: '#9c27b0',
      assigned: '#00bcd4',
      out_for_delivery: '#3f51b5',
      delivered: '#114714',
      completed: '#28a745',
      archived: '#28a745',
      cancelled: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getPaymentMethodDisplay = (paymentMethod) => {
    const methods = {
      cod: { name: 'Cash on Delivery', icon: '💵', color: '#28a745' },
      card: { name: 'Credit/Debit Card', icon: '💳', color: '#114714' },
      upi: { name: 'UPI Payment', icon: '📱', color: '#6f42c1' },
      razorpay: { name: 'Razorpay Online Payment', icon: '💳', color: '#ff6b35' }
    };
    return methods[paymentMethod] || { name: 'Unknown', icon: '❓', color: '#666' };
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          {user?.role === 'customer' && orders.length > 0 && (
            <button
              onClick={deleteAllOrders}
              className="btn btn-danger delete-all-btn"
            >
              🗑️ Delete All
            </button>
          )}
        </div>
        
        {user?.role === 'customer' && reminders.length > 0 && (
          <div className="reminders-section">
            <h2>🔔 Smart Restock Reminders</h2>
            <div className="reminders-list">
              {reminders.map(reminder => (
                <div key={reminder._id} className="reminder-card">
                  <div className="reminder-info">
                    <h3>{reminder.productId?.name}</h3>
                    <p>You may run out soon! Time to restock.</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await axios.put(`${API_URL}/api/reminders/${reminder._id}/dismiss`);
                        fetchReminders();
                      } catch (error) {
                        console.error('Error dismissing reminder:', error);
                      }
                    }}
                    className="btn btn-secondary"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-badges">
                    <div className="payment-method-badge">
                      <span className="payment-icon">{getPaymentMethodDisplay(order.paymentMethod).icon}</span>
                      <span className="payment-text">{getPaymentMethodDisplay(order.paymentMethod).name}</span>
                    </div>
                    <div className="order-status">
                      <span
                        style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                      >
                        {order.orderStatus === 'archived' ? 'COMPLETED' : order.orderStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="order-item-image">
                        {(item.image || item.productId?.image) ? (
                          <img src={getImageUrl(item.image || item.productId?.image)} alt={item.name} />
                        ) : (
                          <div className="order-item-placeholder">🌾</div>
                        )}
                      </div>
                      <div className="order-item-info">
                        <span className="order-item-name">{item.name}</span>
                        <div className="order-item-meta">
                          <span className="order-item-qty">{item.quantity} {item.unit}</span>
                          <span className="order-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    <strong>Total: ₹{order.finalAmount ? order.finalAmount.toFixed(2) : order.totalAmount.toFixed(2)}</strong>
                    {order.deliveryFee > 0 && (
                      <span className="delivery-fee-info">
                        <span className="delivery-fee-label">Delivery Fee:</span>
                        <span className="delivery-fee-amount">₹{order.deliveryFee.toFixed(2)}</span>
                      </span>
                    )}
                  </div>
                  <div className="order-actions">
                    {user?.role === 'customer' && 
                     (order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="btn btn-danger"
                      >
                        Cancel Order
                      </button>
                    )}
                    {user?.role === 'customer' && order.orderStatus === 'cancelled' && (
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="btn btn-danger"
                        style={{ marginLeft: '10px' }}
                      >
                        🗑️ Delete Order
                      </button>
                    )}
                    {user?.role === 'customer' && (order.orderStatus === 'archived' || order.orderStatus === 'delivered' || order.orderStatus === 'completed') && (
                      <button
                        onClick={() => handleReorder(order)}
                        className="btn btn-primary"
                        style={{ marginLeft: '10px', backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
                      >
                        🔄 Reorder
                      </button>
                    )}
                  </div>
                </div>
                {order.deliveryAddress && (
                  <div className="order-address">
                    <div className="address-header">
                      <h4>📍 Delivery Address</h4>
                      {user?.role === 'customer' && 
                       (order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                        <button
                          onClick={() => startEditAddress(order)}
                          className="btn btn-secondary btn-small"
                        >
                          ✏️ Update Address
                        </button>
                      )}
                    </div>
                    
                    {editingAddress === order._id ? (
                      <div className="address-edit-form">
                        <div className="address-form-grid">
                          <input
                            type="text"
                            placeholder="House No"
                            value={updatedAddress.houseNo}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, houseNo: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="Street"
                            value={updatedAddress.street}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, street: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="Area"
                            value={updatedAddress.area}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, area: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="Taluka"
                            value={updatedAddress.taluka}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, taluka: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={updatedAddress.city}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, city: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={updatedAddress.state}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, state: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="District"
                            value={updatedAddress.district}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, district: e.target.value})}
                            className="form-control"
                          />
                          <input
                            type="text"
                            placeholder="Pincode"
                            value={updatedAddress.pincode}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, pincode: e.target.value})}
                            className="form-control"
                            maxLength={6}
                            pattern="[0-9]{6}"
                          />
                          <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={updatedAddress.mobileNumber}
                            onChange={(e) => setUpdatedAddress({...updatedAddress, mobileNumber: e.target.value})}
                            className="form-control"
                          />
                        </div>
                        <div className="address-edit-actions">
                          <button
                            onClick={() => updateOrderAddress(order._id)}
                            className="btn btn-primary btn-small"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={cancelEditAddress}
                            className="btn btn-danger btn-small"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="address-details">
                        <div className="address-text-block">
                          <p className="address-line">
                            {order.deliveryAddress.houseNo || order.deliveryAddress.address?.split(',')[0]?.trim() || ''}
                            {(order.deliveryAddress.houseNo || order.deliveryAddress.address?.split(',')[0]) && (order.deliveryAddress.street || order.deliveryAddress.address?.split(',')[1]) ? ', ' : ''}
                            {order.deliveryAddress.street || order.deliveryAddress.address?.split(',')[1]?.trim() || ''}
                          </p>
                          {(order.deliveryAddress.area || order.deliveryAddress.address?.split(',')[2]?.trim() || order.deliveryAddress.taluka || order.deliveryAddress.address?.split(',')[3]?.trim()) && (
                            <p className="address-line">
                              {order.deliveryAddress.area || order.deliveryAddress.address?.split(',')[2]?.trim() || ''}
                              {(order.deliveryAddress.area || order.deliveryAddress.address?.split(',')[2]) && (order.deliveryAddress.taluka || order.deliveryAddress.address?.split(',')[3]) ? ', ' : ''}
                              {order.deliveryAddress.taluka || order.deliveryAddress.address?.split(',')[3]?.trim() || ''}
                            </p>
                          )}
                          <p className="address-line">
                            {[order.deliveryAddress.city || order.deliveryAddress.district, order.deliveryAddress.state].filter(Boolean).join(', ')} 
                            {order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}
                          </p>
                          <p className="address-phone">
                            <strong>Mobile:</strong> {order.deliveryAddress.mobileNumber || order.deliveryAddress.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show user's current address if delivery address is not available */}
                {!order.deliveryAddress && user?.role === 'customer' && (
                  <div className="order-address">
                    <h4>📍 User Address</h4>
                    <div className="address-details">
                      <div className="address-text-block">
                        <p className="address-line">{user.address || 'N/A'}</p>
                        <p className="address-line">
                          {[user.city || user.district, user.state].filter(Boolean).join(', ')}
                          {user.pincode ? ` - ${user.pincode}` : ''}
                        </p>
                        <p className="address-phone">
                          <strong>Mobile:</strong> {user.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

