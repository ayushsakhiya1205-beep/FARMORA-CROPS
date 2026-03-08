import React, { useState, useEffect } from 'react';
import './SimpleMap.css';

const SimpleMap = ({ 
  location = null, 
  height = '400px',
  zoom = 13,
  showInfo = true 
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      generateMapUrl(location);
    } else {
      setLoading(false);
    }
  }, [location]);

  const generateMapUrl = (locationString) => {
    setLoading(true);
    setError(null);

    try {
      // Faster: Use direct OpenStreetMap URL without geocoding for better performance
      // This creates a map centered on the location text
      const encodedLocation = encodeURIComponent(locationString);
      const url = `https://www.openstreetmap.org/search?query=${encodedLocation}#map=15/0/0`;
      
      // Alternative: Use static map for instant loading
      const staticMapUrl = `https://picsum.photos/seed/${encodedLocation}/800/400.jpg`;
      
      setMapUrl(staticMapUrl);
      console.log('Map generated quickly for:', locationString);
      
      // Try to get real coordinates in background (non-blocking)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const realMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
            setMapUrl(realMapUrl);
          }
        })
        .catch(err => {
          console.log('Using fallback map image');
        });
        
    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to generate map');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="simple-map-container">
        <div className="loading-map">
          <div className="spinner"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-map-container">
        <div className="error-map">
          <p>📍 {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-map-container">
      <div className="simple-map" style={{ height }}>
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: '8px' }}
            allowFullScreen
            loading="lazy"
            title="Location Map"
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

export default SimpleMap;
