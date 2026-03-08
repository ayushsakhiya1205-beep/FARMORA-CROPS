import React, { useEffect, useRef, useState } from 'react';
import MapFallback from './MapFallback';

const GoogleMaps = ({ onLocationSelect, height = '400px' }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);

  useEffect(() => {
    let timeoutTimer;
    let loadingTimeout;

    // Set a timeout for loading
    loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Google Maps loading timeout, showing fallback');
        setError('Google Maps failed to load within time limit');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    // Check if Google Maps API is already loaded
    const initializeMap = () => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        setError('Google Maps API failed to load');
        setLoading(false);
        return;
      }

      if (!mapRef.current) {
        console.error('Map container not found');
        setError('Map container not available');
        setLoading(false);
        return;
      }

      try {
        console.log('Initializing Google Maps...');
        
        // Default center (Delhi)
        const defaultCenter = { lat: 28.6139, lng: 77.2090 };
        
        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          gestureHandling: 'cooperative',
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false
        });

        console.log('Google Maps initialized successfully');

        // Create marker
        const marker = new window.google.maps.Marker({
          position: defaultCenter,
          map: map,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: 'Drag to select location'
        });

        console.log('Marker created successfully');

        // Add click event to map
        map.addListener('click', (event) => {
          console.log('Map clicked:', event.latLng);
          const position = event.latLng;
          marker.setPosition(position);
          setMarkerPosition(position);
          handleLocationSelect(position);
        });

        // Add drag event to marker
        marker.addListener('dragend', (event) => {
          console.log('Marker dragged:', event.latLng);
          const position = event.latLng;
          setMarkerPosition(position);
          handleLocationSelect(position);
        });

        markerRef.current = marker;
        setMapLoaded(true);
        setLoading(false);
        setError(null);
        clearTimeout(loadingTimeout);

        // Try to get user's current location
        if (navigator.geolocation) {
          console.log('Getting user location...');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('User location found:', position.coords);
              const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              map.setCenter(userLocation);
              marker.setPosition(userLocation);
              setMarkerPosition(userLocation);
            },
            (error) => {
              console.log('Could not get user location, using default:', error);
            }
          );
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map: ' + err.message);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    // Load Google Maps API if not already loaded
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        initializeMap();
        return;
      }

      console.log('Loading Google Maps API...');
      
      // Create script tag to load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD4iE2xV5kGnNvX5hG5kK2jL8mN9oPqRs&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps API script');
        setError('Failed to load Google Maps API');
        setLoading(false);
        clearTimeout(loadingTimeout);
      };
      
      // Create global callback function
      window.initGoogleMaps = () => {
        console.log('Google Maps API callback triggered');
        initializeMap();
      };
      
      document.head.appendChild(script);
    };

    // Add a small delay to ensure DOM is ready
    timeoutTimer = setTimeout(() => {
      loadGoogleMaps();
    }, 100);

    return () => {
      clearTimeout(timeoutTimer);
      clearTimeout(loadingTimeout);
      // Cleanup
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }
    };
  }, [loading]);

  const handleLocationSelect = async (position) => {
    try {
      console.log('Handling location selection:', position);
      
      // Reverse geocoding to get address
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: position }, (results, status) => {
        console.log('Geocoding result:', status, results);
        
        if (status === 'OK' && results[0]) {
          const address = results[0];
          const addressComponents = address.address_components;
          
          // Extract address components
          let houseNumber = '';
          let streetName = '';
          let neighbourhood = '';
          let city = '';
          let district = '';
          let state = '';
          let pincode = '';
          let fullAddress = address.formatted_address;
          
          addressComponents.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              houseNumber = component.long_name;
            }
            if (types.includes('route')) {
              streetName = component.long_name;
            }
            if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
              neighbourhood = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_2')) {
              district = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (types.includes('postal_code')) {
              pincode = component.long_name;
            }
          });
          
          // Build street address
          let streetAddress = '';
          if (houseNumber) streetAddress = houseNumber;
          if (streetName) streetAddress = streetAddress ? `${streetAddress}, ${streetName}` : streetName;
          if (neighbourhood && !streetName.includes(neighbourhood)) {
            streetAddress = streetAddress ? `${streetAddress}, ${neighbourhood}` : neighbourhood;
          }
          
          const locationData = {
            address: streetAddress || fullAddress.split(',')[0],
            district: district || city,
            state: state,
            pincode: pincode,
            fullAddress: fullAddress,
            coordinates: {
              lat: position.lat(),
              lng: position.lng()
            }
          };
          
          console.log('Google Maps location selected:', locationData);
          
          if (onLocationSelect) {
            onLocationSelect(locationData);
          }
        } else {
          console.error('Geocoding failed:', status);
          // Fallback to coordinates only
          if (onLocationSelect) {
            onLocationSelect({
              address: 'Selected location',
              coordinates: {
                lat: position.lat(),
                lng: position.lng()
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error in location selection:', error);
    }
  };

  if (error) {
    return <MapFallback onLocationSelect={onLocationSelect} height={height} />;
  }

  return (
    <div style={{ position: 'relative', height: height }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8f9fa',
          zIndex: 1,
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
            <div>Loading Google Maps...</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Please wait a moment...
            </div>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#e9ecef'
        }}
      />
      
      {mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontSize: '14px',
          zIndex: 2
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>📍 Google Maps</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Click or drag marker to select location
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMaps;
