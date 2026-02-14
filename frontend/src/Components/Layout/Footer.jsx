import React, { useEffect, useState } from 'react';
// 1. IMPORT THE ICONS FROM REACT-ICONS
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6"; // For the scroll-up arrow

// Import Images

import Logo from "../Logo/Logo.jsx"
const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 400) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 400) {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 2. DEFINE SOCIAL LINKS WITH COMPONENTS


return (
    <footer className="relative bg-[#F8FAFC] text-[#1E293B] overflow-hidden font-['Inter']">
      
      {/* COPYRIGHT - Changed to bg-[#F1F5F9] and border-[#E2E8F0] */}
      <div className="border-t border-[#E2E8F0] bg-[#F1F5F9] py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#64748B] text-sm text-center md:text-left">
            Copyright © 2025 All Rights Reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms & Condition', 'Support policy'].map((link, i) => (
              <a key={i} href="#" className="text-[#64748B] hover:text-[#C59D5F] text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </div>

      {/* SCROLL TO TOP - Kept Gold as it is a functional accent */}
      <div onClick={scrollToTop} className={`fixed bottom-8 right-8 z-50 transition-all duration-300 cursor-pointer ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="btn btn-circle bg-[#C59D5F] hover:bg-[#475569] border-none text-white shadow-lg w-12 h-12 flex items-center justify-center group">
          <FaArrowUp className="group-hover:-translate-y-1 transition-transform" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;