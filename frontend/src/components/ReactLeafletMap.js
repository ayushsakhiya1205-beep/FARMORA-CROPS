import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map events
const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      console.log('Map clicked:', lat, lng);
      handleLocationSelect(lat, lng, onLocationSelect);
    },
  });

  return null;
};

// Handle location selection with reverse geocoding
const handleLocationSelect = async (lat, lng, onLocationSelect) => {
  try {
    console.log('Getting address for coordinates:', lat, lng);
    
    // Use Nominatim for reverse geocoding (free and reliable)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    console.log('Reverse geocoding response:', data);
    
    if (data && data.address) {
      const addr = data.address;
      const formattedAddress = data.display_name;
      
      // Extract address components with enhanced district detection
      let houseNumber = addr.house_number || addr.building || '';
      let streetName = addr.road || addr.street || addr.pedestrian || '';
      let neighbourhood = addr.neighbourhood || addr.suburb || addr.hamlet || '';
      let city = addr.city || addr.town || addr.village || addr.locality || '';
      let state = addr.state || '';
      let pincode = addr.postcode || addr.postal_code || '';
      
      // Enhanced district extraction - try multiple fields
      let district = '';
      if (addr.county) {
        district = addr.county;
      } else if (addr.district) {
        district = addr.district;
      } else if (addr.city_district) {
        district = addr.city_district;
      } else if (addr.suburb) {
        district = addr.suburb;
      } else if (city) {
        district = city;
      }
      
      console.log('🔍 DEBUG: Address components extracted:', {
        houseNumber,
        streetName,
        neighbourhood,
        city,
        district,
        state,
        pincode,
        originalCounty: addr.county,
        originalDistrict: addr.district,
        originalCityDistrict: addr.city_district
      });
      
      // Build street address
      let streetAddress = '';
      if (houseNumber) streetAddress = houseNumber;
      if (streetName) streetAddress = streetAddress ? `${streetAddress}, ${streetName}` : streetName;
      if (neighbourhood && !streetName.includes(neighbourhood) && !neighbourhood.includes(streetName)) {
        streetAddress = streetAddress ? `${streetAddress}, ${neighbourhood}` : neighbourhood;
      }
      
      // If still no street address, use the first part of formatted address
      if (!streetAddress && formattedAddress) {
        const addressParts = formattedAddress.split(',');
        if (addressParts.length > 0) {
          streetAddress = addressParts[0].trim();
        }
      }
      
      const locationData = {
        address: streetAddress || formattedAddress.split(',')[0],
        district: district || city, // Ensure district is always filled
        state: state,
        pincode: pincode,
        fullAddress: formattedAddress,
        coordinates: {
          lat: lat,
          lng: lng
        }
      };
      
      console.log('🔍 DEBUG: Final location data being sent:', locationData);
      
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }
    } else {
      // Fallback to coordinates only
      if (onLocationSelect) {
        onLocationSelect({
          address: 'Selected location',
          district: 'Unknown',
          state: '',
          pincode: '',
          coordinates: {
            lat: lat,
            lng: lng
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Fallback to coordinates only
    if (onLocationSelect) {
      onLocationSelect({
        address: 'Selected location',
        district: 'Unknown',
        state: '',
        pincode: '',
        coordinates: {
          lat: lat,
          lng: lng
        }
      });
    }
  }
};

const ReactLeafletMap = ({ onLocationSelect, height = '400px' }) => {
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default to Delhi
  const [markerPosition, setMarkerPosition] = useState([28.6139, 77.2090]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPosition = [latitude, longitude];
          setPosition(userPosition);
          setMarkerPosition(userPosition);
          setLoading(false);
          console.log('User location found:', userPosition);
        },
        (error) => {
          console.log('Could not get user location, using default:', error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const handleMarkerDrag = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const latLng = [position.lat, position.lng];
    setMarkerPosition(latLng);
    console.log('Marker dragged to:', latLng);
    handleLocationSelect(position.lat, position.lng, onLocationSelect);
  };

  if (error) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
          <div style={{ color: '#dc3545', marginBottom: '10px' }}>Map Error</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: height }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          zIndex: 1,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
            <div>Loading Map...</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Getting your location...
            </div>
          </div>
        </div>
      )}
      
      <MapContainer
        center={position}
        zoom={13}
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: '8px',
          zIndex: 0
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onLocationSelect={onLocationSelect} />
        
        <Marker
          position={markerPosition}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center', padding: '5px' }}>
              <strong>📍 Your Location</strong><br />
              <small>Drag marker to adjust position</small><br />
              <small>Click map to place marker</small>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        fontSize: '14px',
        zIndex: 2
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🗺️ React Leaflet Map</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Click or drag marker to select location
        </div>
      </div>
    </div>
  );
};

export default ReactLeafletMap;
