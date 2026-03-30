import React, { useState } from 'react';
import GoogleMaps from './GoogleMaps';

const GoogleMapsTest = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [testStatus, setTestStatus] = useState('Click on the map to test Google Maps functionality');

  const handleLocationSelect = (locationData) => {
    console.log('Google Maps location selected:', locationData);
    setSelectedLocation(locationData);
    setTestStatus('✅ Google Maps location selected successfully!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Google Maps Integration Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)', 
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(66, 133, 244, 0.4)'
      }}>
        <h4>🌍 Google Maps Features:</h4>
        <ul style={{ color: 'white', paddingLeft: '20px' }}>
          <li><strong>Interactive Map:</strong> Full Google Maps functionality</li>
          <li><strong>Draggable Marker:</strong> Move marker to precise location</li>
          <li><strong>Click to Select:</strong> Click anywhere on map</li>
          <li><strong>Auto Geocoding:</strong> Automatic address detection</li>
          <li><strong>Complete Address:</strong> House number, street, city, state, pincode</li>
          <li><strong>User Location:</strong> Auto-detects current location</li>
          <li><strong>Professional UI:</strong> Clean, familiar Google Maps interface</li>
        </ul>
        <p style={{ color: 'white', margin: '15px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
          Status: {testStatus}
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🎯 Test Google Maps Functionality:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#e8f5e8', 
          border: '1px solid #4caf50',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>🎮 How to Use Google Maps:</h4>
          <ol>
            <li><strong>Click on Map:</strong> Click anywhere to place marker</li>
            <li><strong>Drag Marker:</strong> Drag marker to adjust position</li>
            <li><strong>Auto-Detect:</strong> Map tries to find your current location</li>
            <li><strong>Address Detection:</strong> Automatic reverse geocoding</li>
            <li><strong>Complete Details:</strong> Gets full address information</li>
          </ol>
        </div>
        
        <GoogleMaps 
          height="450px"
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {selectedLocation && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '15px', 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb',
          borderRadius: '8px' 
        }}>
          <h4>✅ Selected Location Details:</h4>
          <div style={{ 
            fontFamily: 'monospace', 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            marginTop: '10px'
          }}>
            {JSON.stringify(selectedLocation, null, 2)}
          </div>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px' 
      }}>
        <h4>🔧 Technical Implementation:</h4>
        <ul>
          <li><strong>Google Maps API:</strong> Official Google Maps JavaScript API</li>
          <li><strong>Geocoder Service:</strong> Built-in reverse geocoding</li>
          <li><strong>Marker Management:</strong> Draggable marker with animations</li>
          <li><strong>Event Handling:</strong> Click and drag events</li>
          <li><strong>Address Parsing:</strong> Complete component extraction</li>
          <li><strong>Error Handling:</strong> Graceful fallbacks</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '8px' 
      }}>
        <h4>📋 Address Components Extracted:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><strong>🏠 House Number:</strong> street_number</div>
          <div><strong>🛣️ Street Name:</strong> route</div>
          <div><strong>🏘️ Neighbourhood:</strong> sublocality</div>
          <div><strong>🏙️ City:</strong> locality</div>
          <div><strong>🏛️ District:</strong> administrative_area_level_2</div>
          <div><strong>🌍 State:</strong> administrative_area_level_1</div>
          <div><strong>📮 Pincode:</strong> postal_code</div>
          <div><strong>📍 Coordinates:</strong> lat, lng</div>
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#e2e3e5', 
        border: '1px solid #d6d8db',
        borderRadius: '8px' 
      }}>
        <h4>🎯 User Experience:</h4>
        <ul>
          <li><strong>Familiar Interface:</strong> Users already know Google Maps</li>
          <li><strong>Precise Selection:</strong> Zoom and pan for accuracy</li>
          <li><strong>Visual Feedback:</strong> Marker animations and interactions</li>
          <li><strong>Quick Selection:</strong> Click and done functionality</li>
          <li><strong>Reliable Data:</strong> Google's comprehensive address database</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleMapsTest;
