import React, { useState, useEffect } from 'react';
import './AdvertisementBanner.css';

const AdvertisementBanner = () => {
  const [currentAd, setCurrentAd] = useState(0);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    // Load advertisements from backend or use default ones
    const loadAdvertisements = async () => {
      try {
        // For now, using local data. In future, this can be fetched from backend
        // Automatically generate ads for all images in the advertisement folder
        const adImages = [
          '1.png',
          '2.png',
          '3.png',
          '4.png',
          '5.png'
        ];
        
        const adTitles = [
          'Special Offer',
          'New Arrivals'
        ];
        
        const adDescriptions = [
          'Get 20% off on all organic grains this month!',
          'Check out our latest collection of organic spices'
        ];
        
        const defaultAds = adImages.map((image, index) => ({
          id: index + 1,
          image: `/image/advertisment/${image}`,
          title: adTitles[index],
          description: adDescriptions[index],
          link: '/products'
        }));
        
        console.log('Loaded advertisements:', defaultAds);
        setAds(defaultAds);
      } catch (error) {
        console.error('Error loading advertisements:', error);
      }
    };

    loadAdvertisements();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [ads.length]);

  const handleDotClick = (index) => {
    setCurrentAd(index);
  };

  const handlePrev = () => {
    setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    setCurrentAd((prev) => (prev + 1) % ads.length);
  };

  if (ads.length === 0) {
    return null;
  }

  return (
    <section className="advertisement-banner">
      <div className="container">
        <div className="banner-slider">
          {ads.map((ad, index) => (
            <div
              key={ad.id}
              className={`banner-slide ${index === currentAd ? 'active' : ''}`}
            >
              <a href={ad.link} className="banner-link">
                <div className="banner-content">
                  <div className={`banner-image banner-image-${ad.id}`}>
                    <img 
                      src={ad.image} 
                      alt={ad.title}
                      onError={(e) => {
                        console.log(`Failed to load image: ${ad.image}, trying fallback...`);
                        // Try to load a different ad image as fallback
                        const fallbackAds = [
                          '/image/advertisment/1.png',
                           '/image/advertisment/2.png',
                            '/image/advertisment/3.png',
                             '/image/advertisment/4.png',
                          '/image/advertisment/5.png'
                        ];
                        const randomFallback = fallbackAds[Math.floor(Math.random() * fallbackAds.length)];
                        e.target.src = randomFallback;
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded image: ${ad.image}`);
                      }}
                    />
                  </div>
                </div>
              </a>
            </div>
          ))}

          {ads.length > 1 && (
            <div className="banner-dots">
              {ads.map((_, index) => (
                <button
                  key={index}
                  className={`banner-dot ${index === currentAd ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdvertisementBanner;
