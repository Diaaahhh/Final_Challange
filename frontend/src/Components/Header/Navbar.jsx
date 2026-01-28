import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, FaEnvelopeOpen, FaClock, FaPhoneAlt, 
  FaFacebookF, FaTwitter, FaWhatsapp, FaBars 
} from 'react-icons/fa'; 

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ---> THIS IS THE MISSING LINE <---
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 1. Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Check for User Login Status
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 3. Handle Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  return (
    <header className="relative w-full z-50 font-['Inter']">
      
      {/* TOP BAR */}
      <div className="bg-[#0E1014] text-gray-400 text-sm py-3 hidden md:block border-b border-white/10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 hidden xl:flex">
              <FaMapMarkerAlt className="text-[#C59D5F]" />
              <span className="text-gray-300">House 33A, Road 4, Dhanmondi, Dhaka</span>
            </div>
            <div className="flex items-center gap-2 hidden lg:flex">
              <FaEnvelopeOpen className="text-[#C59D5F]" />
              <a href="mailto:info@barab.com" className="hover:text-[#C59D5F] transition-colors">info@iglweb.com</a>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-[#C59D5F]" />
              <span>Sun to Sat - 10am to 9pm</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hidden xl:flex">
              <FaPhoneAlt className="text-[#C59D5F]" />
              <a href="tel:+26365479875" className="hover:text-white transition-colors">+880-1958-666 999</a>
            </div>
            <div className="flex gap-3">
               {[
                 { Icon: FaFacebookF, link:"https://www.facebook.com/IGLWebLtd/" },
                 { Icon: FaTwitter, link:"https://twitter.com/iglwebltd" },
                 { Icon: FaWhatsapp, link: "https://wa.me/8801958666999" },
               ].map((social, idx) => (
                 <a key={idx} href={social.link} className="hover:text-[#C59D5F] transition-colors">
                   <social.Icon size={14} />
                 </a>
               ))}
            </div>
          </div>
        </div>
      </div>

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
            <div className="navbar-center hidden lg:flex">
              <ul className="menu menu-horizontal px-1 gap-6 font-bold text-white uppercase tracking-wide text-[15px] font-['Barlow_Condensed']">
                <li><Link to="/" className="hover:text-[#C59D5F] focus:text-[#C59D5F] p-0 bg-transparent">Home</Link></li>
                <li><Link to="/about" className="hover:text-[#C59D5F] p-0 bg-transparent">About</Link></li>
                                <li><Link to="/menu-user" className="hover:text-[#C59D5F] p-0 bg-transparent">Menu</Link></li>

                {/* <li tabIndex={0} className="dropdown dropdown-hover group">

                  <span className="hover:text-[#C59D5F] p-0 bg-transparent cursor-pointer">Menu</span>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white text-black rounded-none w-52 text-sm mt-4 border-t-4 border-[#C59D5F]">
                    <li><Link to="/menu-grid" className="hover:text-[#C59D5F] hover:bg-transparent">Menu Grid</Link></li>
                    <li><Link to="/menu-list" className="hover:text-[#C59D5F] hover:bg-transparent">Menu List</Link></li>
                  </ul>
                </li> */}
                {/* <li><Link to="/blog" className="hover:text-[#C59D5F] p-0 bg-transparent">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-[#C59D5F] p-0 bg-transparent">Contact</Link></li> */}
              </ul>
            </div>

            {/* NAVBAR END: Buttons */}
            <div className="navbar-end flex gap-4 items-center w-full lg:w-auto">
              
              {/* Login / Logout Button (Desktop) */}
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="btn btn-sm bg-transparent border border-[#C59D5F] text-white hover:bg-[#C59D5F] hover:text-[#0E1014] rounded-[4px] px-5 font-['Barlow_Condensed'] font-bold uppercase tracking-wider hidden xl:inline-flex mr-2 transition-all duration-300"
                >
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="btn btn-sm bg-transparent border border-[#C59D5F] text-white hover:bg-[#C59D5F] hover:text-[#0E1014] rounded-[4px] px-5 font-['Barlow_Condensed'] font-bold uppercase tracking-wider hidden xl:inline-flex mr-2 transition-all duration-300"
                >
                  Login
                </Link>
              )}

              {/* <button className="btn btn-circle btn-ghost btn-sm relative text-white hover:text-[#C59D5F] mr-2">
                <FaShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 bg-[#C59D5F] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">5</span>
              </button> */}

              <Link to="/reservation" className="btn bg-[#C59D5F] hover:bg-white hover:text-[#0E1014] text-white border-none rounded-[4px] px-7 font-['Barlow_Condensed'] font-bold uppercase tracking-wider hidden xl:inline-flex transition-all duration-300">
                Reserve a Table
              </Link>

              {/* Mobile Menu Button */}
              <button 
                className="btn btn-ghost lg:hidden text-2xl text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <FaBars />
              </button>
            </div>
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
            
            <div className="flex flex-col gap-0 font-['Barlow_Condensed'] text-lg uppercase tracking-wide">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover:text-[#C59D5F] transition-colors">Home</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover:text-[#C59D5F] transition-colors">About</Link>
              <Link to="/menu-grid" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover:text-[#C59D5F] transition-colors">Menu</Link>
              
              {/* Mobile Login / Logout Logic */}
              {user ? (
                 <button onClick={handleLogout} className="text-left border-b border-white/10 py-3 hover:text-[#C59D5F] transition-colors text-[#C59D5F]">Logout</button>
              ) : (
                 <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover:text-[#C59D5F] transition-colors text-[#C59D5F]">Login</Link>
              )}

              <div className="mt-8">
                <Link to="/reservation" onClick={() => setIsMobileMenuOpen(false)} className="btn bg-[#C59D5F] hover:bg-white hover:text-black text-white border-none w-full font-bold uppercase rounded-[4px]">Reserve Table</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}