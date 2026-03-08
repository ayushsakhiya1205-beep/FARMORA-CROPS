import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const ClickTest = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [clickCount, setClickCount] = useState(0);

  const handleLocationSelect = (address) => {
    console.log('Address selected in test:', address);
    setSelectedAddress(address);
    setClickCount(prev => prev + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Map Click Functionality Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '8px' 
      }}>
        <h4>📊 Test Statistics:</h4>
        <p><strong>Click Count:</strong> {clickCount}</p>
        <p><strong>Last Selected Address:</strong></p>
        <p style={{ 
          fontFamily: 'monospace', 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          wordBreak: 'break-all'
        }}>
          {selectedAddress ? 
            (typeof selectedAddress === 'string' ? selectedAddress : JSON.stringify(selectedAddress, null, 2))
            : 'No address selected yet'
          }
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>👆 Click anywhere on the map below:</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          The map should show a crosshair cursor and respond to clicks.
          Check the browser console for detailed click information.
        </p>
        <IndiaStatesMap 
          location="Ahmedabad, Gujarat, India"
          height="400px"
          showInfo={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px' 
      }}>
        <h4>🔍 What to look for:</h4>
        <ol>
          <li><strong>Crosshair Cursor:</strong> Mouse should become crosshair over map</li>
          <li><strong>Click Indicator:</strong> Red pulse animation where you click</li>
          <li><strong>Console Logs:</strong> Check browser console for click coordinates</li>
          <li><strong>Address Loading:</strong> "Getting exact address..." message</li>
          <li><strong>Address Result:</strong> Exact address should appear above</li>
        </ol>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#d1ecf1', 
        border: '1px solid #bee5eb',
        borderRadius: '8px' 
      }}>
        <h4>🐛 Troubleshooting:</h4>
        <ul>
          <li>If clicks don't work, check browser console for errors</li>
          <li>Make sure the map is in interactive mode (not loading)</li>
          <li>Try clicking different areas of the map</li>
          <li>The click overlay should be visible when hovering</li>
        </ul>
      </div>
    </div>
  );
};

export default ClickTest;
