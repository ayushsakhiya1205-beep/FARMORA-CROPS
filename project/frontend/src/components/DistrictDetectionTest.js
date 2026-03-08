import React, { useState } from 'react';
import ReactLeafletMap from './ReactLeafletMap';

const DistrictDetectionTest = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [testStatus, setTestStatus] = useState('Click on the map to test district detection');

  const handleLocationSelect = (locationData) => {
    console.log('District detection test - Location selected:', locationData);
    setSelectedLocation(locationData);
    
    // Check if district is properly filled
    if (locationData.district && locationData.district !== 'Unknown') {
      setTestStatus('✅ District successfully detected and filled!');
    } else {
      setTestStatus('⚠️ District detection needs improvement');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🏛️ District Detection Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', 
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(23, 162, 184, 0.4)'
      }}>
        <h4>🎯 District Detection Features:</h4>
        <ul style={{ color: 'white', paddingLeft: '20px' }}>
          <li><strong>Enhanced Extraction:</strong> Multiple field detection for district</li>
          <li><strong>Priority Order:</strong> county → district → city_district → suburb → city</li>
          <li><strong>Debug Logging:</strong> Detailed console logging for troubleshooting</li>
          <li><strong>Fallback Logic:</strong> Always ensures district is filled</li>
          <li><strong>Visual Feedback:</strong> Clear success message with district info</li>
        </ul>
        <p style={{ color: 'white', margin: '15px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
          Status: {testStatus}
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🗺️ Test District Detection:</h3>
        <div style={{ 
          padding: '15px', 
          background: '#e8f5e8', 
          border: '1px solid #4caf50',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>🎮 How to Test:</h4>
          <ol>
            <li><strong>Click on Map:</strong> Click anywhere on the map</li>
            <li><strong>Drag Marker:</strong> Drag marker to different locations</li>
            <li><strong>Check Console:</strong> Look for 🔍 DEBUG messages</li>
            <li><strong>Verify District:</strong> Check if district field is filled</li>
            <li><strong>Success Message:</strong> Look for district in the alert</li>
          </ol>
        </div>
        
        <ReactLeafletMap 
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
          <h4>✅ District Detection Results:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
            <div>
              <strong>📍 Address:</strong><br/>
              <span style={{ color: '#495057' }}>{selectedLocation.address}</span>
            </div>
            <div>
              <strong>🏛️ District:</strong><br/>
              <span style={{ 
                color: selectedLocation.district && selectedLocation.district !== 'Unknown' ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {selectedLocation.district || 'Not detected'}
              </span>
            </div>
            <div>
              <strong>🌍 State:</strong><br/>
              <span style={{ color: '#495057' }}>{selectedLocation.state || 'Not detected'}</span>
            </div>
            <div>
              <strong>📮 Pincode:</strong><br/>
              <span style={{ color: '#495057' }}>{selectedLocation.pincode || 'Not detected'}</span>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: '#f8f9fa', 
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <strong>🔍 Debug Info:</strong> Check browser console for detailed extraction logs
          </div>
        </div>
      )}

      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px' 
      }}>
        <h4>🔧 District Extraction Logic:</h4>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          <strong>Priority Order:</strong><br/>
          1. addr.county (Primary)<br/>
          2. addr.district (Secondary)<br/>
          3. addr.city_district (Tertiary)<br/>
          4. addr.suburb (Quaternary)<br/>
          5. city (Fallback)
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#d4edda', 
        border: '1px solid #c3e6cb',
        borderRadius: '8px' 
      }}>
        <h4>📋 Expected Results:</h4>
        <ul>
          <li><strong>Urban Areas:</strong> District should be detected as county or district</li>
          <li><strong>Rural Areas:</strong> District might be the city or village name</li>
          <li><strong>International:</strong> District detection may vary by country</li>
          <li><strong>Debug Console:</strong> Shows all available address fields</li>
        </ul>
      </div>

      <div style={{ 
        padding: '15px', 
        background: '#e2e3e5', 
        border: '1px solid #d6d8db',
        borderRadius: '8px' 
      }}>
        <h4>🎯 Troubleshooting:</h4>
        <ul>
          <li><strong>No District:</strong> Check console for available address fields</li>
          <li><strong>Wrong District:</strong> Verify the address data from Nominatim</li>
          <li><strong>Empty Fields:</strong> Some locations may not have district data</li>
          <li><strong>Debug Mode:</strong> Open browser console for detailed logging</li>
        </ul>
      </div>
    </div>
  );
};

export default DistrictDetectionTest;
