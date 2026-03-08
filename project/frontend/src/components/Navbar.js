import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/navbarbackground.jpeg)` }}>
      <div className="container">
        <div className="navbar-content">
        <Link to="/" className="navbar-brand">
  <img src="/logo.jpeg" alt="Farmora Crops" className="navbar-logo" />

  <span className="brand-text">
    <span className="brand-name">Farmora</span>
    <span className="brand-sub">Crops</span>
  </span>
</Link>

          <div className="navbar-links">
            <Link to="/products">Products</Link>
            {user ? (
              <>
                {user.role === 'customer' && (
                  <>
                    <Link to="/cart">Cart</Link>
                    <Link to="/orders">My Orders</Link>
                  </>
                )}
                {user.role === 'outletManager' && (
                  <Link to="/outlet/dashboard">Dashboard</Link>
                )}
                {user.role === 'delivery_boy' && (
                  <Link to="/delivery/dashboard">Dashboard</Link>
                )}
                <Link to="/profile" className="user-name">{user.name}</Link>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

