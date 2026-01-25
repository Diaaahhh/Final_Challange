import React from 'react';
// Importing the single background image
import HeroBG from '../../assets/img/HeroBG.png'; 

export default function Hero() {
  return (
    <div className="position-relative d-flex align-items-center" id="hero" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* ==========================
          1. BACKGROUND IMAGE LAYER
      ========================== */}
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 0 }}>
        {/* The Image */}
        <img 
          src={HeroBG} 
          alt="Restaurant Background" 
          className="w-100 h-100" 
          style={{ objectFit: 'cover', objectPosition: 'center' }} 
        />
        {/* Dark Overlay (Essential for text readability) */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
      </div>

    
      

    </div>
  );
}