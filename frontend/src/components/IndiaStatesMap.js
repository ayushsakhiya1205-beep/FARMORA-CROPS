import React, { useState, useEffect, useRef } from 'react';
import './IndiaStatesMap.css';

const IndiaStatesMap = ({ 
  location = null, 
  height = '400px',
  showInfo = true,
  onLocationSelect = null // Callback for when user clicks on map
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState({ x: null, y: null });
  const [isHovering, setIsHovering] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [markerStyle, setMarkerStyle] = useState('smooth');
  const moveTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const targetPositionRef = useRef({ x: null, y: null });
  const currentPositionRef = useRef({ x: null, y: null });

  // State coordinates for Gujarat, Rajasthan, Maharashtra
  const stateCoordinates = {
    'gujarat': { lat: 22.2587, lng: 71.1924, zoom: 7 },
    'rajasthan': { lat: 27.0238, lng: 74.2179, zoom: 6 },
    'maharashtra': { lat: 19.0760, lng: 77.2301, zoom: 7 },
    'gj': { lat: 22.2587, lng: 71.1924, zoom: 7 },
    'rj': { lat: 27.0238, lng: 74.2179, zoom: 6 },
    'mh': { lat: 19.0760, lng: 77.2301, zoom: 7 }
  };

  // Sample addresses for different areas in the three states
  const sampleAddresses = {
    gujarat: [
      'Ahmedabad, Gujarat, India',
      'Surat, Gujarat, India', 
      'Vadodara, Gujarat, India',
      'Rajkot, Gujarat, India',
      'Gandhinagar, Gujarat, India'
    ],
    rajasthan: [
      'Jaipur, Rajasthan, India',
      'Udaipur, Rajasthan, India',
      'Jodhpur, Rajasthan, India',
      'Ajmer, Rajasthan, India',
      'Kota, Rajasthan, India'
    ],
    maharashtra: [
      'Mumbai, Maharashtra, India',
      'Pune, Maharashtra, India',
      'Nagpur, Maharashtra, India',
      'Nashik, Maharashtra, India',
      'Aurangabad, Maharashtra, India'
    ]
  };

  useEffect(() => {
    if (location) {
      generateStateMap(location);
    }
  }, [location]);

  // Cleanup timeout and animation on unmount
  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const generateStateMap = (locationString) => {
    setLoading(true);
    setError(null);

    try {
      const lowerLocation = locationString.toLowerCase();
      let stateData = null;
      let detectedState = null;
      
      // Check if location contains any of the target states
      for (const [state, coords] of Object.entries(stateCoordinates)) {
        if (lowerLocation.includes(state)) {
          stateData = coords;
          detectedState = state;
          break;
        }
      }

      if (stateData) {
        // Generate interactive map for the specific state
        const { lat, lng, zoom } = stateData;
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-2},${lat-2},${lng+2},${lat+2}&layer=mapnik&marker=${lat},${lng}`;
        
        setMapUrl(mapUrl);
        setIsInteractive(true);
        console.log(`Interactive state map generated for: ${locationString} (${detectedState})`);
      } else {
        // Default to showing all three states
        const allStatesUrl = `https://www.openstreetmap.org/export/embed.html?bbox=68,19,78,27&layer=mapnik`;
        setMapUrl(allStatesUrl);
        setIsInteractive(true);
        console.log('Default interactive map showing Gujarat, Rajasthan, Maharashtra');
      }
      
    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to generate state map');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (event) => {
    console.log('Map clicked!', { isInteractive, onLocationSelect, geocodingLoading });
    
    if (!isInteractive || !onLocationSelect || geocodingLoading) {
      console.log('Click ignored - conditions not met');
      return;
    }

    // Prevent multiple clicks while processing
    event.preventDefault();
    event.stopPropagation();

    // Get click position relative to map container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log(`Click position: x=${x}, y=${y}, map dimensions: ${rect.width}x${rect.height}`);
    
    // Convert pixel coordinates to lat/lng
    // This is a simplified conversion for the India states region
    const mapBounds = {
      north: 27.5,   // Northern edge (Rajasthan)
      south: 15.5,   // Southern edge (Maharashtra)
      east: 78.5,    // Eastern edge (Maharashtra)
      west: 68.0     // Western edge (Gujarat)
    };
    
    // Calculate latitude and longitude from click position
    const lat = mapBounds.north - (y / rect.height) * (mapBounds.north - mapBounds.south);
    const lng = mapBounds.west + (x / rect.width) * (mapBounds.east - mapBounds.west);
    
    console.log(`Converted to coordinates: (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    
    // Add a visual indicator of the clicked location
    addClickIndicator(x, y);
    
    // Perform reverse geocoding to get exact address
    performReverseGeocoding(lat, lng);
  };

  const handleMouseMove = (event) => {
    if (!isInteractive || geocodingLoading) return;

    // Clear any existing timeout
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }

    // Get mouse position relative to map container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Ensure marker stays within map boundaries
    const boundedX = Math.max(0, Math.min(x, rect.width));
    const boundedY = Math.max(0, Math.min(y, rect.height));
    
    // Set target position for smooth animation
    targetPositionRef.current = { x: boundedX, y: boundedY };
    
    // Set moving state and style for faster transitions
    setIsMoving(true);
    setMarkerStyle('instant');
    setIsHovering(true);
    
    // Start smooth animation
    if (!animationFrameRef.current) {
      animateMarker();
    }
    
    // Clear moving state after mouse stops
    moveTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
      setMarkerStyle('smooth');
    }, 150);
  };

  const animateMarker = () => {
    const target = targetPositionRef.current;
    const current = currentPositionRef.current;
    
    if (target.x === null || target.y === null) {
      currentPositionRef.current = { x: target.x, y: target.y };
      setMarkerPosition({ x: target.x, y: target.y });
      animationFrameRef.current = null;
      return;
    }
    
    // Initialize current position if not set
    if (current.x === null || current.y === null) {
      currentPositionRef.current = { x: target.x, y: target.y };
    }
    
    // Enhanced easing for more satisfying movement
    const easing = isMoving ? 0.25 : 0.12; // Faster when moving, smoother when stopped
    const newX = current.x + (target.x - current.x) * easing;
    const newY = current.y + (target.y - current.y) * easing;
    
    // Add subtle spring physics for more organic feel
    const springFactor = 0.02;
    const dampedX = newX + (target.x - newX) * springFactor;
    const dampedY = newY + (target.y - newY) * springFactor;
    
    // Update position
    currentPositionRef.current = { x: dampedX, y: dampedY };
    setMarkerPosition({ x: dampedX, y: dampedY });
    
    // Continue animation with lower threshold for more precision
    const distance = Math.sqrt(Math.pow(target.x - dampedX, 2) + Math.pow(target.y - dampedY, 2));
    if (distance > 0.2) {
      animationFrameRef.current = requestAnimationFrame(animateMarker);
    } else {
      currentPositionRef.current = { x: target.x, y: target.y };
      setMarkerPosition({ x: target.x, y: target.y });
      animationFrameRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsMoving(false);
    setMarkerStyle('smooth');
    
    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Hide marker after delay
    setTimeout(() => {
      if (!isHovering) {
        setMarkerPosition({ x: null, y: null });
        targetPositionRef.current = { x: null, y: null };
        currentPositionRef.current = { x: null, y: null };
      }
    }, 500);
  };

  const handleMouseEnter = () => {
    if (isInteractive && !geocodingLoading) {
      setIsHovering(true);
      setMarkerStyle('instant');
      
      // Add a subtle entrance animation
      setTimeout(() => {
        setMarkerStyle('smooth');
      }, 300);
    }
  };

  const addClickIndicator = (x, y) => {
    // Create multiple satisfying click indicators
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute;
          left: ${x}px;
          top: ${y}px;
          width: ${20 + i * 10}px;
          height: ${20 + i * 10}px;
          border: ${3 - i}px solid rgba(17, 71, 20, ${0.6 - i * 0.2});
          border-radius: 50%;
          background: rgba(17, 71, 20, ${0.1 - i * 0.03});
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: ${1000 - i * 100};
          animation: clickPulse ${1 + i * 0.3}s ease-out forwards;
        `;
        
        const mapContainer = document.querySelector('.map-wrapper');
        if (mapContainer) {
          mapContainer.appendChild(indicator);
          
          // Remove indicator after animation
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, (1 + i * 0.3) * 1000);
        }
      }, i * 100);
    }
  };

  const performReverseGeocoding = async (lat, lng) => {
    setGeocodingLoading(true);
    try {
      console.log(`Performing reverse geocoding for: ${lat}, ${lng}`);
      
      // Use Nominatim reverse geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract detailed address components
        const address = {
          full: data.display_name,
          house_number: data.address?.house_number || '',
          road: data.address?.road || '',
          neighbourhood: data.address?.neighbourhood || '',
          suburb: data.address?.suburb || '',
          city: data.address?.city || data.address?.town || data.address?.village || '',
          district: data.address?.county || data.address?.district || '',
          state: data.address?.state || '',
          pincode: data.address?.postcode || '',
          country: data.address?.country || ''
        };
        
        console.log('Reverse geocoded address:', address);
        
        // Format the address for the form
        const formattedAddress = formatAddressForForm(address);
        
        // Trigger the location selection callback with detailed address
        if (onLocationSelect) {
          onLocationSelect(formattedAddress);
        }
        
        // Show success message with the exact address
        alert(`📍 Exact location selected: ${address.full}`);
        
      } else {
        throw new Error('No address found for this location');
      }
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      // Fallback to sample address if reverse geocoding fails
      const fallbackAddress = getSampleAddress(lat, lng);
      if (fallbackAddress && onLocationSelect) {
        onLocationSelect(fallbackAddress);
        alert(`📍 Location selected (approximate): ${fallbackAddress}`);
      } else {
        alert('❌ Unable to determine address for this location. Please try clicking elsewhere.');
      }
    } finally {
      setGeocodingLoading(false);
    }
  };

  const formatAddressForForm = (address) => {
    // Create a comprehensive address string for the form
    let addressParts = [];
    
    if (address.house_number) addressParts.push(address.house_number);
    if (address.road) addressParts.push(address.road);
    if (address.neighbourhood) addressParts.push(address.neighbourhood);
    
    const streetAddress = addressParts.join(', ');
    const city = address.city || address.suburb || '';
    const district = address.district || city;
    const state = address.state || '';
    const pincode = address.pincode || generatePincodeForCity(city);
    
    return {
      streetAddress,
      city,
      district,
      state,
      pincode,
      full: address.full
    };
  };

  const generatePincodeForCity = (city) => {
    // Generate pincodes based on city name
    const cityLower = city.toLowerCase();
    const pincodes = {
      'ahmedabad': '380001',
      'surat': '395001',
      'vadodara': '390001',
      'rajkot': '360001',
      'gandhinagar': '382010',
      'jaipur': '302001',
      'udaipur': '313001',
      'jodhpur': '342001',
      'ajmer': '305001',
      'kota': '324001',
      'mumbai': '400001',
      'pune': '411001',
      'nagpur': '440001',
      'nashik': '422001',
      'aurangabad': '431001'
    };
    
    // Try to find matching city
    for (const [cityName, pincode] of Object.entries(pincodes)) {
      if (cityLower.includes(cityName)) {
        return pincode;
      }
    }
    
    // Generate a plausible pincode based on state
    if (cityLower.includes('gujarat')) return '380000';
    if (cityLower.includes('rajasthan')) return '300000';
    if (cityLower.includes('maharashtra')) return '400000';
    
    return '400000'; // Default
  };

  const getSampleAddress = (lat, lng) => {
    // Simplified address selection based on coordinates
    if (lat > 20 && lat < 25 && lng > 68 && lng < 75) {
      // Gujarat region
      const gujaratAddresses = sampleAddresses.gujarat;
      return gujaratAddresses[Math.floor(Math.random() * gujaratAddresses.length)];
    } else if (lat > 24 && lat < 31 && lng > 69 && lng < 78) {
      // Rajasthan region  
      const rajasthanAddresses = sampleAddresses.rajasthan;
      return rajasthanAddresses[Math.floor(Math.random() * rajasthanAddresses.length)];
    } else if (lat > 16 && lat < 22 && lng > 72 && lng < 81) {
      // Maharashtra region
      const maharashtraAddresses = sampleAddresses.maharashtra;
      return maharashtraAddresses[Math.floor(Math.random() * maharashtraAddresses.length)];
    }
    return null;
  };

  const parseAddress = (addressString) => {
    // Parse address into components
    const parts = addressString.split(',').map(part => part.trim());
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[2] || '',
      full: addressString
    };
  };

  // Handle state selection from the state bar
  const handleStateSelect = (state) => {
    setSelectedState(state);
    
    // Get a sample address from the selected state
    const stateAddresses = sampleAddresses[state.toLowerCase()];
    if (stateAddresses && stateAddresses.length > 0) {
      const randomAddress = stateAddresses[Math.floor(Math.random() * stateAddresses.length)];
      
      // Update the map to focus on the selected state
      const coords = stateCoordinates[state.toLowerCase()];
      if (coords) {
        const { lat, lng, zoom } = coords;
        const newMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-2},${lat-2},${lng+2},${lat+2}&layer=mapnik&marker=${lat},${lng}`;
        setMapUrl(newMapUrl);
      }
      
      // Trigger the location selection callback
      if (onLocationSelect) {
        onLocationSelect(randomAddress);
      }
      
      console.log(`State selected: ${state}, Address: ${randomAddress}`);
    }
  };

  if (loading) {
    return (
      <div className="states-map-container">
        <div className="instant-loading">
          <div className="fast-spinner"></div>
          <p>Loading state map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="states-map-container">
        <div className="error-map">
          <p>📍 {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="states-map-container">
      <div className="states-map-header">
        <h4>🗺️ Service Area: Gujarat, Rajasthan, Maharashtra</h4>
        <p>{isInteractive ? '👆 Move the marker to your exact location, then click to select' : 'We deliver across these three states'}</p>
      </div>

      {/* State Selection Bar */}
      {isInteractive && onLocationSelect && (
        <div className="state-selection-bar">
          <h5>Quick State Selection:</h5>
          <div className="state-buttons">
            <button 
              className={`state-btn ${selectedState === 'Gujarat' ? 'active' : ''}`}
              onClick={() => handleStateSelect('Gujarat')}
            >
              🌴 Gujarat
            </button>
            <button 
              className={`state-btn ${selectedState === 'Rajasthan' ? 'active' : ''}`}
              onClick={() => handleStateSelect('Rajasthan')}
            >
              🏜️ Rajasthan
            </button>
            <button 
              className={`state-btn ${selectedState === 'Maharashtra' ? 'active' : ''}`}
              onClick={() => handleStateSelect('Maharashtra')}
            >
              🌊 Maharashtra
            </button>
          </div>
        </div>
      )}
      
      <div className="states-map" style={{ height }}>
        {mapUrl ? (
          <div 
            className="map-wrapper"
            onClick={handleMapClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{ cursor: isInteractive && onLocationSelect && !geocodingLoading ? 'crosshair' : 'default' }}
          >
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px' }}
              allowFullScreen
              loading="lazy"
              title="India States Map"
            />
            
            {/* Movable Marker */}
            {isInteractive && !geocodingLoading && markerPosition.x !== null && markerPosition.y !== null && (
              <div 
                className={`movable-marker ${markerStyle}`}
                style={{
                  position: 'absolute',
                  left: `${markerPosition.x}px`,
                  top: `${markerPosition.y}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 999
                }}
              >
                {/* Blinkit-style ripple effect */}
                <div className="marker-ripple"></div>
                
                <div className="marker-pin">
                  <div className="marker-icon">📍</div>
                  <div className="marker-shadow"></div>
                </div>
              </div>
            )}
            
            {isInteractive && onLocationSelect && (
              <div className="click-overlay">
                {geocodingLoading ? (
                  <div className="geocoding-loading">
                    <div className="geocoding-spinner"></div>
                    <div className="geocoding-text">Getting exact address...</div>
                  </div>
                ) : (
                  <div className="click-hint">
                    {isHovering ? '👆 Click to select this location' : '👆 Move mouse to point to location'}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="placeholder-map">
            <p>📍 Select a location in Gujarat, Rajasthan, or Maharashtra</p>
          </div>
        )}
      </div>
      
      {showInfo && location && (
        <div className="location-info">
          <h4>📍 Delivery Location</h4>
          <p><strong>Address:</strong> {location}</p>
          <p><strong>Service States:</strong> Gujarat, Rajasthan, Maharashtra</p>
        </div>
      )}
    </div>
  );
};

export default IndiaStatesMap;
