import React from 'react';
import LocationMap from './LocationMap';

const LocationMapTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Location Map Test</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Test 1: Customer Address</h3>
        <LocationMap 
          location="123 Main Street, Ahmedabad, Gujarat 380001, India"
          height="300px"
          zoom="15"
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Test 2: Outlet Location</h3>
        <LocationMap 
          location="Rajkot, Gujarat, India"
          height="300px"
          zoom="13"
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Test 3: Specific Coordinates</h3>
        <LocationMap 
          location="Statue of Unity, Gujarat, India"
          height="300px"
          zoom="14"
        />
      </div>
    </div>
  );
};

export default LocationMapTest;
