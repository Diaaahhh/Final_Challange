import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Optional: Import a default image if you have one
// import DefaultHeroBG from '../../assets/img/HeroBG.png'; 

export default function Hero() {
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8081/api/get-hero')
      .then(res => {
        if(res.data) {
          setHeroData(res.data);
        }
      })
      .catch(err => console.log(err));
  }, []);

  // Logic: Use DB image if available, otherwise return null
  const bgImage = heroData && heroData.image 
    ? `http://localhost:8081/uploads/${heroData.image}`
    : null; 

  return (
    <div 
      className="d-flex align-items-center justify-content-center" 
      id="hero" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', // Full screen height
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
                objectFit: 'cover',   // CRITICAL: Ensures image crops nicely on mobile
                objectPosition: 'center' 
              }} 
            />
            {/* Dark Overlay */}
            <div 
                style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    // backgroundColor: 'rgba(0,0,0,0.6)' // Darkens image for better text readability
                }}
            ></div>
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
            maxWidth: '1200px', // Prevents text from stretching too wide on huge screens
            width: '100%' 
        }}
      >
         {heroData && (
            <h1 
                className="fw-bold" 
                style={{ 
                    // clamp(min, preferred, max) -> Makes font fluidly responsive
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