import React, { useState } from 'react';

const LocationDebugHelper = () => {
  const [debugInfo, setDebugInfo] = useState('');

  const showDebugInstructions = () => {
    const instructions = `
🔍 DEBUG INSTRUCTIONS FOR LOCATION ISSUE:

1. Open Browser Console (F12 → Console tab)

2. Click "Use My Current Location" button in Cart

3. Watch for these DEBUG messages in console:
   - 🔍 DEBUG: Got precise location: [lat, lng]
   - 🔍 DEBUG: Fetching from OpenStreetMap...
   - 🔍 DEBUG: Raw OpenStreetMap response: [data]
   - 🔍 DEBUG: Address object: [address]
   - 🔍 DEBUG: Extracted components: [house_number, street_name, etc.]

4. Common Issues & Solutions:

   ISSUE: No house_number or road fields
   - Check if address object contains these fields
   - Some locations don't have house numbers
   - Try different location (more urban area)

   ISSUE: API returns error
   - Check network connection
   - Try Google Maps fallback
   - API might be temporarily down

   ISSUE: Fields not updating in UI
   - Check if setDeliveryAddress is called
   - Verify deliveryAddress state update
   - Check form field binding

5. Expected Console Output:
   🔍 DEBUG: Got precise location: 18.5204, 73.8567
   🔍 DEBUG: Fetching from OpenStreetMap...
   🔍 DEBUG: Raw OpenStreetMap response: {...}
   🔍 DEBUG: Address object: {house_number: "123", road: "MG Road", ...}
   🔍 DEBUG: Extracted components: {house_number: "123", streetName: "MG Road", ...}
   🔍 DEBUG: Added house number: 123
   🔍 DEBUG: Added street name: 123, MG Road
   🔍 DEBUG: Final parsed address: {streetAddress: "123, MG Road", ...}
   🔍 DEBUG: Setting delivery address: {...}

6. Test with Debug Button:
   - Click "🔍 Debug Address" button
   - Check if parsing logic works with sample data
   - Verify console shows expected parsing results

7. Manual Verification:
   - Check if deliveryAddress state updates
   - Verify form fields show new values
   - Check if address field contains house number and street

If you see the DEBUG messages but fields still don't update,
the issue might be in the form field binding or state management.
    `;
    
    setDebugInfo(instructions);
    console.log(instructions);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#fff3cd', 
      border: '1px solid #ffc107',
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h3>🔍 Location Debug Helper</h3>
      
      <button 
        onClick={showDebugInstructions}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        📋 Show Debug Instructions
      </button>
      
      {debugInfo && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-line',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {debugInfo}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '14px' }}>
        <p><strong>Quick Test:</strong></p>
        <ol>
          <li>Open browser console (F12)</li>
          <li>Go to Cart page</li>
          <li>Click "Use My Current Location"</li>
          <li>Check console for 🔍 DEBUG messages</li>
          <li>Verify what data is actually returned</li>
        </ol>
        
        <p style={{ marginTop: '10px' }}>
          <strong>If house_number and road are empty in the API response,</strong><br/>
          the location might not have specific address data. Try a different location.
        </p>
      </div>
    </div>
  );
};

export default LocationDebugHelper;
