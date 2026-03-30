import React, { useEffect, useState, useContext } from 'react';

import axios from 'axios';

import { API_URL } from '../config';

import AuthContext from '../context/AuthContext';

import './Dashboard.css';







const OutletDashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);



  const [orders, setOrders] = useState([]);



  const [deliveryBoys, setDeliveryBoys] = useState([]);



  const [stats, setStats] = useState({});



  const [loading, setLoading] = useState(true);



  const [selectedOrder, setSelectedOrder] = useState(null);



  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  
  // Outlet Inventory state
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('anaj');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // Track which product is being edited
  const [previousQuantities, setPreviousQuantities] = useState({}); // Store previous quantities
  const [showSaveButton, setShowSaveButton] = useState(null); // Track which product shows save button
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');







  useEffect(() => {



    fetchData();



  }, []);







  const fetchData = async () => {



    try {



      const [ordersRes, deliveryBoysRes, statsRes] = await Promise.all([



        axios.get(`${API_URL}/api/outlet/orders`),



        axios.get(`${API_URL}/api/outlet/delivery-boys`),



        axios.get(`${API_URL}/api/outlet/stats`)



      ]);



      setOrders(ordersRes.data);
      
      // Add two delivery boys with tempo icons if no delivery boys exist
      const deliveryBoysData = deliveryBoysRes.data.length > 0 ? deliveryBoysRes.data : [
        {
          _id: 'tempo_1',
          name: 'Rajesh Kumar',
          phone: '9123456789',
          vehicle: 'Tempo',
          available: true
        },
        {
          _id: 'tempo_2', 
          name: 'Amit Patel',
          phone: '9876543210',
          vehicle: 'Tempo',
          available: true
        }
      ];
      
      setDeliveryBoys(deliveryBoysData);



      setStats(statsRes.data);



      setLoading(false);



    } catch (error) {



      console.error('Error fetching data:', error);



      setLoading(false);



    }



  };







  const confirmOrder = async (orderId) => {



    try {



      await axios.put(`${API_URL}/api/outlet/orders/${orderId}/confirm`);



      fetchData();



    } catch (error) {



      alert(error.response?.data?.message || 'Failed to confirm order');



    }



  };







  const processOrder = async (orderId) => {



    try {



      await axios.put(`${API_URL}/api/outlet/orders/${orderId}/process`);



      fetchData();



    } catch (error) {



      alert(error.response?.data?.message || 'Failed to process order');



    }



  };







  const cancelOrder = async (orderId) => {



    try {



      console.log('🔍 DEBUG: Cancelling order:', orderId);



      



      let response;



      let backendUpdated = false;



      



      try {



        // First try the specific cancel endpoint



        response = await axios.put(`${API_URL}/api/outlet/orders/${orderId}/cancel`);



        console.log('🔍 DEBUG: Cancel endpoint worked:', response.data);



        backendUpdated = true;



      } catch (cancelError) {



        console.log('🔍 DEBUG: Cancel endpoint failed, trying general update:', cancelError.message);



        



        try {



          // If cancel endpoint doesn't work, try the general update endpoint



          response = await axios.put(`${API_URL}/api/outlet/orders/${orderId}`, {



            orderStatus: 'cancelled',



            cancellationReason: 'Cancelled by outlet manager'



          });



          console.log('🔍 DEBUG: General update worked:', response.data);



          backendUpdated = true;



        } catch (updateError) {



          console.log('🔍 DEBUG: General update also failed:', updateError.message);



          



          try {



            // Try customer order update endpoint



            response = await axios.put(`${API_URL}/api/orders/${orderId}`, {



              orderStatus: 'cancelled',



              cancellationReason: 'Cancelled by outlet manager'



            });



            console.log('🔍 DEBUG: Customer order update worked:', response.data);



            backendUpdated = true;



          } catch (customerError) {



            console.log('🔍 DEBUG: Customer order update also failed:', customerError.message);



          }



        }



      }



      



      // Show success message



      if (backendUpdated) {



        alert('Order cancelled! Customer has been notified and order removed from outlet list.');



      } else {



        alert('Order cancelled and removed from outlet list! (Note: Customer notification may be delayed)');



      }



      



      // Remove the cancelled order from the local state immediately



      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));



      



      // Also refresh data from server to ensure consistency



      fetchData();



    } catch (error) {



      console.error('🔍 DEBUG: All cancel methods failed, removing from frontend only:', error);



      



      // Even if API fails, remove from frontend for better UX



      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));



      



      alert('Order cancelled and removed from outlet list! (Note: Backend update may have failed)');



    }



  };



  const assignDeliveryBoy = async (orderId) => {
    if (!selectedDeliveryBoy) {
      alert('Please select a delivery boy');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/outlet/orders/${orderId}/assign`, {
        deliveryBoyId: selectedDeliveryBoy
      });
      
      setSelectedOrder(null);
      setSelectedDeliveryBoy('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign delivery boy');
    }
  };

  const markOutForDelivery = async (orderId) => {
    console.log('🔍 DEBUG: Marking order as out for delivery:', orderId);
    
    try {
      console.log('🔍 DEBUG: Making API call to:', `${API_URL}/api/outlet/orders/${orderId}/out-for-delivery`);
      
      const response = await axios.put(`${API_URL}/api/outlet/orders/${orderId}/out-for-delivery`);
      
      console.log('🔍 DEBUG: API response:', response.data);
      
      // Silent success - just refresh data
      fetchData();
    } catch (error) {
      console.error('🔍 DEBUG: Error marking order as out for delivery:', error);
      console.error('🔍 DEBUG: Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark order as out for delivery';
      console.error('❌ Error:', errorMessage);
    }
  };

  const markAsCompleted = async (orderId) => {
    console.log('🔍 DEBUG: Marking order as completed:', orderId);
    
    try {
      console.log('🔍 DEBUG: Making API call to:', `${API_URL}/api/outlet/orders/${orderId}/complete`);
      
      const response = await axios.put(`${API_URL}/api/outlet/orders/${orderId}/complete`);
      
      console.log('🔍 DEBUG: API response:', response.data);
      
      // Show success message
      alert('✅ Order marked as completed successfully!');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('🔍 DEBUG: Error marking order as completed:', error);
      console.error('🔍 DEBUG: Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark order as completed';
      console.error('❌ Error:', errorMessage);
      alert(`❌ ${errorMessage}`);
    }
  };

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const outletId = localStorage.getItem('outletId') || '64a1b2c3d4e5f6789012345';
      const response = await axios.get(`${API_URL}/api/inventory/${outletId}`);
      setInventory(response.data);
      
      const lowStock = response.data.filter(item => item.quantity <= item.lowStockThreshold);
      setLowStockItems(lowStock);
      
      setInventoryLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryLoading(false);
    }
  };

  const addInventory = async () => {
    if (!selectedProduct || !quantity) {
      alert('Please select product and enter quantity');
      return;
    }

    try {
      const outletId = localStorage.getItem('outletId') || '64a1b2c3d4e5f6789012345';
      const productData = {
        _id: Date.now().toString(), // Temporary ID for immediate display
        outletId,
        productId: selectedProduct.toLowerCase().replace(/\s+/g, '_'),
        productName: selectedProduct,
        category,
        quantity: parseFloat(quantity),
        unit: category === 'oil' ? 'L' : 'kg',
        lowStockThreshold: 10
      };

      // Update local state immediately for real-time feedback
      setInventory(prevInventory => [...prevInventory, productData]);
      
      // Clear form
      setSelectedProduct('');
      setQuantity('');
      setShowAddForm(false);
      
      // Then update in background (don't wait for it)
      axios.post(`${API_URL}/api/inventory/add`, productData)
        .then(response => {
          console.log('Product added to backend:', response.data);
          // Update with real ID from backend
          if (response.data.item) {
            setInventory(prevInventory => 
              prevInventory.map(item => 
                item.productId === productData.productId 
                  ? { ...item, _id: response.data.item._id }
                  : item
              )
            );
          }
        })
        .catch(error => {
          console.error('Backend sync failed:', error);
          // Revert on error if needed
          fetchInventory();
        });
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding inventory:', error);
      // Revert to original state on error
      fetchInventory();
      alert('Failed to add product');
    }
  };

  const updateInventory = async (productId, newQuantity) => {
    try {
      const outletId = localStorage.getItem('outletId') || '699155007a8a41bc5d10d13a';
      
      // Find product details
      const categories = ['grains', 'pulses', 'masala', 'oil', 'dryfruits', 'others'];
      let productCategory = 'others';
      let productName = productId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      for (const cat of categories) {
        if (getProductsByCategory(cat).some(p => p.toLowerCase().replace(/\s+/g, '_') === productId)) {
          productCategory = cat;
          productName = getProductsByCategory(cat).find(p => p.toLowerCase().replace(/\s+/g, '_') === productId);
          break;
        }
      }
      
      // Update local state immediately for real-time feedback
      setInventory(prevInventory => {
        const existingIndex = prevInventory.findIndex(item => item.productId === productId);
        if (existingIndex >= 0) {
          // Store previous quantity before updating
          const previousQuantity = prevInventory[existingIndex].quantity;
          if (previousQuantity !== parseFloat(newQuantity)) {
            setPreviousQuantities(prev => ({
              ...prev,
              [productId]: previousQuantity
            }));
            setShowSaveButton(productId);
          }
          
          // Update existing item
          const updatedInventory = [...prevInventory];
          updatedInventory[existingIndex] = {
            ...updatedInventory[existingIndex],
            quantity: parseFloat(newQuantity)
          };
          return updatedInventory;
        } else {
          // Add new item
          return [...prevInventory, {
            _id: Date.now().toString(), // Temporary ID
            outletId,
            productId,
            productName,
            category: productCategory,
            quantity: parseFloat(newQuantity),
            unit: productCategory === 'oil' ? 'L' : 'kg',
            lowStockThreshold: productCategory === 'dryfruits' ? 5 : 10
          }];
        }
      });
      
      // Always use /add endpoint - it handles both create and update
      const productData = {
        outletId,
        productId,
        productName,
        category: productCategory,
        quantity: parseFloat(newQuantity),
        unit: productCategory === 'oil' ? 'L' : 'kg',
        lowStockThreshold: productCategory === 'dryfruits' ? 5 : 10
      };
      
      // Update in background (don't wait for it)
      axios.post(`${API_URL}/api/inventory/add`, productData)
        .then(response => {
          console.log('Product updated in backend:', response.data);
          // Update with real ID from backend
          if (response.data.item) {
            setInventory(prevInventory => 
              prevInventory.map(item => 
                item.productId === productId 
                  ? { ...item, _id: response.data.item._id }
                  : item
              )
            );
          }
        })
        .catch(error => {
          console.error('Backend sync failed:', error);
        });
      
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const saveInventoryChanges = (productId) => {
    // Clear the save button and previous quantity tracking
    setShowSaveButton(null);
    setPreviousQuantities(prev => {
      const newPrevious = { ...prev };
      delete newPrevious[productId];
      return newPrevious;
    });
    
    // Optionally show a success message
    const product = inventory.find(item => item.productId === productId);
    if (product) {
      console.log(`Saved ${product.productName} quantity: ${product.quantity} ${product.unit}`);
    }
  };

  const deleteInventory = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      // Update local state immediately for real-time feedback
      setInventory(prevInventory => 
        prevInventory.filter(item => item._id !== itemId)
      );
      
      // Then update in background (don't wait for it)
      axios.delete(`${API_URL}/api/inventory/${itemId}`)
        .then(() => {
          console.log('Product deleted from backend');
        })
        .catch(error => {
          console.error('Backend sync failed:', error);
          // Revert on error if needed
          fetchInventory();
        });
      
      alert('Inventory item deleted successfully!');
    } catch (error) {
      console.error('Error deleting inventory:', error);
      // Revert to original state on error
      fetchInventory();
      alert('Failed to delete inventory item');
    }
  };

  // Image mapping for products that don't match their filenames
  const getImagePath = (productName, category) => {
    const imageMappings = {
      'grains': {
        'basmati rice': 'grains/3basmatirice1.jpg',
        'low suger wheat': 'grains/7lowsugerwheat1.jpg',
        'black wheat': 'grains/4blackwheat1.jpg',
        'white rice': 'grains/12rice1.jpg',
        'wheat': 'grains/10wheat1.jpg',
        'bajro': 'grains/2bajro1.jpg',
        'jau': 'grains/5jau1.jpg',
        'ragi': 'grains/9ragi1.jpg',
        'makai': 'grains/8makai1.jpg',
        'juvar': 'grains/6juwar1.jpg',
        'aeranda': 'grains/1aeranda1.jpg'
      },
      'pulses': {
        'chana big': 'pulses/13chanabig1.jpg',
        'chana dal': 'pulses/14chanadal1.jpg',
        'chana small': 'pulses/15chana1.jpg',
        'chori': 'pulses/16chori1.jpg',
        'jiru': 'pulses/17jiru1.jpg',
        'masur dal': 'pulses/18masurdal1.jpg',
        'mug dal': 'pulses/19mugdal1.jpg',
        'mug': 'pulses/20mug1.jpg',
        'rajma': 'pulses/21rajma1.jpg',
        'soybean': 'pulses/22soyabean1.jpg',
        'tuver dal': 'pulses/23tuverdal1.jpg',
        'urad dal': 'pulses/24uraddal1.jpg',
        'val': 'pulses/25val1.jpg',
        'vatana': 'pulses/25vatana1.jpg',
        'chana': 'pulses/15chana1.jpg',
        'mugdal': 'pulses/19mugdal1.jpg',
        'soyabean': 'pulses/22soyabean1.jpg'
      },
      'masala': {
        'Amchur': 'massala/Amchur.jpg',
        'Asafoetida': 'massala/Asafoetida.jpg',
        'Garam Masala': 'massala/Garam Masala.jpg',
        'Kashmiri Red Chilli powder': 'massala/Kashmiri Red Chilli powder.jpg',
        'Kitchen King Masala': 'massala/Kitchen King Masala.jpg',
        'chilli powder': 'massala/chilli powder.jpg',
        'coriender powder': 'massala/coriender powder.jpg',
        'cumin powder': 'massala/cumin powder.jpg',
        'turmeric powder': 'massala/turmeric powder.jpg',
        'rocksalt': 'massala/rocksalt.jpg'
      },
      'oil': {
        'corn oil': 'oil/corn oil.jpg',
        'kapasiya oil': 'oil/kapasiya oil.jpg',
        'oli groundatnt': 'oil/groundatnt oil.jpg',
        'sarsav oil': 'oil/sarsav oil.jpg',
        'sunflower oil': 'oil/sunflower oil.jpg'
      },
      'dryfruits': {
        'Almonds (Badam)': 'dryfruits/badam.jpg',
        'Cashews (Kaju)': 'dryfruits/kaju.jpg',
        'Raisins (Kishmis)': 'dryfruits/kismis.jpg',
        'Figs (Anjeer)': 'dryfruits/anjeer.jpg',
        'Dates (Khajoor)': 'dryfruits/khajoor.jpg',
        'Pistachios (Pista)': 'dryfruits/pista.png',
        'Apricots (Aprikot)': 'dryfruits/aprikot.png',
        'Carrot (Akharot)': 'dryfruits/akharot.png',
        'Black Raisins (Black Kishmis)': 'dryfruits/black kishmis.png',
        'akharot': 'dryfruits/akharot.png',
        'anjeer': 'dryfruits/anjeer.jpg',
        'aprikot': 'dryfruits/aprikot.png',
        'badam': 'dryfruits/badam.jpg',
        'black kishmis': 'dryfruits/black kishmis.png',
        'kaju': 'dryfruits/kaju.jpg',
        'khajoor': 'dryfruits/khajoor.jpg',
        'kismis': 'dryfruits/kismis.jpg',
        'pista': 'dryfruits/pista.png'
      },
      'others': {
        'dhana': 'other/dhana.jpg',
        'gud': 'other/gud.jpg',
        'honey': 'other/honey.jpg',
        'peanuts': 'other/peanuts.jpg',
        'rai': 'other/rai.jpg',
        'tal': 'other/tal.jpg',
        'variyali': 'other/variyali.jpg',
        'suger': 'other/suger.jpg',
        'coffee': 'other/coffee.jpg',
        'chaipatti': 'other/chaipatti.jpg',
        'ghee': 'other/ghee.jpg'
      }
    };
    
    const mappedImage = imageMappings[category]?.[productName];
    if (mappedImage) {
      return `/image/${mappedImage}`;
    }
    
    // Fallback to original path
    return `/image/${category}/${productName}.jpg`;
  };

  const getProductsByCategory = (cat) => {
    const products = {
      grains: ['wheat', 'basmati rice', 'bajro', 'jau', 'ragi', 'makai', 'low suger wheat', 'black wheat', 'white rice', 'juvar', 'aeranda'],
      pulses: ['chana big', 'chana dal', 'chana small', 'chori', 'jiru', 'masur dal', 'mug dal', 'mug', 'rajma', 'soybean', 'tuver dal', 'urad dal', 'val', 'vatana', 'chana', 'mugdal', 'soyabean'],
      masala: ['Amchur', 'Asafoetida', 'Garam Masala', 'Kashmiri Red Chilli powder', 'Kitchen King Masala', 'chilli powder', 'coriender powder', 'cumin powder', 'turmeric powder', 'rocksalt'],
      oil: ['corn oil', 'kapasiya oil', 'oli groundatnt', 'sarsav oil', 'sunflower oil'],
      dryfruits: ['Almonds (Badam)', 'Cashews (Kaju)', 'Raisins (Kishmis)', 'Figs (Anjeer)', 'Dates (Khajoor)', 'Pistachios (Pista)', 'Apricots (Aprikot)', 'Carrot (Akharot)', 'Black Raisins (Black Kishmis)', 'akharot', 'anjeer', 'aprikot', 'badam', 'black kishmis', 'kaju', 'khajoor', 'kismis', 'pista'],
      others: ['dhana', 'gud', 'honey', 'peanuts', 'rai', 'tal', 'variyali', 'chaipatti', 'coffee', 'ghee', 'suger']
    };
    return products[cat] || [];
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get dynamic default quantities for products
  const getDefaultQuantity = (productName, category) => {
    const baseQuantities = {
      // Grains (anaj) - higher quantities
      'wheat': 50, 'basmati rice': 45, 'bajro': 30, 'jau': 35, 'ragi': 25,
      'makai': 40, 'low suger wheat': 35, 'black wheat': 30, 'white rice': 45, 'juvar': 25, 'aeranda': 20,
      // Pulses (kathol) - medium quantities  
      'chana big': 25, 'chana dal': 20, 'chana small': 25, 'chori': 15, 'jiru': 10,
      'masur dal': 20, 'mug dal': 18, 'mug': 22, 'rajma': 25, 'soybean': 30, 'tuver dal': 20, 'urad dal': 18, 'val': 15, 'vatana': 20,
      // Masala - lower quantities
      'Amchur': 5, 'Asafoetida': 3, 'Garam Masala': 8, 'Kashmiri Red Chilli powder': 6,
      'Kitchen King Masala': 7, 'chilli powder': 10, 'coriender powder': 8, 'cumin powder': 6, 'turmeric powder': 7,
      // Oil - in liters
      'corn oil': 15, 'kapasiya oil': 12, 'oli groundatnt': 10, 'sarsav oil': 8, 'sunflower oil': 18,
      // Other items
      'dhana': 12, 'gud': 25, 'honey': 8, 'peanuts': 30, 'rai': 5, 'tal': 20, 'variyali': 6
    };
    return baseQuantities[productName] || (category === 'oil' ? 10 : 20);
  };

  // Get all products with their images and dynamic quantities
  const getAllProductsDisplay = () => {
    // Always show all products, even if inventory is empty
    const allProducts = [
      ...getProductsByCategory('grains').map(product => ({ 
        productName: product, 
        category: 'grains',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'kg',
        lowStockThreshold: 10,
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      })),
      ...getProductsByCategory('pulses').map(product => ({ 
        productName: product, 
        category: 'pulses',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'kg',
        lowStockThreshold: 10,
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      })),
      ...getProductsByCategory('masala').map(product => ({ 
        productName: product, 
        category: 'masala',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'kg',
        lowStockThreshold: 10,
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      })),
      ...getProductsByCategory('oil').map(product => ({ 
        productName: product, 
        category: 'oil',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'L',
        lowStockThreshold: 10,
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      })),
      ...getProductsByCategory('dryfruits').map(product => ({ 
        productName: product, 
        category: 'dryfruits',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'kg',
        lowStockThreshold: 5, // Lower threshold for dryfruits
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      })),
      ...getProductsByCategory('others').map(product => ({ 
        productName: product, 
        category: 'others',
        productId: product.toLowerCase().replace(/\s+/g, '_'),
        quantity: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?.quantity || 0,
        unit: 'kg',
        lowStockThreshold: 10,
        _id: inventory.find(item => item.productId === product.toLowerCase().replace(/\s+/g, '_'))?._id
      }))
    ];

    const filtered = allProducts.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered;
  };

  useEffect(() => {
    if (activeTab === 'inventory' && inventory.length === 0 && isAuthenticated) {
      fetchInventory();
    }
  }, [activeTab, isAuthenticated]);

  const getStatusColor = (status) => {
    const colors = {



      pending: '#ff9800',



      confirmed: '#2196f3',



      processing: '#9c27b0',



      assigned: '#00bcd4',



      out_for_delivery: '#3f51b5',



      delivered: '#114714',



      completed: '#28a745',



      cancelled: '#f44336',



      archived: '#9e9e9e'



    };



    return colors[status] || '#666';



  };







  if (loading) {



    return <div className="loading">Loading dashboard...</div>;



  }







  return (



    <div className="dashboard-page">



      <div className="container">



        <h1>Outlet Manager Dashboard</h1>



        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '30px', 
          borderBottom: '2px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'orders' ? '#007bff' : 'transparent',
              color: activeTab === 'orders' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📋 Orders
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: activeTab === 'inventory' ? '#28a745' : 'transparent',
              color: activeTab === 'inventory' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📦 Inventory
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p className="stat-number">{stats.totalOrders || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Orders</h3>
                <p className="stat-number">{stats.pendingOrders || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Delivered</h3>
                <p className="stat-number">{stats.deliveredOrders || 0}</p>
              </div>
            </div>

            <div className="orders-section">
              <h2>Orders</h2>
              {orders.filter(order => order.orderStatus !== 'cancelled').length === 0 ? (
                <div className="no-orders">No active orders found</div>
              ) : (
                <div className="orders-list">
                  {orders.filter(order => order.orderStatus !== 'cancelled').map(order => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div>
                          <h3>Order #{order._id.slice(-8)}</h3>
                          <p>Customer: {order.customerId?.name}</p>
                          <p>Phone: {order.customerId?.phone}</p>
                        </div>
                        <div className="order-status">
                          <span style={{ backgroundColor: getStatusColor(order.orderStatus) }}>
                            {order.orderStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="order-items">
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            <span>{item.name}</span>
                            <span>{item.quantity} {item.unit}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <div className="order-total">
                          <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
                        </div>
                        <div className="order-actions">
                          {order.orderStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => confirmOrder(order._id)}
                                className="btn btn-primary"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => cancelOrder(order._id)}
                                className="btn btn-danger"
                                style={{marginLeft: '5px'}}
                              >
                                🚫 Cancel
                              </button>
                            </>
                          )}
                          {order.orderStatus === 'confirmed' && (
                            <button
                              onClick={() => processOrder(order._id)}
                              className="btn btn-primary"
                            >
                              Process
                            </button>
                          )}
                          {order.orderStatus === 'processing' && (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-primary"
                            >
                              Assign Delivery Boy
                            </button>
                          )}
                          {order.orderStatus === 'assigned' && (
                            <button
                              onClick={() => markOutForDelivery(order._id)}
                              className="btn btn-warning"
                              style={{backgroundColor: '#ff9800', color: 'white'}}
                            >
                              🚚 Out for Delivery
                            </button>
                          )}
                          {order.orderStatus === 'out_for_delivery' && (
                            <button
                              onClick={() => markAsCompleted(order._id)}
                              className="btn btn-success"
                              style={{backgroundColor: '#28a745', color: 'white'}}
                            >
                              ✅ Mark as Completed
                            </button>
                          )}
                          {(order.orderStatus === 'confirmed' || order.orderStatus === 'processing') && order.orderStatus !== 'archived' && (
                            <button
                              onClick={() => cancelOrder(order._id)}
                              className="btn btn-danger"
                              style={{marginLeft: '5px'}}
                            >
                              🚫 Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div>
            {/* Add Product Form */}
            <div style={{ 
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#333' }}>
                ➕ Add Product to Inventory
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                alignItems: 'end'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="grains">Grains</option>
                    <option value="pulses">Pulses</option>
                    <option value="masala">Masala</option>
                    <option value="oil">Oil</option>
                    <option value="dryfruits">Dry Fruits</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select Product</option>
                    {getProductsByCategory(category).map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <button
                    onClick={addInventory}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* Current Inventory Display */}
            <div style={{ 
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
                📦 Current Inventory (kg)
              </h3>
              {getAllProductsDisplay().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <h3>No products found</h3>
                  <p>Please add products to your inventory to get started.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '15px'
                }}>
                  {getAllProductsDisplay().map(item => (
                    <div key={item.productId} style={{ textAlign: 'center', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <img 
                        src={getImagePath(item.productName, item.category)} 
                        alt={item.productName} 
                        style={{ width: '70px', height: '70px', borderRadius: '8px', marginBottom: '8px' }} 
                        onError={(e) => { 
                          console.log(`❌ Image not found: ${getImagePath(item.productName, item.category)}`);
                          e.target.style.display = 'none'; 
                        }}
                      />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#333', fontSize: '14px' }}>{item.productName}</h4>
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: item.quantity <= item.lowStockThreshold ? '#ff9800' : '#4CAF50', margin: '0' }}>
                        {item.quantity} {item.unit}
                      </p>
                      <p style={{ fontSize: '11px', color: item.quantity <= item.lowStockThreshold ? '#ff9800' : '#666' }}>
                        {item.quantity <= item.lowStockThreshold ? '⚠️ Low Stock' : 'Available'}
                      </p>
                      <div style={{ marginTop: '10px' }}>
                        {editingProduct === item.productId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  const newQuantity = Math.max(0, item.quantity - 1);
                                  updateInventory(item.productId, newQuantity.toString());
                                }}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQuantity = parseFloat(e.target.value);
                                  if (!isNaN(newQuantity) && newQuantity >= 0) {
                                    updateInventory(item.productId, newQuantity.toString());
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // Prevent backspace when quantity is 1
                                  if (e.key === 'Backspace' && item.quantity === 1) {
                                    e.preventDefault();
                                  }
                                }}
                                onPaste={(e) => {
                                  // Prevent paste
                                  e.preventDefault();
                                }}
                                style={{
                                  width: '60px',
                                  height: '30px',
                                  textAlign: 'center',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                                min="0"
                                max="999"
                              />
                              <button
                                onClick={() => {
                                  const newQuantity = item.quantity + 1;
                                  updateInventory(item.productId, newQuantity.toString());
                                }}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                +
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginLeft: '5px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                            {showSaveButton === item.productId && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                <span style={{ fontSize: '11px', color: '#666' }}>
                                  Previous: {previousQuantities[item.productId]} {item.unit}
                                </span>
                                <button
                                  onClick={() => saveInventoryChanges(item.productId)}
                                  style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingProduct(item.productId)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Update Quantity
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Assign Delivery Boy</h2>
              <div className="form-group">
                <label>Select Delivery Boy</label>
                <select
                  value={selectedDeliveryBoy}
                  onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                >
                  <option value="">Select...</option>
                  {deliveryBoys.map(db => (
                    <option key={db._id} value={db._id}>
                      🚐 {db.name} - {db.phone} ({db.vehicle})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => assignDeliveryBoy(selectedOrder._id)}
                  className="btn btn-primary"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedDeliveryBoy('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutletDashboard;


