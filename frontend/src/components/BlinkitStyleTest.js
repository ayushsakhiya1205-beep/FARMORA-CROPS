import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const BlinkitStyleTest = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [movementInfo, setMovementInfo] = useState('Move mouse over map to see Blinkit-style movement');

  const handleLocationSelect = (address) => {
    console.log('Address selected with Blinkit-style marker:', address);
    setSelectedAddress(address);
    setMovementInfo('Perfect! Location selected with smooth precision');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🚀 Blinkit-Style Marker Movement</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
      }}>
        <h4>✨ Blinkit-Style Features:</h4>
        <ul style={{ color: 'white', paddingLeft: '20px' }}>
          <li><strong>Smooth Interpolation:</strong> RequestAnimationFrame for 60fps movement</li>
          <li><strong>Easing Functions:</strong> Cubic-bezier transitions like Blinkit</li>
          <li><strong>Ripple Effects:</strong> Continuous pulse animation</li>
          <li><strong>Floating Animation:</strong> Gentle up-down movement</li>
          <li><strong>Dynamic Transitions:</strong> Instant when moving, smooth when stopped</li>
        </ul>
        <p style={{ color: 'white', margin: '10px 0 0 0' }}>
          <strong>Status:</strong> {movementInfo}
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🗺️ Experience Blinkit-Style Movement:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>🎮 How It Works (Like Blinkit):</h4>
          <ol>
            <li><strong>Smooth Following:</strong> Marker smoothly follows mouse with easing</li>
            <li><strong>60fps Animation:</strong> RequestAnimationFrame for buttery smooth movement</li>
            <li><strong>Ripple Effect:</strong> Continuous pulse around the marker</li>
            <li><strong>Floating Animation:</strong> Gentle floating effect like Blinkit</li>
            <li><strong>Dynamic Speed:</strong> Fast when moving, smooth when stopped</li>
          </ol>
        </div>
        
        <IndiaStatesMap 
          location="Mumbai, Maharashtra, India"
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
          <h4>✅ Selected Location:</h4>
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
        <h4>🔧 Technical Implementation:</h4>
        <ul>
          <li><strong>RequestAnimationFrame:</strong> 60fps smooth animation loop</li>
          <li><strong>Easing Value:</strong> 0.15 interpolation for Blinkit-like smoothness</li>
          <li><strong>Distance Calculation:</strong> Stops animation when close to target</li>
          <li><strong>Dynamic Classes:</strong> 'smooth' vs 'instant' transition styles</li>
          <li><strong>Memory Management:</strong> Proper cleanup of animation frames</li>
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
          <li><strong>Larger Marker:</strong> 32px for better visibility</li>
          <li><strong>Ripple Animation:</strong> Continuous 2s pulse effect</li>
          <li><strong>Floating Effect:</strong> 3s ease-in-out floating animation</li>
          <li><strong>Shadow Pulse:</strong> Synchronized shadow animation</li>
          <li><strong>Hover Scale:</strong> 1.15x scale with elastic easing</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#e2e3e5', 
        border: '1px solid #d6d8db',
        borderRadius: '8px' 
      }}>
        <h4>📱 Performance Features:</h4>
        <ul>
          <li><strong>GPU Acceleration:</strong> will-change transform property</li>
          <li><strong>Optimized Transitions:</strong> Cubic-bezier easing functions</li>
          <li><strong>Smart Cleanup:</strong> Cancels animations on unmount</li>
          <li><strong>Boundary Detection:</strong> Keeps marker within map bounds</li>
          <li><strong>Efficient State:</strong> Minimal re-renders with refs</li>
        </ul>
      </div>
    </div>
  );
};

export default BlinkitStyleTest;
