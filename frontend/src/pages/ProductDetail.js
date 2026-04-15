import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { API_URL, getImageUrl } from '../config';
import StarRating from '../components/StarRating';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // quantity = number of cans for oil, normal units for others
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products/${id}`);
      const prod = res.data;

      setProduct(prod);

      // Oil starts with 1 can
      if (prod.category === "oil") {
        setQuantity(1);
      } else {
        setQuantity(1);
      }

      // Fetch recommendations
      try {
        const allRes = await axios.get(`${API_URL}/api/products`);
        const allProducts = allRes.data;
        const others = allProducts.filter(p => p._id !== id);
        const shuffled = others.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  // HANDLE QUANTITY LOGIC
  const handleQuantityChange = (value) => {
    let qty = Number(value);

    if (qty < 1) qty = 1;

    // Oil → qty means can count, so allow 1,2,3,4...
    if (product.category === "oil") {
      qty = Math.floor(qty); // no decimal cans
    }

    setQuantity(qty);
  };

  // Increment quantity
  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  // Handle direct input
  const handleDirectInput = (value) => {
    // Allow empty string for typing
    if (value === '') {
      setQuantity('');
      return;
    }
    
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      handleQuantityChange(value);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // backend receives CAN count
      await axios.post(`${API_URL}/api/cart`, {
        productId: id,
        quantity: quantity
      });

      setMessage('Product added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add to cart');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (!product) return <div className="container">Product not found</div>;

  // Oil kg = cans × 15
  const totalKg = product.category === "oil" ? quantity * 15 : quantity;

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">

          <div className="product-image-section">
            {product.image ? (
              <img src={getImageUrl(product.image)} alt={product.name} />
            ) : (
              <div className="product-placeholder-large">🌾</div>
            )}
          </div>

          <div className="product-details-section">
            <h1>{product.name}</h1>

            <div className="product-meta">
              <span className="category-badge">{product.category}</span>
              {product.isOrganic && <span className="organic-badge">🌿 100% Organic</span>}
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-price-section">
              <span className="price">₹{product.price}</span>

              {product.category === "oil" ? (
                <span className="unit">/ 15kg can</span>
              ) : (
                <span className="unit">/ {product.unit}</span>
              )}
            </div>

            {/* Rating Section */}
            <StarRating
              productId={product._id}
              showAverage={true}
              averageRating={product.averageRating || 0}
              totalRatings={product.totalRatings || 0}
              onRatingChange={(newAverage, userRating) => {
                // Update product with new rating
                setProduct(prev => ({
                  ...prev,
                  averageRating: newAverage,
                  totalRatings: prev.totalRatings + (userRating ? 0 : 1)
                }));
              }}
            />

            {product.isAvailable ? (
              <div className="add-to-cart-section">

                <div className="quantity-selector">
                  {product.category === "oil" ? (
                    <>
                      <label>Cans (15kg each):</label>
                      <div className="quantity-input-group">
                        <button 
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="quantity-btn quantity-btn-decrement"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={quantity}
                          min={1}
                          onChange={e => handleDirectInput(e.target.value)}
                          onBlur={() => handleQuantityChange(quantity || 1)}
                          className="quantity-input"
                          maxLength={3}
                        />
                        <button 
                          onClick={incrementQuantity}
                          className="quantity-btn quantity-btn-increment"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p><b>Total Weight:</b> {totalKg} kg</p>
                    </>
                  ) : (
                    <>
                      <label>Quantity ({product.unit}):</label>
                      <div className="quantity-input-group">
                        <button 
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="quantity-btn quantity-btn-decrement"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={quantity}
                          min={1}
                          onChange={e => handleDirectInput(e.target.value)}
                          onBlur={() => handleQuantityChange(quantity || 1)}
                          className="quantity-input"
                          maxLength={3}
                        />
                        <button 
                          onClick={incrementQuantity}
                          className="quantity-btn quantity-btn-increment"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={handleAddToCart} className="btn btn-primary btn-large">
                  Add to Cart
                </button>

                {message && (
                  <p className={message.includes('added') ? 'success-message' : 'error-message'}>
                    {message}
                  </p>
                )}

              </div>
            ) : (
              <div className="unavailable">Currently Unavailable</div>
            )}

          </div>

        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>You Might Also Like</h2>
            <div className="recommendations-grid">
              {recommendations.map(item => (
                <Link key={item._id} to={`/products/${item._id}`} className="recommendation-card" onClick={() => window.scrollTo(0,0)}>
                  <div className="rec-image">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} />
                    ) : (
                      <div className="rec-placeholder">🌾</div>
                    )}
                  </div>
                  <div className="rec-info">
                    <h4>{item.name}</h4>
                    <p>₹{item.price} / {item.unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;
