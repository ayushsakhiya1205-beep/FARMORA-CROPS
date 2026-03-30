import React, { useState } from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const EnhancedLocationTest = () => {
  const [locationData, setLocationData] = useState(null);
  const [testStatus, setTestStatus] = useState('Click the location button to test enhanced address fetching');

  const handleLocationSelect = (address) => {
    console.log('Location selected from map:', address);
    setLocationData(address);
    setTestStatus('✅ Map location selection working perfectly!');
  };

  const simulateLocationButton = () => {
    setTestStatus('🔄 Simulating enhanced location detection...');
    
    // Simulate the enhanced location detection
    setTimeout(() => {
      const mockLocationData = {
        address: '123, MG Road, Shivaji Nagar',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        full: '123, MG Road, Shivaji Nagar, Pune, Maharashtra 411001, India'
      };
      
      setLocationData(mockLocationData);
      setTestStatus('🎉 Enhanced location detection successful! All address fields filled automatically.');
    }, 2000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📍 Enhanced Location Detection Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)'
      }}>
        <h4>🌟 Enhanced Location Features:</h4>
        <ul style={{ color: 'white', paddingLeft: '20px' }}>
          <li><strong>House Number:</strong> Extracts exact house/building number</li>
          <li><strong>Street Name:</strong> Gets complete street/road name</li>
          <li><strong>Neighbourhood:</strong> Captures locality/area information</li>
          <li><strong>City Detection:</strong> Identifies city/town/village</li>
          <li><strong>District Info:</strong> Gets district/county data</li>
          <li><strong>State & Pincode:</strong> Complete state and postal code</li>
          <li><strong>Dual API Support:</strong> OpenStreetMap + Google Maps fallback</li>
        </ul>
        <p style={{ color: 'white', margin: '15px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
          Status: {testStatus}
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🗺️ Test Enhanced Location Features:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>🎮 How Enhanced Location Works:</h4>
          <ol>
            <li><strong>Precise GPS:</strong> High accuracy location detection</li>
            <li><strong>OpenStreetMap API:</strong> Free, detailed address parsing</li>
            <li><strong>Component Extraction:</strong> House number, street, area</li>
            <li><strong>Google Maps Fallback:</strong> Backup if primary fails</li>
            <li><strong>Smart Formatting:</strong> Proper address construction</li>
          </ol>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={simulateLocationButton}
            style={{
              padding: '12px 24px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '15px'
            }}
          >
            📍 Test Enhanced Location Detection
          </button>
          
          <span style={{ color: '#666', fontSize: '14px' }}>
            Simulates the enhanced location detection with detailed address parsing
          </span>
        </div>
        
        <IndiaStatesMap 
          location="Mumbai, Maharashtra, India"
          height="400px"
          showInfo={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {locationData && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '15px', 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb',
          borderRadius: '8px' 
        }}>
          <h4>✅ Enhanced Location Data Retrieved:</h4>
          <div style={{ 
            fontFamily: 'monospace', 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            marginTop: '10px'
          }}>
            {typeof locationData === 'string' ? locationData : JSON.stringify(locationData, null, 2)}
          </div>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        background: '#f8d7da', 
        border: '1px solid #f5c6cb',
        borderRadius: '8px' 
      }}>
        <h4>🔧 Technical Enhancements:</h4>
        <ul>
          <li><strong>OpenStreetMap Nominatim:</strong> Free, no API key required</li>
          <li><strong>Address Details:</strong> addressdetails=1&zoom=18 for precision</li>
          <li><strong>Component Parsing:</strong> house_number, road, neighbourhood, city</li>
          <li><strong>District Logic:</strong> county, district, city_district fallback</li>
          <li><strong>Google Maps Backup:</strong> Enhanced component extraction</li>
          <li><strong>Error Handling:</strong> Graceful fallbacks and user feedback</li>
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
          <div><strong>🏠 House Number:</strong> 123</div>
          <div><strong>🛣️ Street Name:</strong> MG Road</div>
          <div><strong>🏘️ Neighbourhood:</strong> Shivaji Nagar</div>
          <div><strong>🏙️ City:</strong> Pune</div>
          <div><strong>🏛️ District:</strong> Pune</div>
          <div><strong>🌍 State:</strong> Maharashtra</div>
          <div><strong>📮 Pincode:</strong> 411001</div>
          <div><strong>📍 Full Address:</strong> Complete formatted</div>
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#e2e3e5', 
        border: '1px solid #d6d8db',
        borderRadius: '8px' 
      }}>
        <h4>🎯 User Experience Improvements:</h4>
        <ul>
          <li><strong>Detailed Success Message:</strong> Shows all extracted components</li>
          <li><strong>Better Error Messages:</strong> Clear guidance for users</li>
          <li><strong>Higher Accuracy:</strong> 15s timeout, high precision GPS</li>
          <li><strong>Reliability:</strong> Dual API system ensures success</li>
          <li><strong>Debug Logging:</strong> Comprehensive console output</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedLocationTest;
