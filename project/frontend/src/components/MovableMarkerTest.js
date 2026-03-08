import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const MovableMarkerTest = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [lastAction, setLastAction] = useState('No interaction yet');

  const handleLocationSelect = (address) => {
    console.log('Address selected with movable marker:', address);
    setSelectedAddress(address);
    setLastAction('Clicked to select location');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Movable Marker Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '8px' 
      }}>
        <h4>📊 Marker Status:</h4>
        <p><strong>Last Action:</strong> {lastAction}</p>
        <p><strong>Selected Address:</strong></p>
        <p style={{ 
          fontFamily: 'monospace', 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          wordBreak: 'break-all',
          minHeight: '40px'
        }}>
          {selectedAddress ? 
            (typeof selectedAddress === 'string' ? selectedAddress : JSON.stringify(selectedAddress, null, 2))
            : 'Move the marker and click to select location'
          }
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🎯 How to Use the Movable Marker:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <ol>
            <li><strong>Move Mouse:</strong> The 📍 marker follows your mouse movement</li>
            <li><strong>Position:</strong> Move the marker to your exact location</li>
            <li><strong>Click:</strong> Click to select the pointed location</li>
            <li><strong>Get Address:</strong> Exact address will be retrieved</li>
          </ol>
        </div>
        
        <IndiaStatesMap 
          location="Ahmedabad, Gujarat, India"
          height="400px"
          showInfo={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#d1ecf1', 
        border: '1px solid #bee5eb',
        borderRadius: '8px' 
      }}>
        <h4>✨ Marker Features:</h4>
        <ul>
          <li><strong>Smooth Movement:</strong> Marker follows mouse in real-time</li>
          <li><strong>Bounce Animation:</strong> Marker has a subtle bounce effect</li>
          <li><strong>Drop Shadow:</strong> Realistic shadow beneath the marker</li>
          <li><strong>Hover Feedback:</strong> Instructions change based on interaction</li>
          <li><strong>Precise Pointing:</strong> Click anywhere the marker is positioned</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#f8d7da', 
        border: '1px solid #f5c6cb',
        borderRadius: '8px' 
      }}>
        <h4>🎮 Test Different Areas:</h4>
        <ul>
          <li><strong>Gujarat:</strong> Try Ahmedabad, Surat, Vadodara areas</li>
          <li><strong>Rajasthan:</strong> Try Jaipur, Udaipur, Jodhpur areas</li>
          <li><strong>Maharashtra:</strong> Try Mumbai, Pune, Nagpur areas</li>
          <li><strong>Exact Locations:</strong> Point to specific streets or landmarks</li>
        </ul>
      </div>
    </div>
  );
};

export default MovableMarkerTest;
