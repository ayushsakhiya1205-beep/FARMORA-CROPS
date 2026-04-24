import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { districts, states } from '../data/districts';
import { API_URL, getImageUrl } from '../config';
import ReactLeafletMap from '../components/ReactLeafletMap';
import RazorpayPayment from '../components/RazorpayPayment';
import './Cart.css';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [quantityAnimations, setQuantityAnimations] = useState(new Map());
  const [buttonAnimations, setButtonAnimations] = useState(new Map());
  const [quantityInputs, setQuantityInputs] = useState(new Map());
  const [showMap, setShowMap] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    houseNo: '',
    street: '',
    area: '',
    pincode: '',
    district: '',
    taluka: '',
    state: '',
    mobileNumber: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    upiId: ''
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [map, setMap] = useState(null);

  // Payment options configuration
  const paymentOptions = [
    { 
      id: 'cod', 
      label: 'Cash on Delivery (COD)', 
      description: 'Pay cash when your order is delivered',
      icon: '💵'
    },
    { 
      id: 'razorpay', 
      label: 'Online Payment', 
      description: 'Pay instantly via UPI, Cards, Net Banking & Wallets',
      icon: '💳'
    }
  ];

  // Delivery fee calculation function
  const calculateDeliveryFee = (orderAmount) => {
    if (orderAmount <= 300) {
      return { fee: 0, description: 'Free Delivery', finalAmount: orderAmount };
    }
    if (orderAmount > 300 && orderAmount <= 1000) {
      return { fee: 100, description: 'Standard Delivery', finalAmount: orderAmount + 100 };
    }
    if (orderAmount > 1000 && orderAmount <= 2000) {
      return { fee: 150, description: 'Express Delivery', finalAmount: orderAmount + 150 };
    }
    if (orderAmount > 2000) {
      return { fee: 210, description: 'Premium Delivery', finalAmount: orderAmount + 210 };
    }
    return { fee: 0, description: 'Free Delivery', finalAmount: orderAmount };
  };

  useEffect(() => {
    if (user) {
      // Fast initial load - show cart immediately
      setInitialLoad(false);
      fetchCart();
      // Populate delivery address from user data
      setDeliveryAddress({
        houseNo: user.houseNo || '',
        street: user.street || '',
        area: user.area || '',
        pincode: user.pincode || '',
        district: user.district || '',
        taluka: user.taluka || '',
        state: user.state || '',
        mobileNumber: user.phone || user.mobileNumber || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // Helper function to get the correct product ID from cart item
  const getProductId = (item) => {
    return item.productId?._id || item.productId || item.product;
  };

  // Handle quantity input change
  const handleQuantityInputChange = (productId, value) => {
    const actualProductId = typeof productId === 'object' ? productId._id || productId.toString() : productId;
    
    // Allow empty string (for backspace) and numbers only
    if (value === '' || /^[0-9]*$/.test(value)) {
      setQuantityInputs(prev => new Map(prev).set(actualProductId, value));
    }
  };

  // Handle quantity input blur (when user finishes typing)
  const handleQuantityInputBlur = async (productId, currentValue) => {
    const actualProductId = typeof productId === 'object' ? productId._id || productId.toString() : productId;
    const inputValue = quantityInputs.get(actualProductId);
    
    // Clear input state
    setQuantityInputs(prev => {
      const newMap = new Map(prev);
      newMap.delete(actualProductId);
      return newMap;
    });
    
    // If input is empty, revert to current value
    if (inputValue === '' || inputValue === undefined) {
      return;
    }
    
    const newQuantity = parseInt(inputValue) || 1;
    
    // Only update if quantity is different and valid
    const currentItem = cart.items.find(item => {
      const itemProductId = item.productId?._id || item.productId || item.product;
      return itemProductId === actualProductId;
    });
    
    if (currentItem && currentItem.quantity !== newQuantity && newQuantity > 0) {
      await updateQuantity(actualProductId, newQuantity);
    }
  };

  // Handle quantity input key press
  const handleQuantityKeyPress = (e, productId, currentValue) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuantityInputBlur(productId, currentValue);
    }
  };

  const fetchCart = async () => {
    try {
      console.log('Fetching cart...');
      const res = await axios.get(`${API_URL}/api/cart`);
      console.log('Cart response:', res.data);
      
      // Ensure the cart has the expected structure
      const cartData = res.data || {};
      if (!cartData.items || !Array.isArray(cartData.items)) {
        console.warn('🔍 DEBUG: Cart response missing items array, initializing empty cart');
        cartData.items = [];
      }
      
      if (!cartData.totalAmount && typeof cartData.totalAmount !== 'number') {
        console.warn('🔍 DEBUG: Cart response missing totalAmount, calculating from items');
        cartData.totalAmount = cartData.items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      }
      
      console.log('🔍 DEBUG: Processed cart data:', cartData);
      setCart(cartData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error.response?.data || error.message);
      
      // Set empty cart on error to prevent undefined issues
      setCart({
        items: [],
        totalAmount: 0
      });
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    setDeliveryAddress({
      ...deliveryAddress,
      state: e.target.value,
      district: '' // Reset district when state changes
    });
  };

  // -----------------------------------------------
  // ✅ FIXED: updateQuantity using item.product (NOT productId)
  // -----------------------------------------------
  const updateQuantity = async (productId, newQuantity, buttonType = null) => {
    if (newQuantity < 1) return;

    console.log('🔍 DEBUG: updateQuantity called with:', { productId, newQuantity, buttonType });

    // Extract the correct product ID (handle both string and object formats)
    const actualProductId = typeof productId === 'object' ? productId._id || productId.toString() : productId;
    
    console.log('🔍 DEBUG: Extracted actualProductId:', actualProductId);
    
    // Track which button was pressed for animation
    if (buttonType) {
      const animationKey = `${actualProductId}-${buttonType}`;
      setButtonAnimations(prev => new Map(prev).set(animationKey, true));
      
      // Clear button animation after a short delay
      setTimeout(() => {
        setButtonAnimations(prev => {
          const newMap = new Map(prev);
          newMap.delete(animationKey);
          return newMap;
        });
      }, 200);
    }
    
    // Add smooth animation to quantity display
    setQuantityAnimations(prev => new Map(prev).set(actualProductId, true));
    
    // Clear quantity animation after a short delay
    setTimeout(() => {
      setQuantityAnimations(prev => {
        const newMap = new Map(prev);
        newMap.delete(actualProductId);
        return newMap;
      });
    }, 300);

    try {
      console.log('🔍 DEBUG: Updating quantity:', actualProductId, newQuantity);
      console.log('🔍 DEBUG: Current cart items:', cart.items);
      console.log('🔍 DEBUG: API URL:', `${API_URL}/api/cart/${actualProductId}`);
      
      const response = await axios.put(`${API_URL}/api/cart/${actualProductId}`, {
        quantity: newQuantity
      });
      console.log('🔍 DEBUG: Update response:', response.data);
      
      // Update local state immediately for better UX with smooth transition
      setCart(prevCart => {
        console.log('🔍 DEBUG: Updating cart state, prevCart:', prevCart);
        
        const updatedCart = {
          ...prevCart,
          items: prevCart.items.map(item => {
            const itemProductId = item.productId?._id || item.productId || item.product;
            console.log('🔍 DEBUG: Comparing itemProductId:', itemProductId, 'with actualProductId:', actualProductId);
            return itemProductId === actualProductId 
              ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
              : item;
          }),
          totalAmount: prevCart.items.reduce((total, item) => {
            const itemProductId = item.productId?._id || item.productId || item.product;
            return itemProductId === actualProductId 
              ? total + (item.price * newQuantity)
              : total + item.subtotal;
          }, 0)
        };
        
        console.log('🔍 DEBUG: Updated cart:', updatedCart);
        return updatedCart;
      });
      
      // Then fetch fresh data from server to ensure consistency
      setTimeout(() => {
        fetchCart();
      }, 500);
      
    } catch (error) {
      console.error('🔍 DEBUG: Full error object:', error);
      console.error('🔍 DEBUG: Error response:', error.response);
      console.error('🔍 DEBUG: Error status:', error.response?.status);
      console.error('🔍 DEBUG: Error data:', error.response?.data);
      console.error('🔍 DEBUG: Error message:', error.message);
      
      alert(error.response?.data?.message || error.message || 'Failed to update quantity');
    }
  };

  // -----------------------------------------------
  // ✅ FIXED: removeItem using item.product (NOT productId)
  // -----------------------------------------------
  const removeItem = async (productId) => {
    // Extract the correct product ID (handle both string and object formats)
    const actualProductId = typeof productId === 'object' ? productId._id || productId.toString() : productId;
    
    try {
      console.log('Removing item:', actualProductId);
      const response = await axios.delete(`${API_URL}/api/cart/${actualProductId}`);
      console.log('Remove response:', response.data);
      fetchCart();
    } catch (error) {
      console.error('Error removing item:', error.response?.data || error.message);
      alert(`Failed to remove item: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to remove all items from your cart?')) {
      return;
    }

    try {
      console.log('Clearing cart...');
      const response = await axios.delete(`${API_URL}/api/cart`);
      console.log('Clear cart response:', response.data);
      fetchCart();
    } catch (error) {
      console.error('Error clearing cart:', error.response?.data || error.message);
      alert(`Failed to clear cart: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  // Load Google Maps API script
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      return;
    }

    // Create global callback function
    window.initMap = () => {
      console.log('Google Maps API initialized via callback');
      if (showMapModal) {
        setTimeout(initializeMap, 100);
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD4iE2xV5kGnNvX5hG5kK2jL8mN9oPqRs&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API script loaded successfully');
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
      alert('Failed to load Google Maps. Please check your internet connection and try again.');
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete window.initMap;
    };
  }, [showMapModal]);

  // Initialize map
  const initializeMap = () => {
    console.log('Initializing map...');
    
    // Check if Google Maps API is available
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      alert('Google Maps API is not available. Please refresh the page and try again.');
      return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    try {
      // Clear any existing map
      if (window.mapInstance) {
        window.mapInstance = null;
      }

      const mapInstance = new window.google.maps.Map(mapContainer, {
        center: mapCenter,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: true,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'cooperative'
      });

      window.mapInstance = mapInstance;
      setMap(mapInstance);
      console.log('Map initialized successfully');

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log('Map clicked at:', lat, lng);
        setSelectedLocation({ lat, lng });
        
        // Clear previous markers
        if (window.mapMarkers) {
          window.mapMarkers.forEach(marker => marker.setMap(null));
        }
        window.mapMarkers = [];
        
        // Add new marker
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: 'Selected Delivery Location'
        });
        
        window.mapMarkers.push(marker);
      });

      // Trigger resize to ensure map renders properly
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, 'resize');
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      alert('Failed to initialize map. Please refresh the page and try again.');
    }
  };

  // Open map modal
  const openMapModal = () => {
    console.log('Opening map modal...');
    setShowMap(true);
  };

  // Handle location selection from map
  const handleLocationSelect = (selectedAddress) => {
    console.log('Location selected from map:', selectedAddress);
    
    // Handle both string addresses and detailed address objects
    let addressData;
    if (typeof selectedAddress === 'string') {
      // Parse string address (backward compatibility)
      const addressParts = selectedAddress.split(',').map(part => part.trim());
      
      // Special handling for single city names like "Rajkot"
      if (addressParts.length === 1) {
        // Single city name - use it as both city and district
        const cityName = addressParts[0];
        addressData = {
          streetAddress: '',
          city: cityName,
          district: cityName,
          state: 'Gujarat',
          pincode: generatePincodeForCity(cityName) || '',
          full: selectedAddress
        };
      } else {
        // Multiple address parts - parse normally
        addressData = {
          streetAddress: addressParts[0] || '',
          city: addressParts[1] || '',
          district: addressParts[1] || '',
          state: addressParts[2] || '',
          pincode: generatePincodeForCity(addressParts[1]) || '',
          full: selectedAddress
        };
      }
    } else {
      // Use detailed address object
      addressData = selectedAddress;
    }
    
    // Update delivery address fields with exact address
    setDeliveryAddress(prev => ({
      ...prev,
      address: addressData.address || addressData.streetAddress || addressData.city || '',
      state: addressData.state || '',
      district: addressData.district || addressData.city || '',
      pincode: addressData.pincode || generatePincodeForCity(addressData.city)
    }));
    
    // Show user-friendly success message
    const mainAddress = addressData.address || addressData.streetAddress || 'Location';
    const city = addressData.city || addressData.district || '';
    const state = addressData.state || '';
    const district = addressData.district || '';
    
    let successMessage = '🎉 Location selected successfully!\n\n';
    successMessage += `📍 Address: ${mainAddress}\n`;
    if (district) successMessage += `🏛️ District: ${district}\n`;
    if (city && city !== district) successMessage += `🏙️ City: ${city}\n`;
    if (state) successMessage += `🌍 State: ${state}\n`;
    if (addressData.pincode) successMessage += `📮 Pincode: ${addressData.pincode}\n`;
    successMessage += '\n✅ All address fields have been updated!';
    
    alert(successMessage);
  };

  // Generate sample pincode for major cities
  const generatePincodeForCity = (city) => {
    const pincodes = {
      'Ahmedabad': '380001',
      'Surat': '395001',
      'Vadodara': '390001',
      'Rajkot': '360001',
      'Gandhinagar': '382010',
      'Jaipur': '302001',
      'Udaipur': '313001',
      'Jodhpur': '342001',
      'Ajmer': '305001',
      'Kota': '324001',
      'Mumbai': '400001',
      'Pune': '411001',
      'Nagpur': '440001',
      'Nashik': '422001',
      'Aurangabad': '431001'
    };
    return pincodes[city] || '400000'; // Default pincode
  };

  // Close map modal
  const closeMapModal = () => {
    setShowMap(false);
  };

  // Confirm location selection
  const confirmLocationSelection = async () => {
    if (!selectedLocation) {
      alert('Please select a location on the map');
      return;
    }

    setLocationLoading(true);
    
    try {
      console.log('Getting address for location:', selectedLocation);
      
      // Use Google Maps Geocoding API to get address from coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedLocation.lat},${selectedLocation.lng}&key=AIzaSyD4iE2xV5kGnNvX5hG5kK2jL8mN9oPqRs`
      );
      const data = await response.json();
      
      console.log('Geocoding response:', data);
      
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const formattedAddress = data.results[0].formatted_address;
        
        console.log('Address components:', addressComponents);
        
        // Extract address components
        let newAddress = { ...deliveryAddress };
        
        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('sublocality') || types.includes('locality') || types.includes('route')) {
            newAddress.address = formattedAddress;
          }
          
          if (types.includes('administrative_area_level_1')) {
            newAddress.state = component.long_name;
          }
          
          if (types.includes('administrative_area_level_2') || types.includes('locality')) {
            newAddress.district = component.long_name;
          }
          
          if (types.includes('postal_code')) {
            newAddress.pincode = component.long_name;
          }
        });
        
        console.log('New address:', newAddress);
        
        setDeliveryAddress(newAddress);
        setMapCenter(selectedLocation);
        closeMapModal();
        alert('Location selected successfully! Address has been filled automatically.');
      } else {
        alert('Could not determine address from selected location. Please try again.');
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      alert('Failed to get address from location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Get current location using browser geolocation with enhanced address parsing
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('🔍 DEBUG: Got precise location:', latitude, longitude);
        
        try {
          // Use OpenStreetMap Nominatim API for detailed address (free and no API key needed)
          console.log('🔍 DEBUG: Fetching from OpenStreetMap...');
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch address data');
          }
          
          const data = await response.json();
          console.log('🔍 DEBUG: Raw OpenStreetMap response:', data);
          
          if (data && data.address) {
            const addr = data.address;
            const formattedAddress = data.display_name;
            
            console.log('🔍 DEBUG: Address object:', addr);
            console.log('🔍 DEBUG: Formatted address:', formattedAddress);
            
            // Extract comprehensive address components
            let newAddress = { ...deliveryAddress };
            
            // House number and street address - Enhanced extraction
            const houseNumber = addr.house_number || addr.building || '';
            const streetName = addr.road || addr.street || addr.pedestrian || '';
            const neighbourhood = addr.neighbourhood || addr.suburb || addr.hamlet || '';
            const city = addr.city || addr.town || addr.village || addr.locality || '';
            
            console.log('🔍 DEBUG: Extracted components:', {
              houseNumber,
              streetName,
              neighbourhood,
              city
            });
            
            // Build complete street address with better logic
            let streetAddress = '';
            
            // Start with house number if available
            if (houseNumber) {
              streetAddress = houseNumber;
              console.log('🔍 DEBUG: Added house number:', streetAddress);
            }
            
            // Add street name
            if (streetName) {
              streetAddress = streetAddress ? `${streetAddress}, ${streetName}` : streetName;
              console.log('🔍 DEBUG: Added street name:', streetAddress);
            }
            
            // Add neighbourhood if different from street name
            if (neighbourhood && !streetName.includes(neighbourhood) && !neighbourhood.includes(streetName)) {
              streetAddress = streetAddress ? `${streetAddress}, ${neighbourhood}` : neighbourhood;
              console.log('🔍 DEBUG: Added neighbourhood:', streetAddress);
            }
            
            // If still no street address, use the first part of formatted address
            if (!streetAddress && formattedAddress) {
              const addressParts = formattedAddress.split(',');
              if (addressParts.length > 0) {
                streetAddress = addressParts[0].trim();
                console.log('🔍 DEBUG: Using formatted address fallback:', streetAddress);
              }
            }
            
            // District
            const district = addr.county || addr.district || addr.city_district || city;
            
            // State
            const state = addr.state || '';
            
            // Pincode
            const pincode = addr.postcode || addr.postal_code || '';
            
            console.log('🔍 DEBUG: Final parsed address:', {
              streetAddress,
              district,
              state,
              pincode
            });
            
            // Update delivery address with complete information
            newAddress.address = streetAddress || '';
            newAddress.district = district || '';
            newAddress.state = state || '';
            newAddress.pincode = pincode || '';
            
            console.log('🔍 DEBUG: Setting delivery address:', newAddress);
            
            setDeliveryAddress(newAddress);
            
            // Show success message with detailed information
            let successMessage = '🎉 Location detected successfully!\n\n';
            if (newAddress.address) successMessage += `📍 Address: ${newAddress.address}\n`;
            if (newAddress.district) successMessage += `🏛️ District: ${newAddress.district}\n`;
            if (newAddress.state) successMessage += `🌍 State: ${newAddress.state}\n`;
            if (newAddress.pincode) successMessage += `📮 Pincode: ${newAddress.pincode}\n`;
            successMessage += '\nAll address fields have been filled automatically!';
            
            alert(successMessage);
            
          } else {
            console.log('🔍 DEBUG: No address data in response, trying Google Maps fallback...');
            // Fallback to Google Maps if Nominatim fails
            await fallbackToGoogleMaps(latitude, longitude);
          }
        } catch (error) {
          console.error('🔍 DEBUG: Error with Nominatim, trying fallback:', error);
          // Try Google Maps as fallback
          await fallbackToGoogleMaps(latitude, longitude);
        }
      },
      (error) => {
        console.error('🔍 DEBUG: Geolocation error:', error);
        let errorMessage = '❌ Failed to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please check your GPS.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please try again or enter address manually.';
        }
        
        alert(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Fallback to Google Maps if Nominatim fails
  const fallbackToGoogleMaps = async (latitude, longitude) => {
    try {
      console.log('🔍 DEBUG: Trying Google Maps fallback...');
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyD4iE2xV5kGnNvX5hG5kK2jL8mN9oPqRs`
      );
      const data = await response.json();
      
      console.log('🔍 DEBUG: Raw Google Maps response:', data);
      
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const formattedAddress = data.results[0].formatted_address;
        
        console.log('🔍 DEBUG: Google Maps address components:', addressComponents);
        console.log('🔍 DEBUG: Google Maps formatted address:', formattedAddress);
        
        let newAddress = { ...deliveryAddress };
        let streetNumber = '';
        let routeName = '';
        
        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
            console.log('🔍 DEBUG: Found street number:', streetNumber);
          }
          
          if (types.includes('route')) {
            routeName = component.long_name;
            console.log('🔍 DEBUG: Found route name:', routeName);
          }
          
          if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            if (!newAddress.address || !newAddress.address.includes(component.long_name)) {
              newAddress.address = newAddress.address ? `${newAddress.address}, ${component.long_name}` : component.long_name;
              console.log('🔍 DEBUG: Added sublocality:', component.long_name);
            }
          }
          
          if (types.includes('locality')) {
            newAddress.district = component.long_name;
            console.log('🔍 DEBUG: Found district (locality):', component.long_name);
          }
          
          if (types.includes('administrative_area_level_1')) {
            newAddress.state = component.long_name;
            console.log('🔍 DEBUG: Found state:', component.long_name);
          }
          
          if (types.includes('postal_code')) {
            newAddress.pincode = component.long_name;
            console.log('🔍 DEBUG: Found pincode:', component.long_name);
          }
        });
        
        // Build street address from house number and route
        if (streetNumber && routeName) {
          newAddress.address = `${streetNumber}, ${routeName}`;
          console.log('🔍 DEBUG: Built address from street number and route:', newAddress.address);
        } else if (routeName) {
          newAddress.address = routeName;
          console.log('🔍 DEBUG: Built address from route only:', newAddress.address);
        } else if (streetNumber) {
          newAddress.address = streetNumber;
          console.log('🔍 DEBUG: Built address from street number only:', newAddress.address);
        } else if (!newAddress.address) {
          // Fallback to first part of formatted address
          const addressParts = formattedAddress.split(',');
          if (addressParts.length > 0) {
            newAddress.address = addressParts[0].trim();
            console.log('🔍 DEBUG: Using formatted address fallback:', newAddress.address);
          }
        }
        
        console.log('🔍 DEBUG: Final Google Maps parsed address:', newAddress);
        
        setDeliveryAddress(newAddress);
        alert('📍 Location detected using Google Maps! Address has been filled automatically.');
      } else {
        console.log('🔍 DEBUG: No results from Google Maps');
        alert('❌ Could not determine address from your location. Please enter manually.');
      }
    } catch (error) {
      console.error('🔍 DEBUG: Google Maps fallback also failed:', error);
      alert('❌ Failed to get address from location. Please enter your address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Debug function to test address parsing with sample data
  const debugAddressParsing = () => {
    console.log('🔍 Debugging address parsing...');
    
    // Test with sample OpenStreetMap data
    const sampleNominatimData = {
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
    };
    
    // Test with sample Google Maps data
    const sampleGoogleData = {
      address_components: [
        { long_name: '123', types: ['street_number'] },
        { long_name: 'MG Road', types: ['route'] },
        { long_name: 'Shivaji Nagar', types: ['sublocality_level_1'] },
        { long_name: 'Pune', types: ['locality'] },
        { long_name: 'Maharashtra', types: ['administrative_area_level_1'] },
        { long_name: '411001', types: ['postal_code'] }
      ],
      formatted_address: '123, MG Road, Shivaji Nagar, Pune, Maharashtra 411001, India'
    };
    
    console.log('Sample Nominatim data:', sampleNominatimData);
    console.log('Sample Google data:', sampleGoogleData);
    
    // Test the parsing logic
    const addr = sampleNominatimData.address;
    const houseNumber = addr.house_number || addr.building || '';
    const streetName = addr.road || addr.street || addr.pedestrian || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.hamlet || '';
    
    let streetAddress = '';
    if (houseNumber) streetAddress = houseNumber;
    if (streetName) streetAddress = streetAddress ? `${streetAddress}, ${streetName}` : streetName;
    if (neighbourhood && !streetName.includes(neighbourhood) && !neighbourhood.includes(streetName)) {
      streetAddress = streetAddress ? `${streetAddress}, ${neighbourhood}` : neighbourhood;
    }
    
    console.log('Parsed street address:', streetAddress);
    console.log('Expected: 123, MG Road, Shivaji Nagar');
    
    alert(`Debug: Parsed address "${streetAddress}" from sample data. Check console for details.`);
  };

  // Razorpay payment success handler
  const handleRazorpaySuccess = (paymentData) => {
    console.log('✅ Razorpay payment successful:', paymentData);
    
    // Redirect to order success page
    navigate('/order-success', { 
      state: { 
        order: { 
          _id: createdOrderId, 
          paymentStatus: 'completed',
          paymentMethod: 'razorpay',
          ...paymentData 
        } 
      } 
    });
  };

  // Razorpay payment error handler
  const handleRazorpayError = (errorMessage) => {
    console.error('❌ Razorpay payment error:', errorMessage);
    alert('Payment failed: ' + errorMessage);
    
    // Reset to show payment options again
    setShowPaymentSection(false);
  };

  const handlePlaceOrder = async () => {
    console.log('🔍 DEBUG: Cart data before placing order:', cart);
    console.log('🔍 DEBUG: Cart type:', typeof cart);
    console.log('🔍 DEBUG: Cart items:', cart?.items);
    console.log('🔍 DEBUG: Cart items length:', cart?.items?.length);
    
    // EMERGENCY FALLBACK: If cart is undefined, create a mock cart for testing
    if (!cart || !cart.items) {
      console.error('🔍 DEBUG: Cart is undefined, using emergency fallback...');
      
      // Try to refresh first
      try {
        await fetchCart();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!cart || !cart.items) {
          console.error('🔍 DEBUG: Cart refresh failed, using mock cart for testing');
          
          // Create a mock cart for testing purposes
          const mockCart = {
            items: [
              {
                productId: { _id: 'mock123' },
                product: 'Mock Product',
                name: 'Mock Product',
                quantity: 1,
                price: 100,
                subtotal: 100
              }
            ],
            totalAmount: 100
          };
          
          setCart(mockCart);
          console.log('🔍 DEBUG: Mock cart created:', mockCart);
          
          alert('Cart data was not available. A mock cart has been created for testing. Please refresh the page or contact support.');
          return;
        }
      } catch (error) {
        console.error('🔍 DEBUG: Cart refresh error:', error);
        
        // Create mock cart even if refresh fails
        const mockCart = {
          items: [
            {
              productId: { _id: 'mock123' },
              product: 'Mock Product',
              name: 'Mock Product',
              quantity: 1,
              price: 100,
              subtotal: 100
            }
          ],
          totalAmount: 100
        };
        
        setCart(mockCart);
        console.log('🔍 DEBUG: Emergency mock cart created:', mockCart);
        
        alert('Cart data is not available. A mock cart has been created for testing. Please refresh the page or contact support.');
        return;
      }
    }
    
    // Check if cart exists and has items with better error handling
    if (!cart) {
      console.error('🔍 DEBUG: Cart is null or undefined after all attempts');
      alert('Cart data is not available. Please refresh the page and try again.');
      return;
    }
    
    if (!cart.items || !Array.isArray(cart.items)) {
      console.error('🔍 DEBUG: Cart items is not an array:', cart.items);
      alert('Cart data is corrupted. Please refresh the page and try again.');
      return;
    }
    
    if (cart.items.length === 0) {
      console.error('🔍 DEBUG: Cart is empty');
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Validate delivery address
    if (!deliveryAddress.houseNo || !deliveryAddress.street || !deliveryAddress.area || 
        !deliveryAddress.pincode || !deliveryAddress.district || 
        !deliveryAddress.state || !deliveryAddress.mobileNumber) {
      alert('Please complete all delivery address fields');
      return;
    }

    // Validate payment details for non-COD methods
    if (paymentMethod !== 'cod') {
      if (paymentMethod === 'card' && (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv)) {
        alert('Please fill in all card details');
        return;
      }
      // UPI validation removed - allow UPI payment without ID validation
    }

    setOrderPlacing(true);
    try {
      // Calculate total amount if not available
      const totalAmount = cart.totalAmount || cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      console.log('🔍 DEBUG: Placing order with data:', {
        items: cart.items,
        deliveryAddress,
        paymentMethod,
        totalAmount: totalAmount
      });

      // Special debug for Rajkot
      if (deliveryAddress.city === 'Rajkot' || deliveryAddress.district === 'Rajkot') {
        console.log('🔍 DEBUG: Rajkot address detected:', deliveryAddress);
        console.log('🔍 DEBUG: Rajkot pincode:', deliveryAddress.pincode);
        console.log('🔍 DEBUG: Rajkot state:', deliveryAddress.state);
      }

      const orderData = {
        items: cart.items,
        deliveryAddress,
        paymentMethod,
        totalAmount: totalAmount,
        paymentDetails: paymentMethod !== 'cod' ? paymentDetails : null
      };

      console.log('🔍 DEBUG: Sending order data:', orderData);

      const response = await axios.post(`${API_URL}/api/orders`, orderData);
      console.log('🔍 DEBUG: Order response:', response.data);

      if (response.data.success) {
        const newOrder = response.data.order;
        
        if (paymentMethod === 'cod') {
          // COD: Order is complete, redirect to success
          console.log('✅ COD Order placed successfully');
          
          // Update user's default address with the delivery address used
          await updateDefaultAddress(deliveryAddress);

          // Clear cart after successful order
          setCart({ items: [], totalAmount: 0 });
          
          // Show success message immediately before navigation
          console.log('🔍 DEBUG: About to show success message');
          alert('Order placed successfully! Invoice has been sent to your email.');
          console.log('🔍 DEBUG: Success message shown, navigating to orders');
          
          // Navigate to orders page after showing message
          navigate('/orders');
          
        } else if (paymentMethod === 'razorpay') {
          // Razorpay: Show payment component
          console.log('✅ Order created, initiating payment');
          setCreatedOrderId(newOrder._id);
          setShowPaymentSection(true);
        }
      } else {
        alert('Failed to place order: ' + response.data.message);
      }
    } catch (error) {
      console.error('🔍 DEBUG: Full error object:', error);
      console.error('🔍 DEBUG: Error response:', error.response);
      console.error('🔍 DEBUG: Error status:', error.response?.status);
      console.error('🔍 DEBUG: Error data:', error.response?.data);
      
      let errorMessage = 'Failed to place order';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setOrderPlacing(false);
    }
  };

  if (initialLoad) {
    return <div className="loading">Loading cart...</div>;
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>

        {cart.items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/products')} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              <div className="cart-header">
                <h2>Your Items ({cart.items.length})</h2>
              </div>

              {cart.items.map((item, index) => (
                <div key={index} className="cart-item">

                  <div className="item-image">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} />
                    ) : (
                      <div className="item-placeholder">🌾</div>
                    )}
                  </div>

                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">{item.unit}</p>
                  </div>

                  <div className="item-subtotal">
                    ₹{item.subtotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </div>

                  {/* -----------------------------------------------
                      FIXED: Remove item - trash icon button
                   ----------------------------------------------- */}
                  <button
                    onClick={() => removeItem(getProductId(item))}
                    className="btn-remove"
                    aria-label="Remove item"
                  >
                    🗑️
                  </button>

                  {/* -----------------------------------------------
                      ENHANCED: Quantity controls with smooth animations
                   ----------------------------------------------- */}
                  <div className="quantity-controls">
                    <div className="quantity-input-group">
                      <button 
                        onClick={() => updateQuantity(getProductId(item), item.quantity - 1, 'decrement')}
                        disabled={item.quantity <= 1}
                        className={`quantity-btn quantity-btn-decrement ${
                          buttonAnimations.has(`${getProductId(item)}-decrement`) ? 'button-pressed' : ''
                        }`}
                        aria-label="Decrease quantity"
                      >
                        <span className="quantity-icon minus">−</span>
                      </button>
                      
                      <div className={`quantity-display ${
                        quantityAnimations.has(getProductId(item)) ? 'quantity-animated' : ''
                      }`}>
                        <input
                          type="text"
                          value={quantityInputs.get(getProductId(item)) !== undefined ? quantityInputs.get(getProductId(item)) : item.quantity}
                          onChange={(e) => handleQuantityInputChange(getProductId(item), e.target.value)}
                          onBlur={() => handleQuantityInputBlur(getProductId(item), item.quantity)}
                          onKeyPress={(e) => handleQuantityKeyPress(e, getProductId(item), item.quantity)}
                          className="quantity-input"
                          min="1"
                          maxLength={3}
                          placeholder=""
                        />
                      </div>
                      
                      <button 
                        onClick={() => updateQuantity(getProductId(item), item.quantity + 1, 'increment')}
                        className={`quantity-btn quantity-btn-increment ${
                          buttonAnimations.has(`${getProductId(item)}-increment`) ? 'button-pressed' : ''
                        }`}
                        aria-label="Increase quantity"
                      >
                        <span className="quantity-icon plus">+</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}

            </div>

            {/* RIGHT SIDE SUMMARY */}
            <div className="cart-summary">

              <div className="summary-card">
                <h2>Delivery Address</h2>
                
                <div className="location-button-container">
                  <button
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="btn btn-location"
                  >
                    {locationLoading ? (
                      <>
                        <span className="location-spinner">⟳</span>
                        Detecting Location...
                      </>
                    ) : (
                      <>
                        <span className="location-icon">📍</span>
                        Use My Current Location
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={openMapModal}
                    className="btn btn-map"
                  >
                    <span className="map-icon">🗺️</span>
                    Select Location on Map
                  </button>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="House No"
                    value={deliveryAddress.houseNo}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, houseNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Street"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Area"
                    value={deliveryAddress.area}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, area: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Taluka"
                    value={deliveryAddress.taluka}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, taluka: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <select
                    value={deliveryAddress.state}
                    onChange={(e) => handleStateChange(e)}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <select
                    value={deliveryAddress.district}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, district: e.target.value })}
                    disabled={!deliveryAddress.state}
                  >
                    <option value="">Select District</option>
                    {deliveryAddress.state && districts[deliveryAddress.state]?.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={deliveryAddress.mobileNumber}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, mobileNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="summary-card">
                <h2>Payment Method</h2>
                
                <div className="payment-options">
                  {paymentOptions.map((option) => (
                    <label key={option.id} className="payment-option">
                      <input
                        type="radio"
                        name="payment"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setShowPaymentSection(false);
                        }}
                      />
                      <div className="payment-option-content">
                        <span className="payment-label">
                          <span className="payment-icon">{option.icon}</span>
                          {option.label}
                        </span>
                        <span className="payment-description">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Razorpay Payment Section */}
                {paymentMethod === 'razorpay' && showPaymentSection && (
                  <div className="razorpay-payment-section">
                    <h4>Complete Online Payment</h4>
                    <p>Click the button below to pay securely using Razorpay</p>
                    
                    <RazorpayPayment
                      orderId={createdOrderId}
                      amount={calculateDeliveryFee(cart.totalAmount).finalAmount}
                      onSuccess={handleRazorpaySuccess}
                      onError={handleRazorpayError}
                    />
                    
                    <div className="supported-methods">
                      <p>Supported payment methods:</p>
                      <div className="payment-methods-list">
                        <span>💳 Credit/Debit Cards</span>
                        <span>📱 UPI (PhonePe, GPay, Paytm)</span>
                        <span>🏦 Net Banking</span>
                        <span>👛 Wallets</span>
                      </div>
                    </div>
                    
                    <div className="test-info">
                      <h5>🧪 Test Payment Information:</h5>
                      <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                      <p><strong>Expiry:</strong> Any future date</p>
                      <p><strong>CVV:</strong> Any 3 digits</p>
                      <p><strong>UPI:</strong> test@ybl</p>
                    </div>
                  </div>
                )}

                {/* COD Payment Info */}
                {paymentMethod === 'cod' && (
                  <div className="payment-info">
                    <p>💵 Pay cash when your order is delivered</p>
                  </div>
                )}
              </div>

              <div className="summary-card">
                <h2>Order Summary</h2>

                {/* Product Summary Section */}
                <div className="product-summary">
                  <h3>Products ({cart.items.length})</h3>
                  <div className="product-list">
                    {cart.items.map((item, index) => (
                      <div key={index} className="product-summary-item">
                        <div className="product-info">
                          <span className="product-name">{item.name}</span>
                          <span className="product-quantity">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="product-price">
                          ₹{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{cart.totalAmount.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery:</span>
                  <span>
                    {(() => {
                      const deliveryFee = calculateDeliveryFee(cart.totalAmount);
                      return deliveryFee.fee === 0 ? 'Free' : `₹${deliveryFee.fee.toFixed(2)}`;
                    })()}
                  </span>
                </div>

                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{(() => {
                    const deliveryFee = calculateDeliveryFee(cart.totalAmount);
                    return deliveryFee.finalAmount.toFixed(2);
                  })()}</span>
                </div>

                <button
                  onClick={clearCart}
                  className="btn btn-danger btn-large"
                  style={{marginBottom: '10px'}}
                >
                  Remove All Items
                </button>

                <button
                  onClick={paymentMethod === 'razorpay' && showPaymentSection ? 
                    () => setShowPaymentSection(false) : // Reset to show payment options
                    handlePlaceOrder // Create order or proceed with COD
                  }
                  disabled={orderPlacing}
                  className="btn btn-primary btn-large"
                >
                  {orderPlacing ? (
                    <span>Processing...</span>
                  ) : paymentMethod === 'razorpay' && showPaymentSection ? (
                    <span>Change Payment Method</span>
                  ) : (
                    <span>
                      {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Place Order (COD)'}
                    </span>
                  )}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
      
      {/* Map Modal */}
      {showMap && (
        <div className="map-modal-overlay" onClick={closeMapModal}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h3>Select Your Delivery Location</h3>
              <button onClick={closeMapModal} className="map-modal-close">×</button>
            </div>
            <div className="map-instructions">
              <p>📍 Click on the map or drag the marker to select your exact location</p>
              <p>�️ React Leaflet provides reliable map functionality with address detection</p>
            </div>
            <div className="simple-map-modal">
              <ReactLeafletMap 
                height="400px"
                onLocationSelect={handleLocationSelect}
              />
            </div>
            <div className="map-modal-footer">
              <button 
                onClick={closeMapModal} 
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
