import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const EnhancedMarkerTest = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [markerInfo, setMarkerInfo] = useState('Move mouse over map to see marker');

  const handleLocationSelect = (address) => {
    console.log('Address selected with enhanced marker:', address);
    setSelectedAddress(address);
    setMarkerInfo('Location selected successfully!');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎯 Enhanced Marker Movement Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '8px' 
      }}>
        <h4>🚀 Enhanced Features:</h4>
        <ul>
          <li><strong>Responsive Movement:</strong> Marker follows mouse instantly</li>
          <li><strong>Boundary Detection:</strong> Marker stays within map bounds</li>
          <li><strong>Performance Optimized:</strong> Fast transitions with will-change</li>
          <li><strong>Visual Feedback:</strong> Enhanced hover and movement states</li>
          <li><strong>Smooth Animations:</strong> Optimized transition timing</li>
        </ul>
        <p><strong>Status:</strong> {markerInfo}</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🗺️ Test the Enhanced Marker:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>🎮 How to Test:</h4>
          <ol>
            <li><strong>Move Slowly:</strong> Notice smooth marker tracking</li>
            <li><strong>Move Quickly:</strong> Marker keeps up with fast movements</li>
            <li><strong>Edge Testing:</strong> Move to map edges - marker stays in bounds</li>
            <li><strong>Hover Effects:</strong> Marker scales up on hover</li>
            <li><strong>Click Precision:</strong> Click exactly where marker is positioned</li>
          </ol>
        </div>
        
        <IndiaStatesMap 
          location="Ahmedabad, Gujarat, India"
          height="450px"
          showInfo={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {selectedAddress && (
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
            padding: '10px', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            marginTop: '10px'
          }}>
            {typeof selectedAddress === 'string' ? selectedAddress : JSON.stringify(selectedAddress, null, 2)}
          </div>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        background: '#f8d7da', 
        border: '1px solid #f5c6cb',
        borderRadius: '8px' 
      }}>
        <h4>🔧 Technical Improvements:</h4>
        <ul>
          <li><strong>Transition Speed:</strong> 0.05s normal, 0.02s when moving</li>
          <li><strong>Boundary Clamping:</strong> Math.max/min to keep marker in bounds</li>
          <li><strong>Performance:</strong> will-change CSS property for GPU acceleration</li>
          <li><strong>State Management:</strong> Moving state for faster transitions</li>
          <li><strong>Memory Management:</strong> Proper cleanup of timeouts</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '8px' 
      }}>
        <h4>🎨 Visual Enhancements:</h4>
        <ul>
          <li><strong>Larger Marker:</strong> 28px (was 24px) for better visibility</li>
          <li><strong>Enhanced Shadow:</strong> Deeper shadow (3px blur, 0.4 opacity)</li>
          <li><strong>Bounce Animation:</strong> Increased height (-8px)</li>
          <li><strong>Hover Scale:</strong> 1.1x scale on hover</li>
          <li><strong>Better Shadow:</strong> Larger, more realistic drop shadow</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedMarkerTest;
