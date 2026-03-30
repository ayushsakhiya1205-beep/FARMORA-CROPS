import React from 'react';
import IndiaStatesMap from './IndiaStatesMap';

const StatesMapTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ India States Map Test</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Gujarat Location</h3>
        <IndiaStatesMap 
          location="Ahmedabad, Gujarat, India"
          height="300px"
          showInfo={true}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Rajasthan Location</h3>
        <IndiaStatesMap 
          location="Jaipur, Rajasthan, India"
          height="300px"
          showInfo={true}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Maharashtra Location</h3>
        <IndiaStatesMap 
          location="Mumbai, Maharashtra, India"
          height="300px"
          showInfo={true}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Other State (Should show default view)</h3>
        <IndiaStatesMap 
          location="Delhi, India"
          height="300px"
          showInfo={true}
        />
      </div>
    </div>
  );
};

export default StatesMapTest;
