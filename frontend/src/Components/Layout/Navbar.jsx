import React, { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, FaEnvelopeOpen, FaClock, FaPhoneAlt, 
  FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp, 
  FaShoppingCart, FaBars 
} from 'react-icons/fa'; 
import { Link } from 'react-router-dom';
export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ---> THIS IS THE MISSING LINE <---


  // 1. Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Check for User Login Status


  // 3. Handle Logout Logic


return (
    <header className="relative w-full z-50 font-['Inter']">
      {/* MAIN NAVBAR - Changed bg to #FFFFFF and text to #1E293B */}
      <div className={`transition-all duration-300 border-b border-[#E2E8F0] ${isSticky ? 'fixed top-0 left-0 w-full bg-white shadow-md py-2' : 'relative bg-white py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="navbar p-0 min-h-[auto] flex justify-between items-center">
            
            {/* LOGO - Text changed to Charcoal */}
            <div className="navbar-start w-auto mr-8">
              <Link to="/" className="group flex flex-col items-center leading-none">
                <h2 className="text-4xl font-['Barlow_Condensed'] font-extrabold uppercase italic tracking-wider">
                  <span className="text-[#1E293B] group-hover:text-[#C59D5F] transition-colors"></span>
                  <span className="text-[#C59D5F] group-hover:text-[#1E293B] transition-colors"></span>
                </h2>
                <p className="text-xs font-['Inter'] tracking-[0.4em] text-[#64748B] uppercase mt-1"></p>
              </Link>
            </div>
          </div>
        </div>
      </div>

            {/* DESKTOP MENU */}
           

            {/* NAVBAR END: Buttons */}
           
          

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 lg:hidden backdrop-blur-sm transition-all">
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#0E1014] text-white shadow-2xl p-6 border-l border-white/10">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-['Barlow_Condensed'] font-extrabold uppercase italic tracking-wider">
                  <span className="text-white">Khabar</span><span className="text-[#C59D5F]">Table</span>
               </h2>
               <button onClick={() => setIsMobileMenuOpen(false)} className="btn btn-circle btn-sm btn-ghost border border-white/20 hover:bg-[#C59D5F] hover:text-white">✕</button>
            </div>
            
          
          </div>
        </div>
      )}
    </header>
  );
}