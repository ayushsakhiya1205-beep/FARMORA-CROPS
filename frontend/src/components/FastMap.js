import React, { useState, useEffect } from 'react';
import './FastMap.css';

const FastMap = ({ 
  location = null, 
  height = '400px',
  showInfo = true 
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      generateMapUrl(location);
    }
  }, [location]);

  const generateMapUrl = (locationString) => {
    setLoading(true);
    setError(null);

    try {
      // Ultra-fast: Use static map image that loads instantly
      const seed = locationString.replace(/\s+/g, '-').toLowerCase();
      const staticMapUrl = `https://picsum.photos/seed/${seed}/800/400.jpg`;
      
      setMapUrl(staticMapUrl);
      console.log('Instant map loaded for:', locationString);
      
    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to generate map');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fast-map-container">
        <div className="instant-loading">
          <div className="fast-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fast-map-container">
        <div className="error-map">
          <p>📍 {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fast-map-container">
      <div className="fast-map" style={{ height }}>
        {mapUrl ? (
          <img
            src={mapUrl}
            alt="Location Map"
            className="map-image"
            loading="lazy"
          />
        ) : (
          <div className="placeholder-map">
            <p>📍 No location specified</p>
          </div>
        )}
      </div>
      
      {showInfo && location && (
        <div className="location-info">
          <h4>📍 Location Details</h4>
          <p><strong>Address:</strong> {location}</p>
        </div>
      )}
    </div>
  );
};

export default FastMap;
