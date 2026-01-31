import React, { useEffect, useState } from 'react';
// 1. IMPORT THE ICONS FROM REACT-ICONS
import { FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FaArrowUp } from "react-icons/fa6"; // For the scroll-up arrow

// Import Images
import footerIcon1 from "../../assets/img/icon/footer-1-1.png";
import footerIcon11 from "../../assets/img/icon/footer-1-11.png";
import footerIcon2 from "../../assets/img/icon/footer-1-2.png";
import footerIcon22 from "../../assets/img/icon/footer-1-22.png";
import footerIcon3 from "../../assets/img/icon/footer-1-3.png";
import footerIcon33 from "../../assets/img/icon/footer-1-33.png";
import footerIcon4 from "../../assets/img/icon/footer-1-4.png";
import footerIcon5 from "../../assets/img/icon/footer-1-5.png";
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

      {/* FLOATING IMAGES (Unchanged) */}
      <div className="absolute left-0 top-0 hidden 2xl:block animate-jump"><img src={footerIcon1} alt="" /></div>
      <div className="absolute left-0 top-0 z-0 opacity-50"><img src={footerIcon11} alt="" /></div>
      <div className="absolute left-[40%] top-0 hidden 2xl:block animate-movingX"><img src={footerIcon2} alt="" /></div>
      <div className="absolute left-[40%] top-0 z-0 opacity-50"><img src={footerIcon22} alt="" /></div>
      <div className="absolute right-0 -top-[5%] hidden 2xl:block animate-jump-reverse"><img src={footerIcon3} alt="" /></div>
      <div className="absolute right-0 top-0 hidden 2xl:block"><img src={footerIcon33} alt="" /></div>
      <div className="absolute right-0 bottom-[6%] hidden 2xl:block animate-movingX"><img src={footerIcon4} alt="" /></div>
      <div className="absolute left-0 bottom-[4%] hidden 2xl:block animate-jump"><img src={footerIcon5} alt="" /></div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* LOGO AREA */}
       
        <Logo/>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* LINKS */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold font-barlow text-[#C59D5F] mb-6 uppercase tracking-wide">Sister Concerns</h3>
            <ul className="space-y-3">
  {[
    { name: 'IGL Tours and Travels', link: 'https://iglweb.com/web/' },
    { name: 'IGL Network',           link: '#' },
    { name: 'Student Visa',          link: 'https://studentvisabd.com/' },
    { name: 'FelnaTech',             link: 'https://felnatech.com' }
  ].map((item, i) => (
    <li key={i}>
      <a 
        href={item.link} 
        target={item.link !== '#' ? "_blank" : "_self"} 
        rel={item.link !== '#' ? "noopener noreferrer" : ""}
        className="text-gray-400 hover:text-[#C59D5F] transition-colors duration-300 text-lg"
      >
        {item.name}
      </a>
    </li>
  ))}
</ul>
          </div>

          {/* CENTER WIDGET */}
          <div className="text-center">
            <div className="relative inline-block p-8 border border-[#C59D5F]/30 rounded-full bg-[#0b0d10] mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl text-[#C59D5F] mb-3">
                  {/* Standard clock icon */}
                  <i className="fa-regular fa-clock"></i> 
                </div>
                <p className="text-[#C59D5F] font-semibold mb-1 uppercase tracking-wider">We’re currently open!</p>
                <p className="text-gray-300 text-sm">Opening Hours: 10:00AM To 9:00PM</p>
              </div>
            </div>

            
          </div>

          {/* MENUS */}
          <div className="text-center lg:text-right">
            <h3 className="text-2xl font-bold font-barlow text-[#C59D5F] mb-6 uppercase tracking-wide">Sister Concerns</h3>
            <ul className="space-y-3">
              {['IGL Web Ltd.', 'Felna Digital Marketing Agency', 'Felna Online', 'IGL Host LLC'].map((item, i) => (
                <li key={i}><a href="#" className="text-gray-400 hover:text-[#C59D5F] transition-colors duration-300 text-lg">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/10 bg-[#08090C] py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
  Copyright © 2025 
  <a 
    href="https://iglweb.com/web/contact-address.php" 
    className="text-[#C59D5F] hover:text-white ml-1 font-['Arial_Black']"
  >
    IGL Web Ltd.
  </a> 
  All Rights Reserved.
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