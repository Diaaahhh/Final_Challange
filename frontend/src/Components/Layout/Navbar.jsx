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
      {/* MAIN NAVBAR - Dark theme */}
      <div className={`transition-all duration-300 border-b border-[#1E1E1E] ${isSticky ? 'fixed top-0 left-0 w-full bg-[#0A0A0A] shadow-[0_4px_20px_rgba(0,0,0,0.5)] py-2' : 'relative bg-[#111111] py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="navbar p-0 min-h-[auto] flex justify-between items-center">
            
            {/* LOGO */}
            <div className="navbar-start w-auto mr-8">
              <Link to="/" className="group flex flex-col items-center leading-none">
                <h2 className="text-4xl font-['Barlow_Condensed'] font-extrabold  italic tracking-wider">
                  <span className="text-white group-hover:text-[#007BFF] transition-colors"></span>
                  <span className="text-[#C59D5F] group-hover:text-white transition-colors"></span>
                </h2>
                <p className="text-xs font-['Inter'] tracking-[0.4em] text-[#A0A0A0]  mt-1"></p>
              </Link>
            </div>
          </div>
        </div>
      </div>

            {/* DESKTOP MENU */}
           

            {/* NAVBAR END: Buttons */}
           
          

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 lg:hidden backdrop-blur-sm transition-all">
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#111111] text-white shadow-2xl p-6 border-l border-[#1E1E1E]">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-['Barlow_Condensed'] font-extrabold  italic tracking-wider">
                  <span className="text-white">Khabar</span><span className="text-[#C59D5F]">Table</span>
               </h2>
               <button onClick={() => setIsMobileMenuOpen(false)} className="btn btn-circle btn-sm btn-ghost border border-[#2A2A2A] hover:bg-[#007BFF] hover:text-white text-white">✕</button>
            </div>
            
          
          </div>
        </div>
      )}
    </header>
  );
}