import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, userType, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated || !user || userType !== 'customer') {
      navigate('/login');
    }
  }, [isAuthenticated, user, userType, navigate]);

  const handleLogout = () => {
    // This will be handled by AuthContext logout
    window.location.href = '/login';
  };

  const handleViewProducts = () => {
    navigate('/products');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  const handleViewCart = () => {
    navigate('/cart');
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  if (!isAuthenticated || !user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Welcome, {user.name}!</h1>
          <p>Manage your orders and explore our products</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="container">
          <div className="user-info-card">
            <h2>Your Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Name:</strong> {user.name}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="info-item">
                <strong>Phone:</strong> {user.phone}
              </div>
              <div className="info-item">
                <strong>State:</strong> {user.state}
              </div>
              <div className="info-item">
                <strong>District:</strong> {user.district}
              </div>
              <div className="info-item">
                <strong>Address:</strong> {user.address}
              </div>
              <div className="info-item">
                <strong>Pincode:</strong> {user.pincode}
              </div>
            </div>
          </div>

          <div className="actions-grid">
            <div className="action-card" onClick={handleViewProducts}>
              <div className="action-icon">🛒</div>
              <h3>Browse Products</h3>
              <p>Explore our wide range of organic products</p>
            </div>

            <div className="action-card" onClick={handleViewCart}>
              <div className="action-icon">🛍️</div>
              <h3>My Cart</h3>
              <p>View and manage your shopping cart</p>
            </div>

            <div className="action-card" onClick={handleViewOrders}>
              <div className="action-icon">📦</div>
              <h3>My Orders</h3>
              <p>Track your order history and status</p>
            </div>

            <div className="action-card" onClick={handleViewProfile}>
              <div className="action-icon">👤</div>
              <h3>My Profile</h3>
              <p>Update your personal information</p>
            </div>
          </div>

          <div className="quick-stats">
            <h3>Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Active Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Completed Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Items in Cart</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
