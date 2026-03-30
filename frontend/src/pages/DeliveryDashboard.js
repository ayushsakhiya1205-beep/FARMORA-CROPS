import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/delivery/orders');
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const markOutForDelivery = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/delivery/orders/${orderId}/out-for-delivery`);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const markDelivered = async (orderId) => {
    const paymentReceived = window.confirm('Has payment been received?');
    try {
      await axios.put(`http://localhost:5000/api/delivery/orders/${orderId}/delivered`, {
        paymentReceived
      });
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark as delivered');
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
      cancelled: '#f44336'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Delivery Boy Dashboard</h1>

        <div className="orders-section">
          <h2>Assigned Orders</h2>
          {orders.length === 0 ? (
            <div className="no-orders">No orders assigned</div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order._id.slice(-8)}</h3>
                      <p><strong>Customer:</strong> {order.customerId?.name}</p>
                      <p><strong>Phone:</strong> {order.customerId?.phone}</p>
                      <p><strong>Address:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}</p>
                    </div>
                    <div className="order-status">
                      <span style={{ backgroundColor: getStatusColor(order.orderStatus) }}>
                        {order.orderStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span>{item.name}</span>
                        <span>{item.quantity} {item.unit}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
                      {order.paymentMethod === 'cod' && (
                        <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          Payment: Cash on Delivery
                        </p>
                      )}
                      {order.paymentMethod === 'razorpay' && (
                        <p style={{ fontSize: '14px', color: '#ff6b35', marginTop: '5px' }}>
                          Payment: Razorpay Online Payment
                        </p>
                      )}
                    </div>
                    <div className="order-actions">
                      {order.orderStatus === 'assigned' && (
                        <button
                          onClick={() => markOutForDelivery(order._id)}
                          className="btn btn-primary"
                        >
                          Out for Delivery
                        </button>
                      )}
                      {order.orderStatus === 'out_for_delivery' && (
                        <button
                          onClick={() => markDelivered(order._id)}
                          className="btn btn-primary"
                        >
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;

