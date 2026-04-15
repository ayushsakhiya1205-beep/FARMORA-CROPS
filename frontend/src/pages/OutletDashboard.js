import React, { useEffect, useState, useContext } from 'react';

import axios from 'axios';

import { API_URL } from '../config';

import AuthContext from '../context/AuthContext';

import './Dashboard.css';

const normalizeProductName = (value = '') => value.toString().trim().toLowerCase();

const LOCAL_PRODUCT_CATALOG = [
  { productName: 'wheat', category: 'grains', image: '/image/grains/10wheat1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'basmati rice', category: 'grains', image: '/image/grains/3basmatirice1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'white rice', category: 'grains', image: '/image/grains/12rice1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'black wheat', category: 'grains', image: '/image/grains/4blackwheat1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'bajro', category: 'grains', image: '/image/grains/2bajro1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'jau', category: 'grains', image: '/image/grains/5jau1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'ragi', category: 'grains', image: '/image/grains/9ragi1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'makai', category: 'grains', image: '/image/grains/8makai1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'juvar', category: 'grains', image: '/image/grains/6juwar1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'aeranda', category: 'grains', image: '/image/grains/1aeranda1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'low suger wheat', category: 'grains', image: '/image/grains/7lowsugerwheat1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'chana big', category: 'pulses', image: '/image/pulses/13chanabig1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'chana dal', category: 'pulses', image: '/image/pulses/14chanadal1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'chana small', category: 'pulses', image: '/image/pulses/15chana1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'masur dal', category: 'pulses', image: '/image/pulses/18masurdal1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'mug dal', category: 'pulses', image: '/image/pulses/19mugdal1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'mug', category: 'pulses', image: '/image/pulses/20mug1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'rajma', category: 'pulses', image: '/image/pulses/21rajma1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'soyabean', category: 'pulses', image: '/image/pulses/22soyabean1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'tuver dal', category: 'pulses', image: '/image/pulses/23tuverdal1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'urad dal', category: 'pulses', image: '/image/pulses/24uraddal1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'vatana', category: 'pulses', image: '/image/pulses/25vatana1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'val', category: 'pulses', image: '/image/pulses/25vatana1.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'Amchur', category: 'masala', image: '/image/massala/Amchur.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'Asafoetida', category: 'masala', image: '/image/massala/Asafoetida.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'Garam Masala', category: 'masala', image: '/image/massala/Garam Masala.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'Kashmiri Red Chilli powder', category: 'masala', image: '/image/massala/Kashmiri Red Chilli powder.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'Kitchen King Masala', category: 'masala', image: '/image/massala/Kitchen King Masala.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'chilli powder', category: 'masala', image: '/image/massala/chilli powder.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'coriender powder', category: 'masala', image: '/image/massala/coriender powder.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'cumin powder', category: 'masala', image: '/image/massala/cumin powder.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'turmeric powder', category: 'masala', image: '/image/massala/turmeric powder.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'rocksalt', category: 'masala', image: '/image/massala/rocksalt.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'corn oil', category: 'oil', image: '/image/oil/corn oil.jpg', unit: 'L', lowStockThreshold: 8 },
  { productName: 'kapasiya oil', category: 'oil', image: '/image/oil/kapasiya oil.jpg', unit: 'L', lowStockThreshold: 8 },
  { productName: 'oli groundatnt', category: 'oil', image: '/image/oil/groundatnt oil.jpg', unit: 'L', lowStockThreshold: 8 },
  { productName: 'sarsav oil', category: 'oil', image: '/image/oil/sarsav oil.jpg', unit: 'L', lowStockThreshold: 8 },
  { productName: 'sunflower oil', category: 'oil', image: '/image/oil/sunflower oil.jpg', unit: 'L', lowStockThreshold: 8 },
  { productName: 'akharot', category: 'dryfruits', image: '/image/dryfruits/akharot.png', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'anjeer', category: 'dryfruits', image: '/image/dryfruits/anjeer.jpg', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'aprikot', category: 'dryfruits', image: '/image/dryfruits/aprikot.png', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'badam', category: 'dryfruits', image: '/image/dryfruits/badam.jpg', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'black kishmis', category: 'dryfruits', image: '/image/dryfruits/black kishmis.png', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'kaju', category: 'dryfruits', image: '/image/dryfruits/kaju.jpg', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'khajoor', category: 'dryfruits', image: '/image/dryfruits/khajoor.jpg', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'kismis', category: 'dryfruits', image: '/image/dryfruits/kismis.jpg', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'pista', category: 'dryfruits', image: '/image/dryfruits/pista.png', unit: 'kg', lowStockThreshold: 5 },
  { productName: 'dhana', category: 'others', image: '/image/other/dhana.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'gud', category: 'others', image: '/image/other/gud.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'honey', category: 'others', image: '/image/other/honey.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'peanuts', category: 'others', image: '/image/other/peanuts.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'rai', category: 'others', image: '/image/other/rai.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'tal', category: 'others', image: '/image/other/tal.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'variyali', category: 'others', image: '/image/other/variyali.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'suger', category: 'others', image: '/image/other/suger.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'coffee', category: 'others', image: '/image/other/coffee.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'chaipatti', category: 'others', image: '/image/other/chaipatti.jpg', unit: 'kg', lowStockThreshold: 10 },
  { productName: 'ghee', category: 'others', image: '/image/other/ghee.jpg', unit: 'kg', lowStockThreshold: 10 }
].map((item) => ({
  ...item,
  productId: `local_${item.category}_${normalizeProductName(item.productName).replace(/\s+/g, '_')}`
}));







const OutletDashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const outletId = user?._id || user?.id || localStorage.getItem('outletId');

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
  const [lowStockItems, setLowStockItems] = useState([]);
  const [previousQuantities, setPreviousQuantities] = useState({}); // Store previous quantities
  const [showSaveButton, setShowSaveButton] = useState(null); // Track which product shows save button
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'in_stock'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc', 'name_desc', 'qty_asc', 'qty_desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table'







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
      setDeliveryBoys(deliveryBoysRes.data);
      setStats(statsRes.data);



      setLoading(false);



    } catch (error) {



      console.error('Error fetching data:', error);



      setLoading(false);



    }



  };







  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this completed order? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/api/outlet/orders/${orderId}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete order');
      }
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
      let inventoryData = [];
      let productsData = [];

      try {
        const productsResponse = await axios.get(`${API_URL}/api/products`);
        productsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      } catch (productError) {
        console.error('Product catalog fetch failed, using local catalog only:', productError);
      }

      if (outletId) {
        try {
          const response = await axios.get(`${API_URL}/api/inventory/catalog/${outletId}`);
          inventoryData = Array.isArray(response.data) ? response.data : [];
        } catch (inventoryError) {
          console.error('Inventory catalog fetch failed, using fallback catalog:', inventoryError);
        }
      }

      const dynamicCatalog = productsData.map((product) => ({
        _id: null,
        outletId: outletId || null,
        productId: product._id,
        productName: product.name,
        category: product.category,
        quantity: 0,
        unit: product.unit || 'kg',
        lowStockThreshold: product.category === 'dryfruits' ? 5 : product.category === 'oil' ? 8 : 10,
        image: product.image ? `/image/${product.image}` : '',
        lastUpdated: null,
        updatedBy: null
      }));

      const baseCatalog = dynamicCatalog.length > 0 ? dynamicCatalog : LOCAL_PRODUCT_CATALOG;
      const mergedInventory = baseCatalog.map((catalogItem) => {
        const matchedInventory = inventoryData.find((inventoryItem) =>
          inventoryItem.productId?.toString() === catalogItem.productId?.toString() ||
          normalizeProductName(inventoryItem.productName) === normalizeProductName(catalogItem.productName)
        );

        return {
          ...catalogItem,
          ...matchedInventory,
          outletId: outletId || matchedInventory?.outletId || null,
          productId: matchedInventory?.productId?.toString() || catalogItem.productId,
          productName: matchedInventory?.productName || catalogItem.productName,
          category: matchedInventory?.category || catalogItem.category,
          quantity: matchedInventory?.quantity ?? 0,
          unit: matchedInventory?.unit || catalogItem.unit,
          lowStockThreshold: matchedInventory?.lowStockThreshold || catalogItem.lowStockThreshold,
          image: matchedInventory?.image || catalogItem.image
        };
      });

      inventoryData = mergedInventory;

      setInventory(inventoryData);
      
      const lowStock = inventoryData.filter(item => item.quantity <= item.lowStockThreshold);
      setLowStockItems(lowStock);
      
      setInventoryLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryLoading(false);
    }
  };

  const updateInventory = async (inventoryItem, newQuantity) => {
    try {
      if (!outletId) {
        alert('Outlet not identified. Please login again.');
        return;
      }

      const parsedQuantity = Math.max(0, Number(newQuantity));
      const previousQuantity = inventoryItem.quantity;

      setInventory((prevInventory) =>
        prevInventory.map((item) =>
          item.productId === inventoryItem.productId
            ? { ...item, quantity: parsedQuantity }
            : item
        )
      );

      const response = await axios.post(`${API_URL}/api/inventory/set`, {
        outletId,
        productId: inventoryItem.productId,
        productName: inventoryItem.productName,
        category: inventoryItem.category,
        quantity: parsedQuantity,
        unit: inventoryItem.unit,
        lowStockThreshold: inventoryItem.lowStockThreshold
      });

      if (response.data?.item) {
        setInventory((prevInventory) =>
          prevInventory.map((item) =>
            item.productId === inventoryItem.productId
              ? { ...item, ...response.data.item, productId: response.data.item.productId.toString() }
              : item
          )
        );
      }

      setPreviousQuantities((prev) => ({
        ...prev,
        [inventoryItem.productId]: previousQuantity
      }));
      setShowSaveButton(inventoryItem.productId);
    } catch (error) {
      console.error('Error updating inventory:', error);
      fetchInventory();
      alert(error.response?.data?.message || 'Failed to update inventory');
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
    
    if (productName?.startsWith('/image/')) {
      return productName;
    }

    const mappedImage = imageMappings[category]?.[productName];
    if (mappedImage) {
      return `/image/${mappedImage}`;
    }
    
    // Fallback to original path
    return `/image/${category}/${productName}.jpg`;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = item.quantity <= item.lowStockThreshold;
    } else if (stockFilter === 'in_stock') {
      matchesStock = item.quantity > item.lowStockThreshold;
    }

    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return a.productName.localeCompare(b.productName);
    if (sortBy === 'name_desc') return b.productName.localeCompare(a.productName);
    if (sortBy === 'qty_asc') return a.quantity - b.quantity;
    if (sortBy === 'qty_desc') return b.quantity - a.quantity;
    return 0;
  });

  useEffect(() => {
    if (activeTab === 'inventory' && inventory.length === 0 && isAuthenticated && outletId) {
      fetchInventory();
    }
  }, [activeTab, isAuthenticated, outletId]);

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

  const activeOrders = orders.filter(order => !['cancelled', 'archived'].includes(order.orderStatus));
  const inventoryItems = filteredInventory;
  const inventoryReadyCount = inventory.filter(item => item.quantity > item.lowStockThreshold).length;
  
  // Calculate extended stats
  const completedOrdersList = orders.filter(o => ['delivered', 'completed', 'archived'].includes(o.orderStatus));
  const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
  const completedCount = completedOrdersList.length;
  const cancelledCount = orders.filter(o => o.orderStatus === 'cancelled').length;
  const totalRevenue = completedOrdersList.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCompletedOrders = completedOrdersList.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayCompletedOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  
  const aov = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  
  const busyDeliveryBoyIds = new Set(
    activeOrders
      .filter(o => ['assigned', 'out_for_delivery'].includes(o.orderStatus))
      .map(o => (typeof o.deliveryBoyId === 'object' ? o.deliveryBoyId?._id : o.deliveryBoyId)?.toString())
      .filter(Boolean)
  );

  const mappedDeliveryBoys = deliveryBoys.map(db => ({
    ...db,
    available: !busyDeliveryBoyIds.has(db._id?.toString())
  }));

  const freeDeliveryBoysCount = mappedDeliveryBoys.filter(db => db.available).length;
  const totalDeliveryPartnersCount = mappedDeliveryBoys.length;

  const quickStats = [
    {
      label: 'Revenue',
      value: `Rs. ${(stats.revenue || totalRevenue).toLocaleString()}`,
      note: 'From completed orders',
      highlight: true
    },
    {
      label: "Today's Revenue",
      value: `Rs. ${todayRevenue.toLocaleString()}`,
      note: 'Income from today',
      highlight: true
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders || orders.length,
      note: 'All requests handled'
    },
    {
      label: 'AOV',
      value: `Rs. ${aov.toLocaleString()}`,
      note: 'Average order value'
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders || pendingCount,
      note: 'Waiting for action',
      warning: true
    },
    {
      label: 'Completed Orders',
      value: stats.deliveredOrders || completedCount,
      note: 'Successfully delivered'
    },
    {
      label: 'Canceled Orders',
      value: cancelledCount,
      note: 'Declined or aborted',
      danger: true
    },
    {
      label: 'Free Delivery Boys',
      value: `${freeDeliveryBoysCount} / ${totalDeliveryPartnersCount}`,
      note: 'Available for assigning'
    }
  ];







  if (loading) {



    return <div className="loading">Loading dashboard...</div>;



  }







  return (
    <div className="dashboard-page">
      <div className="container">
        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <span className="dashboard-kicker">Outlet control center</span>
            <h1>Outlet Manager Dashboard</h1>
            <p>
              Track orders, assign deliveries, and keep inventory healthy from one
              faster workspace.
            </p>
          </div>
          <div className="dashboard-hero-aside">
            <div className="hero-chip">
              <span>Active orders</span>
              <strong>{activeOrders.length}</strong>
            </div>
            <div className="hero-chip">
              <span>Low stock alerts</span>
              <strong>{lowStockItems.length}</strong>
            </div>
            <div className="hero-chip">
              <span>Inventory ready</span>
              <strong>{inventoryReadyCount}</strong>
            </div>
          </div>
        </section>

        <div className="dashboard-tabs">
          <button
            onClick={() => setActiveTab('orders')}
            className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`dashboard-tab ${activeTab === 'inventory' ? 'active inventory-tab-active' : ''}`}
          >
            Inventory
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="dashboard-panel">
            <div className="stats-grid">
              {quickStats.map((item) => (
                <div key={item.label} className={`stat-card ${item.highlight ? 'stat-highlight' : ''} ${item.warning ? 'stat-warning' : ''} ${item.danger ? 'stat-danger' : ''}`}>
                  <h3>{item.label}</h3>
                  <p className="stat-number">{item.value}</p>
                  <span className="stat-note">{item.note}</span>
                </div>
              ))}
            </div>

            <div className="orders-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Live operations</span>
                  <h2>Orders queue</h2>
                </div>
                <p>{activeOrders.length} active orders currently need monitoring.</p>
              </div>

              {activeOrders.length === 0 ? (
                <div className="no-orders">
                  <h3>No active orders found</h3>
                  <p>New requests will show up here as soon as customers place them.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {activeOrders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <div>
                          <h3>Order #{order._id.slice(-8)}</h3>
                          <p>Customer: {order.customerId?.name || 'N/A'}</p>
                          <p>Phone: {order.customerId?.phone || 'N/A'}</p>
                        </div>
                        <div className="order-status">
                          <span style={{ backgroundColor: getStatusColor(order.orderStatus) }}>
                            {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="order-meta-grid">
                        <div className="order-meta-card">
                          <span>Items</span>
                          <strong>{order.items?.length || 0}</strong>
                        </div>
                        <div className="order-meta-card">
                          <span>Payment</span>
                          <strong>{order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A'}</strong>
                        </div>
                        <div className="order-meta-card">
                          <span>Amount</span>
                          <strong>Rs. {order.totalAmount.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="order-items">
                        {order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            <span>{item.name}</span>
                            <span>{item.quantity} {item.unit}</span>
                            <span>Rs. {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer">
                        <div className="order-total">
                          <strong>Total: Rs. {order.totalAmount.toFixed(2)}</strong>
                        </div>
                        <div className="order-actions">
                          {order.orderStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => confirmOrder(order._id)}
                                className="dashboard-action primary"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => cancelOrder(order._id)}
                                className="dashboard-action danger"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.orderStatus === 'confirmed' && (
                            <>
                              <button
                                onClick={() => processOrder(order._id)}
                                className="dashboard-action primary"
                              >
                                Process
                              </button>
                              <button
                                onClick={() => cancelOrder(order._id)}
                                className="dashboard-action danger"
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {order.orderStatus === 'processing' && (
                            <>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="dashboard-action primary"
                              >
                                Assign Delivery Boy
                              </button>
                              <button
                                onClick={() => cancelOrder(order._id)}
                                className="dashboard-action danger"
                              >
                                Cancel Order
                              </button>
                            </>
                          )}
                          {order.orderStatus === 'assigned' && (
                            <button
                              onClick={() => markOutForDelivery(order._id)}
                              className="dashboard-action warning"
                            >
                              Out for Delivery
                            </button>
                          )}
                          {order.orderStatus === 'out_for_delivery' && (
                            <button
                              onClick={() => markAsCompleted(order._id)}
                              className="dashboard-action success"
                            >
                              Mark as Completed
                            </button>
                          )}
                          {['delivered', 'completed'].includes(order.orderStatus) && (
                            <button
                              onClick={() => deleteOrder(order._id)}
                              className="dashboard-action danger"
                            >
                              Delete Order
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

        {activeTab === 'inventory' && (
          <div className="dashboard-panel">
            <div className="inventory-overview-grid">
              <div className="inventory-summary-card">
                <span>Total listed products</span>
                <strong>{inventory.length}</strong>
                <p>Every category shown in one place for faster restocking.</p>
              </div>
              <div className="inventory-summary-card warning">
                <span>Low stock items</span>
                <strong>{lowStockItems.length}</strong>
                <p>Products at or below threshold that need attention.</p>
              </div>
              <div className="inventory-summary-card success">
                <span>Well stocked</span>
                <strong>{inventoryReadyCount}</strong>
                <p>Products currently above their safety threshold.</p>
              </div>
            </div>

            <div className="inventory-list-card">
              <div className="section-heading inventory-heading">
                <div>
                  <span className="section-kicker">Stock visibility</span>
                  <h2>Current Inventory</h2>
                </div>
              </div>

              <div className="inventory-toolbar">
                <div className="toolbar-left">
                  <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="toolbar-input search-input"
                    />
                  </div>
                </div>

                <div className="toolbar-filters">
                  <div className="filter-group">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="toolbar-select"
                    >
                      <option value="all">Categories: All</option>
                      <option value="grains">Grains</option>
                      <option value="pulses">Pulses</option>
                      <option value="masala">Masala</option>
                      <option value="oil">Oil</option>
                      <option value="dryfruits">Dry Fruits</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="toolbar-select"
                    >
                      <option value="all">Stock: All</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low">Low Stock</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="toolbar-select"
                    >
                      <option value="name_asc">Sort: A-Z</option>
                      <option value="name_desc">Sort: Z-A</option>
                      <option value="qty_asc">Qty: Low-High</option>
                      <option value="qty_desc">Qty: High-Low</option>
                    </select>
                  </div>
                </div>

                <div className="toolbar-right">
                  <div className="view-toggle">
                    <button 
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <span>Grid</span>
                    </button>
                    <button 
                      className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="List View"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </div>

              {inventoryLoading ? (
                <div className="no-orders">
                  <h3>Loading inventory...</h3>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="no-orders">
                  <h3>No products found</h3>
                  <p>Products matching your filters will appear here.</p>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="inventory-grid">
                      {inventoryItems.map((item) => (
                        <div key={item.productId} className="inventory-card">
                          <div className="inventory-card-top">
                            <img
                              src={item.image || getImagePath(item.productName, item.category)}
                              alt={item.productName}
                              className="inventory-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <span className={`stock-badge ${item.quantity <= item.lowStockThreshold ? 'low' : 'ok'}`}>
                              {item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'Available'}
                            </span>
                          </div>

                          <h4>{item.productName}</h4>
                          <p className="inventory-category-label">{item.category}</p>
                          <p className={`inventory-quantity ${item.quantity <= item.lowStockThreshold ? 'low' : ''}`}>
                            {item.quantity} {item.unit}
                          </p>

                          <div className="inventory-card-actions">
                            <div className="inventory-editor always-open">
                              <div className="inventory-stepper">
                                <button
                                  onClick={() => updateInventory(item, item.quantity - 1)}
                                  className="stepper-btn danger"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const nextQuantity = Number(e.target.value);
                                    if (!Number.isNaN(nextQuantity) && nextQuantity >= 0) {
                                      updateInventory(item, nextQuantity);
                                    }
                                  }}
                                  className="stepper-input"
                                  min="0"
                                  max="999"
                                />
                                <button
                                  onClick={() => updateInventory(item, item.quantity + 1)}
                                  className="stepper-btn success"
                                >
                                  +
                                </button>
                              </div>
                              {showSaveButton === item.productId && (
                                <div className="save-row">
                                  <span>
                                    Previous: {previousQuantities[item.productId]} {item.unit}
                                  </span>
                                  <button
                                    onClick={() => saveInventoryChanges(item.productId)}
                                    className="dashboard-action success small"
                                  >
                                    Done
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inventory-table-container">
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Quantity</th>
                            <th>Update Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item) => (
                            <tr key={item.productId} className={item.quantity <= item.lowStockThreshold ? 'low-stock-row' : ''}>
                              <td>
                                <div className="table-product-info">
                                  <img 
                                    src={item.image || getImagePath(item.productName, item.category)} 
                                    alt={item.productName} 
                                    className="table-image"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  <span className="table-product-name">{item.productName}</span>
                                </div>
                              </td>
                              <td className="table-category">{item.category}</td>
                              <td>
                                <span className={`stock-badge ${item.quantity <= item.lowStockThreshold ? 'low' : 'ok'}`}>
                                  {item.quantity <= item.lowStockThreshold ? 'Low Stock' : 'Available'}
                                </span>
                              </td>
                              <td>
                                <span className={`table-quantity ${item.quantity <= item.lowStockThreshold ? 'low' : ''}`}>
                                  <strong>{item.quantity}</strong> <small>{item.unit}</small>
                                </span>
                              </td>
                              <td>
                                <div className="inventory-editor always-open table-editor">
                                  <div className="inventory-stepper">
                                    <button
                                      onClick={() => updateInventory(item, item.quantity - 1)}
                                      className="stepper-btn danger"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const nextQuantity = Number(e.target.value);
                                        if (!Number.isNaN(nextQuantity) && nextQuantity >= 0) {
                                          updateInventory(item, nextQuantity);
                                        }
                                      }}
                                      className="stepper-input"
                                      min="0"
                                      max="999"
                                    />
                                    <button
                                      onClick={() => updateInventory(item, item.quantity + 1)}
                                      className="stepper-btn success"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {showSaveButton === item.productId && (
                                    <button
                                      onClick={() => saveInventoryChanges(item.productId)}
                                      className="dashboard-action success small"
                                    >
                                      Done
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Assign Delivery Boy</h2>
              <p style={{ color: 'var(--dashboard-muted)', marginBottom: '20px', fontSize: '14px' }}>
                Select an available delivery partner to fulfil order #{selectedOrder._id.slice(-8)}.
              </p>
              
              <div className="delivery-boy-selection-grid">
                {mappedDeliveryBoys.map((db) => (
                  <div 
                    key={db._id} 
                    className={`delivery-boy-card ${selectedDeliveryBoy === db._id ? 'selected' : ''}`}
                    onClick={() => {
                      if(db.available) setSelectedDeliveryBoy(db._id);
                    }}
                    style={{ opacity: db.available ? 1 : 0.6, cursor: db.available ? 'pointer' : 'not-allowed' }}
                  >
                    <div className="db-icon">
                      {db.vehicle === 'Bike' && '🏍️'}
                      {db.vehicle === 'Scooter' && '🛵'}
                      {db.vehicle === 'Tempo' && '🛺'}
                      {db.vehicle === 'Truck' && '🚚'}
                      {db.vehicle === 'Van' && '🚐'}
                      {!['Bike','Scooter','Tempo','Truck','Van'].includes(db.vehicle) && '🚲'}
                    </div>
                    <div className="db-details">
                      <h4>{db.name}</h4>
                      <span className="db-phone">{db.phone}</span>
                      <span className="db-vehicle-badge">{db.vehicle || 'Default'}</span>
                    </div>
                    <div className={`db-status-dot ${db.available !== false ? 'online' : 'busy'}`}></div>
                  </div>
                ))}
                {mappedDeliveryBoys.length === 0 && (
                  <div className="no-delivery-boys">
                    <p>No delivery partners available. Check active roster.</p>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button
                  onClick={() => assignDeliveryBoy(selectedOrder._id)}
                  className="dashboard-action primary"
                  disabled={!selectedDeliveryBoy}
                >
                  Assign Delivery
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedDeliveryBoy('');
                  }}
                  className="dashboard-action secondary"
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


