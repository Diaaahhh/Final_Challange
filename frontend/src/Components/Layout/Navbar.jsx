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
     
     

      {/* MAIN NAVBAR */}
      <div className={`transition-all duration-300 border-b border-white/5 ${isSticky ? 'fixed top-0 left-0 w-full bg-[#0E1014] shadow-lg py-2' : 'relative bg-[#0E1014] py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="navbar p-0 min-h-[auto] flex justify-between items-center">
            
            {/* LOGO */}
            <div className="navbar-start w-auto mr-8">
              <Link to="/" className="group flex flex-col items-center leading-none">
                <h2 className="text-4xl font-['Barlow_Condensed'] font-extrabold uppercase italic tracking-wider">
                  <span className="text-white group-hover:text-[#C59D5F] transition-colors">Khabar</span>
                  <span className="text-[#C59D5F] group-hover:text-white transition-colors">Table</span>
                </h2>
                <p className="text-xs font-['Inter'] tracking-[0.4em] text-gray-500 uppercase mt-1 group-hover:tracking-[0.5em] transition-all duration-300">
                  .com
                </p>
              </Link>
            </div>

            {/* DESKTOP MENU */}
           

            {/* NAVBAR END: Buttons */}
           
          </div>
        </div>
      </div>

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