import React, { createContext, useState, useEffect } from 'react';

import axios from 'axios';

import { API_URL } from '../config';



const AuthContext = createContext();



export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [userType, setUserType] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(localStorage.getItem('token'));



  // Initialize auth state from localStorage on mount

  useEffect(() => {

    const initializeAuth = async () => {

      const storedToken = localStorage.getItem('token');

      const storedUserType = localStorage.getItem('userType');

      const storedUser = localStorage.getItem('user');



      if (storedToken && storedUserType && storedUser) {

        try {

          // Set token in axios headers

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          setToken(storedToken);

          setUserType(storedUserType);

          setUser(JSON.parse(storedUser));

          setIsAuthenticated(true);

          console.log(' Auth state initialized from localStorage');

          console.log('User:', JSON.parse(storedUser));

          console.log('UserType:', storedUserType);

          

          // Verify token is still valid by fetching current user

          await fetchUser();

        } catch (error) {

          console.error('Token validation failed:', error);

          // Clear invalid token

          clearAuthState();

        }

      }

      setLoading(false);

    };



    initializeAuth();

  }, []);

  // Listen for localStorage changes (cross-tab sync)

  useEffect(() => {

    const handleStorageChange = (e) => {

      if (e.key === 'token' || e.key === 'user' || e.key === 'userType') {

        console.log(' Storage changed, refreshing auth state...');

        const storedToken = localStorage.getItem('token');

        const storedUserType = localStorage.getItem('userType');

        const storedUser = localStorage.getItem('user');



        if (storedToken && storedUserType && storedUser) {

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

          setToken(storedToken);

          setUserType(storedUserType);

          setUser(JSON.parse(storedUser));

          setIsAuthenticated(true);

        } else {

          clearAuthState();

        }

      }

    };



    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);




  const refreshAuthState = () => {
    const storedToken = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUserType && storedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      setUserType(storedUserType);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      
      console.log('✅ Auth state refreshed manually');
      return true;
    }
    return false;
  };

  const clearAuthState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('outletId');
    setToken(null);
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };



  const fetchUser = async () => {

    try {

      const res = await axios.get(`${API_URL}/api/auth/me`, {

        withCredentials: true

      });

      

      if (res.data.success) {

        setUser(res.data.user);

        setUserType(res.data.userType);

        setIsAuthenticated(true);

        

        // Update localStorage

        localStorage.setItem('user', JSON.stringify(res.data.user));

        localStorage.setItem('userType', res.data.userType);

        if (res.data.userType === 'outlet' && (res.data.user._id || res.data.user.id)) {
          localStorage.setItem('outletId', res.data.user._id || res.data.user.id);
        }

      }

    } catch (error) {

      console.error('Fetch user error:', error);

      clearAuthState();

    }

  };



  const login = async (email, password, otp = null) => {

    try {

      const endpoint = otp ? `${API_URL}/api/auth/verify-otp` : `${API_URL}/api/auth/login`;

      const payload = otp ? { email, password, otp } : { email, password };

      

      const res = await axios.post(endpoint, payload, {

        withCredentials: true

      });

      

      if (res.data.success) {

        // If OTP is required, return special response

        if (res.data.requiresOtp) {

          return { success: true, requiresOtp: true };

        }

        

        const { token: newToken, user: userData, userType: newUserType } = res.data;

        

        // Store in localStorage

        localStorage.setItem('token', newToken);

        localStorage.setItem('user', JSON.stringify(userData));

        localStorage.setItem('userType', newUserType);

        if (newUserType === 'outlet' && (userData._id || userData.id)) {
          localStorage.setItem('outletId', userData._id || userData.id);
        }

        

        // Update state

        setToken(newToken);

        setUser(userData);

        setUserType(newUserType);

        setIsAuthenticated(true);

        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        

        return { success: true, user: userData, userType: newUserType };

      } else {

        return {

          success: false,

          message: res.data.message || 'Login failed'

        };

      }

    } catch (error) {

      console.error('Login error:', error);

      return { 

        success: false, 

        message: error.response?.data?.message || 'Login failed' 

      };

    }

  };



  const register = async (userData) => {

    try {

      const res = await axios.post(`${API_URL}/api/auth/signup`, userData, {

        withCredentials: true

      });

      

      if (res.data.success) {

        const { token: newToken, user: newUser, userType: newUserType } = res.data;

        

        // Store in localStorage

        localStorage.setItem('token', newToken);

        localStorage.setItem('user', JSON.stringify(newUser));

        localStorage.setItem('userType', newUserType);

        if (newUserType === 'outlet' && (newUser._id || newUser.id)) {
          localStorage.setItem('outletId', newUser._id || newUser.id);
        }

        

        // Update state

        setToken(newToken);

        setUser(newUser);

        setUserType(newUserType);

        setIsAuthenticated(true);

        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        

        return { 

          success: true, 

          message: res.data.message,

          user: newUser,

          userType: newUserType

        };

      } else {

        return {

          success: false,

          message: res.data.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed'

        };

      }

    } catch (error) {

      return {

        success: false,

        message: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed'

      };

    }

  };



  const logout = async () => {

    try {

      await axios.post(`${API_URL}/api/auth/logout`, {}, {

        withCredentials: true

      });

    } catch (error) {

      console.error('Logout error:', error);

    } finally {

      clearAuthState();

    }

  };



  return (

    <AuthContext.Provider value={{ 

      user, 

      userType, 

      isAuthenticated, 

      loading, 

      login, 

      register, 

      logout, 

      fetchUser,

      refreshAuthState 

    }}>

      {children}

    </AuthContext.Provider>

  );

};



export default AuthContext;

