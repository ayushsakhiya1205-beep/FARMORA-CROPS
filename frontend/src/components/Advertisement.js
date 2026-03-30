import React, { useState, useEffect } from 'react';
import './Advertisement.css';

const Advertisement = () => {
  const [currentAd, setCurrentAd] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const advertisements = [
    '/image/advertisment/newad1.jpeg',
    '/image/advertisment/newad2.jpeg'
  ];

  // Debug: Log current paths
  console.log('Advertisement paths:', advertisements);
  console.log('Current ad index:', currentAd);
  console.log('Current ad path:', advertisements[currentAd]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % advertisements.length);
        setFadeIn(true);
      }, 300);
    }, 4000); // 4 seconds for 2 images

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentAd]);

  const handleAdClick = () => {
    console.log('Advertisement clicked:', advertisements[currentAd]);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load advertisement:', advertisements[currentAd]);
    console.error('Full path attempted:', advertisements[currentAd]);
    console.error('Image error state set to true');
  };

  return (
    <div className="advertisement-container">
      <div className="advertisement-wrapper">
        {!imageLoaded && !imageError && (
          <div className="advertisement-placeholder">
            <div className="loading-spinner"></div>
            <p>Loading Advertisement...</p>
          </div>
        )}
        {imageError ? (
          <div className="advertisement-error">
            <p>Advertisement unavailable</p>
          </div>
        ) : (
          <img
            src={advertisements[currentAd]}
            alt={`Advertisement ${currentAd + 1}`}
            className={`advertisement-image ${fadeIn ? 'fade-in' : 'fade-out'} ${imageLoaded ? 'loaded' : ''}`}
            onClick={handleAdClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        <div className="advertisement-indicators">
          {advertisements.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentAd ? 'active' : ''}`}
              onClick={() => {
                setFadeIn(false);
                setTimeout(() => {
                  setCurrentAd(index);
                  setFadeIn(true);
                }, 300);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Advertisement;
