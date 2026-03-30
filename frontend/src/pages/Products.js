import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getImageUrl } from '../config';
import StarRating from '../components/StarRating';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cartLoading, setCartLoading] = useState({});
  const location = useLocation();

  // Read category from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    console.log('🔍 URL search params:', location.search);
    console.log('🔍 Category param from URL:', categoryParam);
    
    if (categoryParam && categoryParam.trim() !== '') {
      console.log('🔍 Setting category to:', categoryParam);
      setCategory(categoryParam.trim());
    } else {
      console.log('🔍 No category param found');
    }
  }, [location.search]);

  useEffect(() => {
    // Add a small delay to ensure category state is properly set
    const timer = setTimeout(() => {
      fetchProducts();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [category, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Debug: Log current category state
      console.log('🔍 Current category state:', category);
      console.log('🔍 Current search state:', search);
      
      if (category && category.trim() !== '') {
        params.category = category.trim();
        console.log('🔍 Setting category filter:', category);
      }
      if (search && search.trim() !== '') {
        params.search = search.trim();
        console.log('🔍 Setting search filter:', search);
      }
      
      console.log('🔄 Fetching products with params:', params);
      console.log('🌐 API URL:', `${API_URL}/api/products`);
      console.log('📡 Full request URL:', `${API_URL}/api/products?${new URLSearchParams(params).toString()}`);
      
      const res = await axios.get(`${API_URL}/api/products`, { params });
      console.log('✅ Raw response:', res.data);
      console.log('✅ Products length:', res.data.length);
      console.log('✅ Filtered products count:', res.data.filter(p => p.category === category).length);
      setProducts(res.data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error response:', error.response?.data);
      setLoading(false);
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation(); // Prevent navigation to product detail
    e.preventDefault(); // Prevent Link navigation
    
    setCartLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add items to cart');
        return;
      }

      await axios.post(
        `${API_URL}/api/cart`,
        { productId, quantity: 1 },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Show success feedback
      alert('✅ Product added to cart successfully!');
      
      // Optionally update UI state to show cart updated
      // You could add a cart count state here if needed
    } catch (error) {
      console.error('❌ Add to Cart Error:', error);
      console.error('❌ Error Response:', error.response?.data);
      console.error('❌ Error Status:', error.response?.status);
      console.error('❌ Error Message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart';
      alert(`❌ ${errorMessage}`);
    } finally {
      setCartLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="products-page">
      <div className="container">
        <h1>Our Products</h1>
        <p className="page-subtitle">100% Organic Grains, Pulses, Masala, Oils, Dry Fruits & More</p>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="category-filters">
            <button
              className={category === '' ? 'active' : ''}
              onClick={() => setCategory('')}
            >
              All
            </button>
            <button
              className={category === 'grains' ? 'active' : ''}
              onClick={() => setCategory('grains')}
            >
              Grains
            </button>
            <button
              className={category === 'pulses' ? 'active' : ''}
              onClick={() => setCategory('pulses')}
            >
              Pulses
            </button>
            <button
              className={category === 'masala' ? 'active' : ''}
              onClick={() => setCategory('masala')}
            >
              Masala
            </button>
            <button
              className={category === 'oil' ? 'active' : ''}
              onClick={() => setCategory('oil')}
            >
              Oil
            </button>
            <button
              className={category === 'dryfruits' ? 'active' : ''}
              onClick={() => setCategory('dryfruits')}
            >
              Dry Fruits
            </button>
            <button
              className={category === 'others' ? 'active' : ''}
              onClick={() => setCategory('others')}
            >
              Others
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          <div className="grid">
            {products.map(product => (
              <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                <div className="product-image">
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">🌾</div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">₹{product.price} / {product.unit}</p>
                  {product.isOrganic && (
                    <span className="organic-badge">🌿 Organic</span>
                  )}
                  <StarRating
                    productId={product._id}
                    showAverage={true}
                    averageRating={product.averageRating || 0}
                    totalRatings={product.totalRatings || 0}
                    readOnly={true}
                  />
                  <div className="product-actions">
                    <button
                      onClick={(e) => handleAddToCart(e, product._id)}
                      disabled={cartLoading[product._id]}
                      className="btn btn-add-to-cart"
                    >
                      {cartLoading[product._id] ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

