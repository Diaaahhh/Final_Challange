import React, { useEffect, useState } from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6";

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

return (
    <footer className="relative bg-[#0A0A0A] text-white overflow-hidden font-['Inter'] border-t border-[#1E1E1E]">
      
      {/* COPYRIGHT */}
      <div className="border-t border-[#1E1E1E] bg-[#111111] py-5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A0A0A0] text-sm text-center md:text-left font-medium">
            Copyright © 2025 All Rights Reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms & Condition', 'Support policy'].map((link, i) => (
              <a key={i} href="#" className="text-[#A0A0A0] hover:text-[#007BFF] text-sm transition-colors font-medium">{link}</a>
            ))}
          </div>
        </div>
      </div>

      {/* SCROLL TO TOP */}
      <div onClick={scrollToTop} className={`fixed bottom-8 right-8 z-50 transition-all duration-300 cursor-pointer ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="btn btn-circle bg-[#007BFF] hover:bg-[#C59D5F] border-none text-white shadow-[0_0_15px_rgba(0,123,255,0.5)] w-12 h-12 flex items-center justify-center group">
          <FaArrowUp className="group-hover:-translate-y-1 transition-transform" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;