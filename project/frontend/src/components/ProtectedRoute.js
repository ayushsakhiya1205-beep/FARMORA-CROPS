import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userType, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // Check role-based access
  const userRole = user.role || (userType === 'outlet' ? 'outletManager' : 'customer');
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user type
    if (userType === 'outlet') {
      return <Navigate to="/outlet/dashboard" />;
    } else {
      return <Navigate to="/customer/dashboard" />;
    }
  }

  return children;
};

export default ProtectedRoute;

