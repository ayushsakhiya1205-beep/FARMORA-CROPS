import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getImageUrl } from '../config';
import AdvertisementBanner from '../components/AdvertisementBanner';
import HoverVideos from "../components/HoverVideos";
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categories data
  const categories = [
    {
      name: "Grains",
      image: "/image/catagory/1.png",
      slug: "grains"
    },
    {
      name: "Pulses", 
      image: "/image/catagory/2.png",
      slug: "pulses"
    },
    {
      name: "Masala",
      image: "/image/catagory/3.png", 
      slug: "masala"
    },
    {
      name: "Oil",
      image: "/image/catagory/4.png",
      slug: "oil"
    },
    {
      name: "Dry Fruits",
      image: "/image/catagory/5.png",
      slug: "dryfruits"
    },
    {
      name: "Other",
      image: "/image/catagory/6.png",
      slug: "others"
    }
  ];

  useEffect(() => {
    console.log('🌐 API URL:', API_URL);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching products from:', `${API_URL}/api/products`);
      const res = await axios.get(`${API_URL}/api/products`);
      console.log('✅ Raw response:', res.data);
      console.log('✅ Products array:', res.data);
      console.log('✅ Products fetched:', res.data.length, 'products');
      console.log('📦 First product:', res.data[0]);
      setProducts(res.data); // Backend returns array directly
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('🔗 API URL:', `${API_URL}/api/products`);
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <AdvertisementBanner />
      
      {/* Shop by Category Section */}
      <div className="shop-by-category">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-scroll">
          {categories.map((category) => (
            <Link 
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="category-card"
            >
              <div className="category-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="category-name">{category.name}</div>
            </Link>
          ))}
        </div>
      </div>

      <div class="stats-strip">
  <div class="pill green">
    <div class="inner">
      <img src="/image/reach/a.png" alt="Farmers"></img>
    </div>
    <div class="value">
      <h2>8 Lakh+</h2>
      <span>Farmers</span>
    </div>
  </div>

  <div class="pill orange">
    <div class="inner">
      <img src="/image/reach/b.png" alt="Retailers"></img>
    </div>
    <div class="value">
      <h2>1 Lakh+</h2>
      <span>Retailers</span>
    </div>
  </div>

  <div class="pill green">
    <div class="inner">
      <img src="/image/reach/c.png" alt="Resellers"></img>
    </div>
    <div class="value">
      <h2>20,000+</h2>
      <span>Resellers</span>
    </div>
  </div>

  <div class="pill darkgreen">
    <div class="inner">
      <img src="/image/reach/d.png" alt="Cities"></img>
    </div>
    <div class="value">
      <h2>120+</h2>
      <span>Cities Reached</span>
    </div>
  </div>
</div>


      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <>
              <div className="grid">
                {products
                  .filter(product => {
                    const name = product.name.toLowerCase();
                    return name.includes('ghee') || 
                           name.includes('badam') || 
                           name.includes('almond') || 
                           name.includes('honey') || 
                           name.includes('wheat') || 
                           name.includes('mug') || 
                           name.includes('moong') || 
                           name.includes('anjeer') || 
                           name.includes('fig');
                  })
                  .slice(0, 6)
                  .map(product => (
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
                      <p className="product-price">₹{product.price} / {product.unit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link to="/products" className="btn btn-secondary">View All Products</Link>
          </div>
        </div>
      </section>

<HoverVideos />

<section className="features">
  <div className="container">
    <h2>WHY US?</h2>

    <div className="features-grid">

      <div className="feature-card">
        <div className="feature-icon">
          <img src="/features/organic.jpg" alt="100% Organic" />
        </div>
        <h3>100% Organic</h3>
        <p>Naturally sourced, pure, and fully organic grains</p>
      </div>

      <div className="feature-card">
        <div className="feature-icon">
          <img src="/features/outlet.jpg" alt="Outlet Based" />
        </div>
        <h3>Outlet-Based</h3>
        <p>Orders fulfilled through your nearest physical outlet</p>
      </div>

      <div className="feature-card">
        <div className="feature-icon">
          <img src="/features/bulkdiscount.jpg" alt="Bulk Buying" />
        </div>
        <h3>Bulk Buying</h3>
        <p>Perfect for monthly essentials and family needs</p>
      </div>

      <div className="feature-card">
        <div className="feature-icon">
          <img src="/features/reminder.jpg" alt="Smart Reminders" />
        </div>
        <h3>Smart Reminders</h3>
        <p>Never run out with our intelligent restock reminders</p>
      </div>

    </div>
  </div>
</section>
    </div>
  );
};

export default Home;

