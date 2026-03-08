import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const InteractiveMapTest = () => {
  const [selectedAddress, setSelectedAddress] = useState('');

  const handleLocationSelect = (address) => {
    setSelectedAddress(address);
    console.log('Address selected:', address);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Interactive Map Test</h2>
      
      {selectedAddress && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f5e8', 
          border: '1px solid #4caf50',
          borderRadius: '8px' 
        }}>
          <h4>✅ Selected Address:</h4>
          <p><strong>{selectedAddress}</strong></p>
          <p><em>This address would be automatically filled in the cart form fields.</em></p>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h3>Click on the map to select a location:</h3>
        <IndiaStatesMap 
          location="Ahmedabad, Gujarat, India"
          height="400px"
          showInfo={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#f0f8ff', 
        border: '1px solid #2196f3',
        borderRadius: '8px' 
      }}>
        <h4>📋 How it works:</h4>
        <ol>
          <li>Click anywhere on the map</li>
          <li>The system detects the approximate location</li>
          <li>A sample address from that region is selected</li>
          <li>The address is automatically parsed and filled in the form</li>
          <li>City, State, District, and Pincode fields are populated</li>
        </ol>
      </div>
    </div>
  );
};

export default InteractiveMapTest;
