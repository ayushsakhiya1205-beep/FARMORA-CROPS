import React, { useState } from 'react';
import GoogleMaps from './GoogleMaps';

const GoogleMapsTroubleshoot = () => {
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState('Ready to test Google Maps');

  const runDiagnostics = async () => {
    const results = [];
    
    // Test 1: Check browser compatibility
    setCurrentTest('Testing browser compatibility...');
    const browserTest = {
      name: 'Browser Compatibility',
      status: 'checking',
      details: []
    };
    
    try {
      // Check for basic requirements
      if (typeof window !== 'undefined') {
        browserTest.details.push('✅ Window object available');
      } else {
        browserTest.details.push('❌ Window object not available');
      }
      
      if (document && document.head) {
        browserTest.details.push('✅ Document head available');
      } else {
        browserTest.details.push('❌ Document head not available');
      }
      
      if (navigator && navigator.geolocation) {
        browserTest.details.push('✅ Geolocation available');
      } else {
        browserTest.details.push('⚠️ Geolocation not available');
      }
      
      browserTest.status = 'success';
    } catch (error) {
      browserTest.status = 'error';
      browserTest.details.push(`❌ Error: ${error.message}`);
    }
    
    results.push(browserTest);
    
    // Test 2: Check network connectivity
    setCurrentTest('Testing network connectivity...');
    const networkTest = {
      name: 'Network Connectivity',
      status: 'checking',
      details: []
    };
    
    try {
      // Test fetch to Google Maps API
      const response = await fetch('https://maps.googleapis.com/maps/api/js', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      networkTest.details.push('✅ Google Maps API reachable');
      networkTest.status = 'success';
    } catch (error) {
      networkTest.details.push(`❌ Network error: ${error.message}`);
      networkTest.status = 'error';
    }
    
    results.push(networkTest);
    
    // Test 3: Check for ad blockers
    setCurrentTest('Checking for ad blockers...');
    const adBlockerTest = {
      name: 'Ad Blocker Check',
      status: 'checking',
      details: []
    };
    
    try {
      // Check if common ad blocker patterns are present
      const hasAdBlocker = 
        document.getElementById('adblock') ||
        document.querySelector('.adblock') ||
        window.canRunAds === false;
      
      if (hasAdBlocker) {
        adBlockerTest.details.push('⚠️ Ad blocker detected - may block Google Maps');
        adBlockerTest.status = 'warning';
      } else {
        adBlockerTest.details.push('✅ No obvious ad blocker detected');
        adBlockerTest.status = 'success';
      }
    } catch (error) {
      adBlockerTest.details.push(`❌ Error checking ad blockers: ${error.message}`);
      adBlockerTest.status = 'error';
    }
    
    results.push(adBlockerTest);
    
    // Test 4: Check console for Google Maps errors
    setCurrentTest('Checking for Google Maps errors...');
    const consoleTest = {
      name: 'Console Error Check',
      status: 'checking',
      details: []
    };
    
    try {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        consoleTest.details.push('✅ Google Maps already loaded');
        consoleTest.status = 'success';
      } else {
        consoleTest.details.push('⚠️ Google Maps not yet loaded (normal on first load)');
        consoleTest.status = 'warning';
      }
      
      // Check for common error patterns
      const originalError = console.error;
      let errors = [];
      
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      setTimeout(() => {
        console.error = originalError;
        
        const mapErrors = errors.filter(error => 
          error.includes('Google Maps') || 
          error.includes('maps.googleapis.com') ||
          error.includes('google')
        );
        
        if (mapErrors.length > 0) {
          consoleTest.details.push(`❌ Found ${mapErrors.length} Google Maps related errors`);
          mapErrors.forEach(error => consoleTest.details.push(`   - ${error}`));
          consoleTest.status = 'error';
        } else {
          consoleTest.details.push('✅ No Google Maps errors detected');
        }
        
        setTestResults(results);
        setCurrentTest('Diagnostics complete!');
      }, 2000);
      
    } catch (error) {
      consoleTest.details.push(`❌ Error checking console: ${error.message}`);
      consoleTest.status = 'error';
      results.push(consoleTest);
      setTestResults(results);
      setCurrentTest('Diagnostics complete!');
    }
    
    if (results.length === 4) {
      setTestResults(results);
      setCurrentTest('Diagnostics complete!');
    }
  };

  const getOverallStatus = () => {
    if (testResults.length === 0) return 'pending';
    
    const hasErrors = testResults.some(test => test.status === 'error');
    const hasWarnings = testResults.some(test => test.status === 'warning');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔧 Google Maps Troubleshooting</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '8px' 
      }}>
        <h4>🎯 Purpose:</h4>
        <p>Diagnose why Google Maps might not be loading and provide solutions.</p>
        <p><strong>Current Status:</strong> {currentTest}</p>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={runDiagnostics}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          🔍 Run Diagnostics
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>📊 Diagnostic Results:</h3>
          <div style={{ 
            padding: '15px', 
            background: '#f8f9fa', 
            border: `2px solid ${getStatusColor(getOverallStatus())}`,
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              {getStatusIcon(getOverallStatus())} Overall Status: {getOverallStatus().toUpperCase()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {getOverallStatus() === 'success' && 'All systems ready for Google Maps!'}
              {getOverallStatus() === 'warning' && 'Some issues detected, but Google Maps should work.'}
              {getOverallStatus() === 'error' && 'Critical issues found - Google Maps may not work.'}
            </div>
          </div>
          
          {testResults.map((test, index) => (
            <div 
              key={index}
              style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                background: '#fff', 
                border: `1px solid ${getStatusColor(test.status)}`,
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <h4 style={{ color: getStatusColor(test.status), marginBottom: '10px' }}>
                {getStatusIcon(test.status)} {test.name}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {test.details.map((detail, detailIndex) => (
                  <li key={detailIndex} style={{ fontSize: '14px', marginBottom: '5px' }}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginBottom: '30px' }}>
        <h3>🗺️ Test Google Maps:</h3>
        <GoogleMaps 
          height="300px"
          onLocationSelect={(location) => {
            console.log('Test location selected:', location);
            alert(`Test successful! Location: ${location.address || 'Sample location'}`);
          }}
        />
      </div>
      
      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px' 
      }}>
        <h4>🛠️ Common Solutions:</h4>
        <ul>
          <li><strong>Network Issues:</strong> Check internet connection and try again</li>
          <li><strong>Ad Blockers:</strong> Disable ad blockers temporarily</li>
          <li><strong>Browser Issues:</strong> Try Chrome or Firefox latest version</li>
          <li><strong>API Key Issues:</strong> Google Maps API key might be expired</li>
          <li><strong>CORS Issues:</strong> Some browsers block cross-origin requests</li>
          <li><strong>Firewall:</strong> Corporate firewalls might block Google Maps</li>
        </ul>
      </div>
      
      <div style={{ 
        padding: '15px', 
        background: '#d1ecf1', 
        border: '1px solid #bee5eb',
        borderRadius: '8px' 
      }}>
        <h4>📋 Manual Steps:</h4>
        <ol>
          <li>Open browser developer tools (F12)</li>
          <li>Go to Console tab</li>
          <li>Look for Google Maps related errors</li>
          <li>Check Network tab for failed requests</li>
          <li>Try refreshing the page</li>
          <li>Clear browser cache and cookies</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleMapsTroubleshoot;
