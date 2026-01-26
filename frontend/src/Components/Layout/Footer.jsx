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
    <footer className="relative bg-[#0E1014] text-white pt-20 overflow-hidden font-['Inter']">
      
      {/* ANIMATIONS */}
      <style>{`
        @keyframes jump { 0% { transform: translateY(0); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0); } }
        @keyframes movingX { 0% { transform: translateX(0); } 50% { transform: translateX(30px); } 100% { transform: translateX(0); } }
        .animate-jump { animation: jump 4s infinite ease-in-out; }
        .animate-jump-reverse { animation: jump 5s infinite ease-in-out reverse; }
        .animate-movingX { animation: movingX 6s infinite linear; }
        .font-barlow { font-family: 'Barlow Condensed', sans-serif; }
      `}</style>

          
      
    

      {/* COPYRIGHT */}
      <div className="border-t border-white/10 bg-[#08090C] py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            Copyright © 2025  All Rights Reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms & Condition', 'Support policy'].map((link, i) => (
              <a key={i} href="#" className="text-gray-500 hover:text-[#C59D5F] text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </div>

      {/* SCROLL TO TOP */}
      <div onClick={scrollToTop} className={`fixed bottom-8 right-8 z-50 transition-all duration-300 cursor-pointer ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="btn btn-circle bg-[#C59D5F] hover:bg-[#C59D5F] border-none text-black shadow-lg relative w-12 h-12 flex items-center justify-center overflow-hidden group">
          <FaArrowUp className="group-hover:-translate-y-1 transition-transform" />
          <svg className="absolute top-0 left-0 w-full h-full rotate-[-90deg]" viewBox="-1 -1 102 102">
            <path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" fill="none" stroke="white" strokeWidth="4" strokeDasharray="307.919" strokeDashoffset="250" className="opacity-30" />
          </svg>
        </div>
      </div>
    </footer>
  );
};

export default Footer;