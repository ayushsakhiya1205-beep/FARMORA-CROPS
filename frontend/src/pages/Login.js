import React, { useState, useContext, useEffect } from 'react';

import { useNavigate, Link } from 'react-router-dom';

import AuthContext from '../context/AuthContext';

import './Auth.css';



const Login = () => {

  const navigate = useNavigate();

  const { login, user, userType, isAuthenticated, refreshAuthState } = useContext(AuthContext);

  const [formData, setFormData] = useState({

    email: '',

    password: '',

    otp: ''

  });

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const [emailSuggestions, setEmailSuggestions] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loginHistory, setLoginHistory] = useState([]);

  const [showOTPInput, setShowOTPInput] = useState(false);

  const [otpSent, setOtpSent] = useState(false);

  const [otpEmail, setOtpEmail] = useState('');

  const [generatedOTP, setGeneratedOTP] = useState(''); // For development testing



  useEffect(() => {

    if (isAuthenticated && user && userType) {

      if (userType === 'outlet') {

        navigate('/outlet/dashboard');

      } else {

        navigate('/customer/dashboard');

      }

    }

  }, [user, userType, isAuthenticated, navigate]);



  // Load saved emails and login history from localStorage on component mount
  useEffect(() => {
    const savedEmails = localStorage.getItem('loginEmails');
    const savedLoginHistory = localStorage.getItem('loginHistory');

    if (savedEmails) {
      setEmailSuggestions(JSON.parse(savedEmails));
    }

    if (savedLoginHistory) {
      setLoginHistory(JSON.parse(savedLoginHistory));
    }
  }, []);



  // Save login credentials to localStorage when login is successful
  const saveLoginToHistory = (email, password) => {
    // Save email history
    const currentEmails = [...emailSuggestions];
    const emailIndex = currentEmails.indexOf(email);

    if (emailIndex > -1) {
      currentEmails.splice(emailIndex, 1);
    }

    currentEmails.unshift(email);
    const updatedEmails = currentEmails.slice(0, 5);
    setEmailSuggestions(updatedEmails);
    localStorage.setItem('loginEmails', JSON.stringify(updatedEmails));

    // Save login history (email + password)
    const currentLoginHistory = [...loginHistory];
    const loginIndex = currentLoginHistory.findIndex(item => item.email === email);

    if (loginIndex > -1) {
      currentLoginHistory.splice(loginIndex, 1);
    }

    currentLoginHistory.unshift({ email, password });
    const updatedLoginHistory = currentLoginHistory.slice(0, 3); // Keep only last 3 login attempts
    setLoginHistory(updatedLoginHistory);
    localStorage.setItem('loginHistory', JSON.stringify(updatedLoginHistory));
  };



  // Handle email input change with suggestions
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      email: value,
      password: '' // Clear password when email changes
    });

    // Show suggestions if email is empty or partially matches
    if (value.length === 0 || value.length < 3) {
      setShowSuggestions(false);
    } else {
      const filtered = emailSuggestions.filter(email =>
        email.toLowerCase().includes(value.toLowerCase())
      );
      setShowSuggestions(filtered.length > 0);
    }
  };



  // Select email from suggestions
  const selectEmail = (email) => {
    const loginRecord = loginHistory.find(item => item.email === email);
    setFormData({
      ...formData,
      email: email,
      password: loginRecord ? loginRecord.password : ''
    });
    setShowSuggestions(false);
  };



  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value

    });

  };



  // Request OTP - called when login button is pressed

  const requestOTP = async (e) => {

    e.preventDefault();

    setError('');

    setLoading(true);



    try {

      
const response = await fetch(
  'https://farmora-crops.onrender.com/api/auth/request-login-otp',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
    }),
  }
);


      const data = await response.json();

      console.log('OTP request response:', data);



      if (data.success) {

        setOtpSent(true);

        setOtpEmail(data.email);

        setShowOTPInput(true);

        setGeneratedOTP(data.otp || ''); // Store OTP for development

        setError('');

      } else {

        console.error('OTP request failed:', data.message);

        setError(data.message || 'Failed to send OTP');

      }

    } catch (error) {

      console.error('OTP request error:', error);

      setError('Network error. Please check your connection and try again.');

    }



    setLoading(false);

  };



  // Verify OTP and complete login

  const verifyOTP = async (e) => {

    e.preventDefault();

    setError('');

    setLoading(true);



    try {

      console.log('Verifying OTP for:', formData.email);



      const response = await fetch('https://farmora-crops.onrender.com/api/auth/verify-otp', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          email: formData.email,

          otp: formData.otp

        }),

      });



      const data = await response.json();

      console.log('OTP verification response:', data);



      if (data.success) {
        // Save login credentials to history
        saveLoginToHistory(formData.email, formData.password);

        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userType', data.userType);

        // Set cookie for backend
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

        console.log('✅ Login successful, refreshing auth state...');
        console.log('User Type:', data.userType);
        console.log('User Data:', data.user);

        // Refresh auth state immediately
        const authRefreshed = refreshAuthState();

        if (authRefreshed) {
          console.log('✅ Auth state refreshed, navigating to dashboard...');
          // Navigate based on user type using navigate function
          setTimeout(() => {
            if (data.userType === 'outlet') {
              console.log('🚀 Navigating to outlet dashboard');
              navigate('/outlet/dashboard', { replace: true });
            } else {
              console.log('🚀 Navigating to customer dashboard');
              navigate('/customer/dashboard', { replace: true });
            }
          }, 300);
        } else {
          console.log('❌ Failed to refresh auth state, trying direct navigation...');
          // Force direct navigation
          if (data.userType === 'outlet') {
            navigate('/outlet/dashboard', { replace: true });
          } else {
            navigate('/customer/dashboard', { replace: true });
          }
        }
      } else {

        console.error('OTP verification failed:', data.message);

        setError(data.message || 'Invalid OTP');

      }

    } catch (error) {

      console.error('OTP verification error:', error);

      setError('Network error. Please check your connection and try again.');

    }



    setLoading(false);

  };



  // Reset OTP flow

  const resetOTPFlow = () => {

    setShowOTPInput(false);

    setOtpSent(false);

    setOtpEmail('');

    setGeneratedOTP('');

    setFormData({

      ...formData,

      otp: ''

    });

    setError('');

  };



  return (

    <div className="auth-page">

      <div className="auth-container">

        <h1>Login to Farmora Crops</h1>



        {/* <div className="login-info">

          <div className="login-type-info">

            <h4>Customer Login</h4>

            <p>Use your personal email (e.g., user@gmail.com)</p>

          </div>

          <div className="login-type-info">

            <h4>Outlet Login</h4>

            <p>Use your outlet email (e.g., rajkot@farmora.in)</p>

          </div>

        </div> */}



        {!showOTPInput ? (

          // Initial login form - request OTP

          <form onSubmit={requestOTP} className="auth-form">

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">

              <label>Email</label>

              <div className="email-input-container">

                <input

                  type="email"

                  name="email"

                  value={formData.email}

                  onChange={handleEmailChange}

                  onFocus={() => setShowSuggestions(emailSuggestions.length > 0 && formData.email.length >= 3)}

                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}

                  placeholder="Enter your email (customer or outlet@farmora.in)"

                  required

                  autoComplete="off"

                />

                {showSuggestions && (
                  <div className="email-suggestions">
                    {emailSuggestions
                      .filter(email =>
                        formData.email.length === 0 ||
                        email.toLowerCase().includes(formData.email.toLowerCase())
                      )
                      .map((email, index) => {
                        const hasPassword = loginHistory.find(item => item.email === email);
                        return (
                          <div
                            key={index}
                            className={`suggestion-item ${hasPassword ? 'has-password' : ''}`}
                            onClick={() => selectEmail(email)}
                          >
                            <div className="suggestion-email">{email}</div>
                            {hasPassword && (
                              <div className="suggestion-indicator">
                                <span className="indicator-icon"></span>
                                <span className="indicator-text">Password saved</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

              </div>

            </div>

            <div className="form-group">

              <label>Password</label>

              <input

                type="password"

                name="password"

                value={formData.password}

                onChange={handleChange}

                placeholder="Enter your password"

                required

              />

            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>

              {loading ? 'Sending OTP...' : 'Login'}

            </button>

          </form>

        ) : (

          // OTP verification form

          <form onSubmit={verifyOTP} className="auth-form">

            {error && <div className="error-message">{error}</div>}



            {otpSent && (

              <div className="otp-info">

                <p>OTP has been sent to: <strong>{otpEmail}</strong></p>

                <p>Please check your email and enter the 6-digit OTP below.</p>

                {generatedOTP && otpEmail && otpEmail.includes('@farmora.in') && (

                  <p style={{ color: '#666', fontSize: '12px' }}>

                    Development: OTP is <strong>{generatedOTP}</strong>

                  </p>

                )}

              </div>

            )}



            <div className="form-group">

              <label>OTP (6 digits)</label>

              <input

                type="text"

                name="otp"

                value={formData.otp}

                onChange={handleChange}

                placeholder="Enter 6-digit OTP"

                maxLength={6}

                pattern="[0-9]{6}"

                required

                className="otp-input"

              />

            </div>



            <div className="otp-buttons">

              <button type="submit" className="btn btn-primary btn-large" disabled={loading}>

                {loading ? 'Verifying...' : 'Verify OTP'}

              </button>



              <button type="button" className="btn btn-secondary" onClick={resetOTPFlow}>

                Back to Login

              </button>

            </div>



            <div className="resend-otp">

              <p>Didn't receive OTP? <button type="button" className="link-button" onClick={requestOTP}>Resend OTP</button></p>

            </div>

          </form>

        )}



        <p className="auth-link">

          <Link to="/forgot-password">Forgot Password?</Link>

        </p>

        <p className="auth-link">

          Don't have an account? <Link to="/register">Register here</Link>

        </p>

      </div>

    </div>

  );

};



export default Login;

