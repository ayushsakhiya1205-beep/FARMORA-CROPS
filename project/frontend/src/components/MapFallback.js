import React from 'react';

const MapFallback = ({ onLocationSelect, height = '400px' }) => {
  const handleManualLocation = () => {
    // Simulate location selection with sample data
    const sampleLocation = {
      address: 'Sample Address, Main Street',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      fullAddress: 'Sample Address, Main Street, Pune, Maharashtra 411001, India',
      coordinates: {
        lat: 18.5204,
        lng: 73.8567
      }
    };
    
    if (onLocationSelect) {
      onLocationSelect(sampleLocation);
    }
  };

  return (
    <div style={{ 
      height: height, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>Map Loading Issue</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          Google Maps couldn't load. This might be due to network issues or API restrictions.
        </p>
        
        <div style={{ 
          background: '#e9ecef', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>Troubleshooting:</strong>
          <ul style={{ textAlign: 'left', marginTop: '10px' }}>
            <li>Check your internet connection</li>
            <li>Disable ad blockers temporarily</li>
            <li>Refresh the page and try again</li>
            <li>Try using a different browser</li>
          </ul>
        </div>
        
        <button 
          onClick={handleManualLocation}
          style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          📍 Use Sample Location
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Reload Page
        </button>
        
        <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '15px' }}>
          Or use the "Use My Current Location" button for automatic detection
        </p>
      </div>
    </div>
  );
};

export default MapFallback;
