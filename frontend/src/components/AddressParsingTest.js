import React, { useState } from 'react';

const AddressParsingTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [currentTest, setCurrentTest] = useState('Ready to test address parsing');

  // Test the exact same parsing logic used in Cart.js
  const testAddressParsing = () => {
    setCurrentTest('🔄 Testing address parsing logic...');
    
    // Test Case 1: Complete address with all components
    const testCase1 = {
      name: 'Complete Address (OpenStreetMap format)',
      data: {
        address: {
          house_number: '123',
          road: 'MG Road',
          neighbourhood: 'Shivaji Nagar',
          suburb: 'Pune',
          city: 'Pune',
          county: 'Pune',
          state: 'Maharashtra',
          postcode: '411001'
        },
        display_name: '123, MG Road, Shivaji Nagar, Pune, Maharashtra 411001, India'
      }
    };
    
    // Test Case 2: Address without house number
    const testCase2 = {
      name: 'Address without house number',
      data: {
        address: {
          road: 'Station Road',
          neighbourhood: 'Camp',
          city: 'Pune',
          county: 'Pune',
          state: 'Maharashtra',
          postcode: '411001'
        },
        display_name: 'Station Road, Camp, Pune, Maharashtra 411001, India'
      }
    };
    
    // Test Case 3: Address with building name
    const testCase3 = {
      name: 'Address with building name',
      data: {
        address: {
          building: 'ABC Complex',
          road: 'FC Road',
          city: 'Pune',
          county: 'Pune',
          state: 'Maharashtra',
          postcode: '411016'
        },
        display_name: 'ABC Complex, FC Road, Pune, Maharashtra 411016, India'
      }
    };
    
    // Test Case 4: Google Maps format
    const testCase4 = {
      name: 'Google Maps format',
      data: {
        address_components: [
          { long_name: '456', types: ['street_number'] },
          { long_name: 'JM Road', types: ['route'] },
          { long_name: 'Deccan Gymkhana', types: ['sublocality_level_1'] },
          { long_name: 'Pune', types: ['locality'] },
          { long_name: 'Maharashtra', types: ['administrative_area_level_1'] },
          { long_name: '411004', types: ['postal_code'] }
        ],
        formatted_address: '456, JM Road, Deccan Gymkhana, Pune, Maharashtra 411004, India'
      }
    };
    
    const testCases = [testCase1, testCase2, testCase3, testCase4];
    const results = [];
    
    testCases.forEach((testCase, index) => {
      const result = parseAddress(testCase.data, testCase.name);
      results.push(result);
    });
    
    setTestResults(results);
    setCurrentTest('✅ Address parsing test completed!');
  };
  
  // Exact parsing logic from Cart.js
  const parseAddress = (data, testName) => {
    try {
      let streetAddress = '';
      let district = '';
      let state = '';
      let pincode = '';
      
      if (data.address) {
        // OpenStreetMap format
        const addr = data.address;
        const houseNumber = addr.house_number || addr.building || '';
        const streetName = addr.road || addr.street || addr.pedestrian || '';
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.hamlet || '';
        const city = addr.city || addr.town || addr.village || addr.locality || '';
        
        // Build complete street address with better logic
        if (houseNumber) {
          streetAddress = houseNumber;
        }
        
        if (streetName) {
          streetAddress = streetAddress ? `${streetAddress}, ${streetName}` : streetName;
        }
        
        if (neighbourhood && !streetName.includes(neighbourhood) && !neighbourhood.includes(streetName)) {
          streetAddress = streetAddress ? `${streetAddress}, ${neighbourhood}` : neighbourhood;
        }
        
        // If still no street address, use the first part of formatted address
        if (!streetAddress && data.display_name) {
          const addressParts = data.display_name.split(',');
          if (addressParts.length > 0) {
            streetAddress = addressParts[0].trim();
          }
        }
        
        district = addr.county || addr.district || addr.city_district || city;
        state = addr.state || '';
        pincode = addr.postcode || addr.postal_code || '';
        
      } else if (data.address_components) {
        // Google Maps format
        let streetNumber = '';
        let routeName = '';
        
        data.address_components.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          
          if (types.includes('route')) {
            routeName = component.long_name;
          }
          
          if (types.includes('locality')) {
            district = component.long_name;
          }
          
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          
          if (types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });
        
        // Build street address from house number and route
        if (streetNumber && routeName) {
          streetAddress = `${streetNumber}, ${routeName}`;
        } else if (routeName) {
          streetAddress = routeName;
        } else if (streetNumber) {
          streetAddress = streetNumber;
        } else if (!streetAddress && data.formatted_address) {
          const addressParts = data.formatted_address.split(',');
          if (addressParts.length > 0) {
            streetAddress = addressParts[0].trim();
          }
        }
      }
      
      return {
        testName,
        success: !!streetAddress,
        streetAddress,
        district,
        state,
        pincode,
        rawData: data
      };
      
    } catch (error) {
      return {
        testName,
        success: false,
        error: error.message,
        rawData: data
      };
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔍 Address Parsing Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '8px' 
      }}>
        <h4>🎯 Test Purpose:</h4>
        <p>Verify that house numbers and street names are correctly extracted from location data.</p>
        <p><strong>Status:</strong> {currentTest}</p>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={testAddressParsing}
          style={{
            padding: '12px 24px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🧪 Run Address Parsing Tests
        </button>
      </div>
      
      {testResults && (
        <div style={{ marginBottom: '30px' }}>
          <h3>📊 Test Results:</h3>
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                background: result.success ? '#d4edda' : '#f8d7da', 
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '8px' 
              }}
            >
              <h4>{result.testName}</h4>
              <p><strong>Status:</strong> {result.success ? '✅ Success' : '❌ Failed'}</p>
              
              {result.success ? (
                <div>
                  <p><strong>📍 Street Address:</strong> {result.streetAddress}</p>
                  <p><strong>🏛️ District:</strong> {result.district}</p>
                  <p><strong>🌍 State:</strong> {result.state}</p>
                  <p><strong>📮 Pincode:</strong> {result.pincode}</p>
                </div>
              ) : (
                <p><strong>❌ Error:</strong> {result.error}</p>
              )}
              
              <details style={{ marginTop: '10px' }}>
                <summary>🔍 Raw Data</summary>
                <pre style={{ fontSize: '12px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(result.rawData, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px' 
      }}>
        <h4>🔧 What to Check:</h4>
        <ul>
          <li><strong>House Number:</strong> Should extract "123", "456", etc.</li>
          <li><strong>Street Name:</strong> Should extract "MG Road", "JM Road", etc.</li>
          <li><strong>Combined Address:</strong> Should format as "123, MG Road"</li>
          <li><strong>Fallback Logic:</strong> Should work with missing components</li>
          <li><strong>Both APIs:</strong> Should handle OpenStreetMap and Google Maps formats</li>
        </ul>
      </div>
      
      <div style={{ 
        padding: '15px', 
        background: '#d1ecf1', 
        border: '1px solid #bee5eb',
        borderRadius: '8px' 
      }}>
        <h4>💡 Debug Tips:</h4>
        <ul>
          <li>Check browser console for detailed logging</li>
          <li>Use the "🔍 Debug Address" button in Cart page</li>
          <li>Verify API responses contain expected fields</li>
          <li>Test with real location detection</li>
        </ul>
      </div>
    </div>
  );
};

export default AddressParsingTest;
