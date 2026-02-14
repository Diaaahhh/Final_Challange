import React, { useEffect, useState } from 'react';
import api from '../../api';
import { IMAGE_BASE_URL } from '../../config'; // 1. Import the config

export default function Hero() {
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    api.get('/get-hero')
      .then(res => {
        if(res.data) {
          setHeroData(res.data);
        }
      })
      .catch(err => console.log(err));
  }, []);

  // 2. FIX: Use IMAGE_BASE_URL + '/uploads/'
  const bgImage = heroData && heroData.image 
    ? `${IMAGE_BASE_URL}/uploads/${heroData.image}`
    : null; 

  return (
    <div 
      className="d-flex align-items-center justify-content-center" 
      id="hero" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', 
        overflow: 'hidden' 
      }}
    >
      
      {/* ==========================
          1. BACKGROUND IMAGE LAYER
      ========================== */}
      {bgImage ? (
        <div 
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                zIndex: 0 
            }}
        >
            <img 
              src={bgImage} 
              alt={heroData ? heroData.name : "Hero Background"} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',   
                objectPosition: 'center' 
              }} 
            />
            {/* Dark Overlay */}
            {/* <div 
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.4)' // Added slight darkness for readability
                }}
            ></div> */}
        </div>
      ) : (
        // Fallback gray background
        <div className="position-absolute w-100 h-100 bg-secondary" style={{ zIndex: 0 }}></div>
      )}

      {/* ==========================
          2. CONTENT LAYER (Responsive)
      ========================== */}
      <div 
        className="position-relative text-center text-white px-4" 
        style={{ 
            zIndex: 1, 
            maxWidth: '1200px', 
            width: '100%' 
        }}
      >
         {heroData && (
            <h1 
                className="fw-bold" 
                style={{ 
                    fontSize: 'clamp(2.5rem, 6vw, 5rem)', 
                    textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
                    lineHeight: '1.2'
                }}
            >
                {heroData.name}
            </h1>
         )}
      </div>

    </div>
  );
}