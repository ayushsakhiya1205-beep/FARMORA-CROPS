import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './LocationMap.css';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationMap = ({ 
  location = null, 
  height = '400px',
  zoom = 13,
  showPopup = true 
}) => {
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default: Delhi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      // If location is provided, try to geocode it
      geocodeLocation(location);
    } else {
      setLoading(false);
    }
  }, [location]);

  const geocodeLocation = async (locationString) => {
    setLoading(true);
    setError(null);

    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setPosition([parseFloat(lat), parseFloat(lon)]);
        console.log('Location found:', display_name);
      } else {
        throw new Error('Location not found');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Unable to find location. Please check the address.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="location-map-container">
        <div className="loading-map">
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="location-map-container">
        <div className="error-map">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-map-container">
      <div className="location-map" style={{ height }}>
        <MapContainer 
          center={position} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {location && (
            <Marker position={position}>
              {showPopup && (
                <Popup>
                  <div className="location-marker-popup">
                    <h5>Selected Location</h5>
                    <p><strong>Address:</strong> {location}</p>
                    <p><strong>Coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          )}
        </MapContainer>
      </div>
      
      {location && (
        <div className="location-info">
          <h4>📍 Location Details</h4>
          <p><strong>Address:</strong> {location}</p>
          <p><strong>Latitude:</strong> {position[0].toFixed(6)}</p>
          <p><strong>Longitude:</strong> {position[1].toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
