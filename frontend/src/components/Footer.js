import React from 'react';
import { FaInstagram, FaFacebookF, FaYoutube, FaLinkedinIn } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-col footer-about">
            <img src="/logo.jpeg" alt="Farmora Crops" className="footer-logo" />
            <p className="footer-text">
              Farmora Crops brings pure, organic grains, pulses, oils and spices
              from trusted outlets near you. Our promise is purity, freshness,
              and a seamless outlet-based experience for every family.
            </p>
            <p className="footer-tagline">The Promise of Purity</p>
          </div>

          <div className="footer-col">
            <h3 className="footer-title">Crop Solutions</h3>
            <ul className="footer-links">
              <li><a href="/products?category=grain">Grain</a></li>
              <li><a href="/products?category=pulse">Pulses </a></li>
              <li><a href="/products?category=oil">Oils</a></li>
              <li><a href="/products?category=masala">Masala</a></li>
              <li><a href="/products?category=other">Other organic</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-title">Farmora</h3>
            <ul className="footer-links">
              <li><a href="/products">Product Range</a></li>
              <li><a href="/cart">My Cart</a></li>
              <li><a href="/orders">My Orders</a></li>
              <li><a href="/profile">My Profile</a></li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h3 className="footer-title">Contact Us</h3>
            <p className="footer-company-name">Farmora Crops</p>
            <ul className="footer-contact-list">
              <li>
                Outlet-based distribution across Gujarat
              </li>
              <li>Phone: +91 8733040849</li>
              <li>Email: farmoracrops@gmail.com</li>
            </ul>

            <ul className="footer-social-links">
              <li><a href="#" aria-label="Instagram"><FaInstagram /></a></li>
              <li><a href="#" aria-label="Facebook"><FaFacebookF /></a></li>
              <li><a href="#" aria-label="YouTube"><FaYoutube /></a></li>
              <li><a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-row">
          <p className="footer-copy">
            © {currentYear} Farmora Crops. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
