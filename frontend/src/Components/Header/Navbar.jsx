import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, FaEnvelopeOpen, FaClock, FaPhoneAlt, 
  FaFacebookF, FaTwitter, FaWhatsapp, FaBars, FaShoppingCart 
} from 'react-icons/fa'; 
import api from '../../api';
import { IMAGE_BASE_URL } from '../../config';
import { useCart } from '../Cart/CartContext'; 

export default function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const { cartItems, openCart } = useCart(); 

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const fetchUserData = async () => {
          try {
              const res = await api.get(`/user/${parsedUser.id}`);
              if (res.data) {
                  setUser(res.data);
                  localStorage.setItem('user', JSON.stringify(res.data));
              }
          } catch (err) {}
      };
      fetchUserData();
    }
  }, []);

useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await api.get("/navbar/logo");
        // Access the 'logo' property from the JSON response
        if (res.data && res.data.logo) {
            setLogo(res.data.logo);
        }
      } catch (err) {
        console.error("Logo fetch failed", err.message);
      }
    };
    fetchLogo();
  }, []);

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('userAuthStateChanged'));
    navigate('/');
  };

  const getPhotoUrl = (url) => {
    if (!url) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    return `${IMAGE_BASE_URL}${url}`;
  };

  return (
    <header className="relative w-full z-50 font-['Inter']">
      
      {/* TOP BAR */}
      <div className="theme-bg text-gray-400 text-sm py-3 hidden md:block border-b border-white/10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 hidden xl:flex">
              <FaMapMarkerAlt className="theme-accent" />
              <span className="text-gray-300">House 33A, Road 4, Dhanmondi, Dhaka</span>
            </div>
            <div className="flex items-center gap-2 hidden lg:flex">
              <FaEnvelopeOpen className="theme-accent" />
              <a href="mailto:info@barab.com" className="hover-theme-accent transition-colors">info@iglweb.com</a>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="theme-accent" />
              <span>Sun to Sat - 10am to 9pm</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hidden xl:flex">
              <FaPhoneAlt className="theme-accent" />
              <a href="tel:+26365479875" className="hover:text-white transition-colors">+880-1958-666 999</a>
            </div>
            <div className="flex gap-3">
               {[
                 { Icon: FaFacebookF, link:"https://www.facebook.com/IGLWebLtd/" },
                 { Icon: FaTwitter, link:"https://twitter.com/iglwebltd" },
                 { Icon: FaWhatsapp, link: "https://wa.me/8801958666999" }
               ].map((social, idx) => (
                 <a key={idx} href={social.link} className="hover-theme-accent transition-colors">
                   <social.Icon size={14} />
                 </a>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <div className={`transition-all duration-300 border-b border-white/5 ${isSticky ? 'fixed top-0 left-0 w-full theme-bg shadow-lg py-2' : 'relative theme-bg py-4'}`}>
        <div className="container mx-auto px-4">
          <div className="navbar p-0 min-h-[auto] flex justify-between items-center">
            
            {/* LOGO */}
            <div className="navbar-start w-auto mr-8">
              <Link to="/" className="flex items-center">
                <div className="w-[125px] h-[125px] flex items-center justify-center overflow-hidden">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-white">
                      Khabar<span className="theme-accent">Table</span>
                    </h2>
                  )}
                </div>
              </Link>
            </div>

            {/* DESKTOP MENU */}
            <div className="navbar-center hidden lg:flex">
              <ul className="menu menu-horizontal px-1 gap-6 font-bold text-white  tracking-wide text-[15px] font-['Barlow_Condensed']">
                {user && (user.role === 0 || user.role === '0') && (
                  <li>
                    <Link to="/admin" className="hover:text-white theme-accent p-0 bg-transparent">
                      Admin Panel
                    </Link>
                  </li>
                )}
                <li><Link to="/" className="hover-theme-accent focus:text-white p-0 bg-transparent">Home</Link></li>
                <li><Link to="/about" className="hover-theme-accent p-0 bg-transparent">About</Link></li>
                <li><Link to="/menu-user" className="hover-theme-accent p-0 bg-transparent">Menu</Link></li>
                <li tabIndex={0} className="dropdown dropdown-hover group">
                  <span className="hover-theme-accent p-0 bg-transparent cursor-pointer">Contact</span>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white text-black rounded-none w-52 text-sm mt-5 border-t-4 theme-border">
                    {/* <li><Link to="/address" className="hover-theme-accent hover:bg-transparent">Address</Link></li> */}
                    <li><Link to="/branch_user" className="hover-theme-accent hover:bg-transparent">Branches</Link></li>
                    {/* <li><Link to="/review" className="hover-theme-accent hover:bg-transparent">Feedback</Link></li> */}
                    <li><Link to="/map" className="hover-theme-accent hover:bg-transparent">Location Map</Link></li>
                  </ul>
                </li>
                <li><Link to="/portfolio_user" className="hover-theme-accent p-0 bg-transparent">Gallery</Link></li>
              </ul>
            </div>

            {/* NAVBAR END: Buttons */}
            <div className="navbar-end flex gap-4 items-center w-full lg:w-auto">
              
              {/* --- PROFILE PICTURE DROPDOWN --- */}
              {user && (
                <div className="dropdown dropdown-end dropdown-hover group hidden xl:block mr-2">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring-2 theme-ring ring-offset-2 theme-ring-offset">
                    <div className="w-10 rounded-full">
                      <img alt="Profile" src={getPhotoUrl(user.photoUrl)} className="object-cover"/>
                    </div>
                  </div>

                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-white text-black rounded-none w-40 text-sm mt-2 border-t-4 theme-border font-['Barlow_Condensed']  font-bold before:absolute before:-top-4 before:left-0 before:h-4 before:w-full before:content-['']">
                    <li>
                        <Link to="/profile" className="hover-theme-accent hover:bg-transparent">Profile</Link>
                    </li>
                    <li className="border-t border-gray-200 mt-1 pt-1">
                        <a onClick={handleLogout} className="hover-theme-accent hover:bg-transparent cursor-pointer">Logout</a>
                    </li>
                  </ul>
                </div>
              )}

              {/* Login Button */}
              {!user && (
                <Link 
                  to="/login" 
                  className="btn btn-sm bg-transparent border theme-border text-white hover-theme-accent-bg hover-theme-bg-text rounded-[4px] px-5 font-['Barlow_Condensed'] font-bold  tracking-wider hidden xl:inline-flex mr-2 transition-all duration-300"
                >
                  Login
                </Link>
              )}

              {/* CART BUTTON */}
              <button 
                onClick={openCart}
                className="btn btn-ghost btn-circle text-white hover-theme-accent mr-2 hidden xl:flex items-center justify-center transition-colors relative"
                title="View Cart"
              >
                <FaShoppingCart size={22} />
                {cartItems.length > 0 && (
                  <span className="absolute top-0 right-0 theme-accent-bg text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <Link to="/reservation" className="btn theme-accent-bg hover:bg-white hover-theme-bg-text text-white border-none rounded-[4px] px-7 font-['Barlow_Condensed'] font-bold  tracking-wider hidden xl:inline-flex transition-all duration-300">
                Reserve a Table
              </Link>

              {/* Mobile Menu Button */}
              <button className="btn btn-ghost lg:hidden text-2xl text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <FaBars />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 lg:hidden backdrop-blur-sm transition-all">
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm theme-bg text-white shadow-2xl p-6 border-l border-white/10">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-['Barlow_Condensed'] font-extrabold  italic tracking-wider">
                  <span className="text-white">Khabar</span><span className="theme-accent">Table</span>
               </h2>
               <button onClick={() => setIsMobileMenuOpen(false)} className="btn btn-circle btn-sm btn-ghost border border-white/20 hover-theme-accent-bg hover:text-white">✕</button>
            </div>
            
            <div className="flex flex-col gap-0 font-['Barlow_Condensed'] text-lg  tracking-wide">
              {user && (
                  <div className="flex items-center gap-4 border-b border-white/10 py-4 mb-2">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring theme-ring ring-offset-base-100 ring-offset-2">
                        <img src={getPhotoUrl(user.photoUrl)} alt="profile" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="theme-accent font-bold">{user.name}</span>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-xs text-gray-400 hover:text-white">View Profile</Link>
                    </div>
                  </div>
              )}

              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover-theme-accent transition-colors">Home</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover-theme-accent transition-colors">About</Link>
              <Link to="/menu-user" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover-theme-accent transition-colors">Menu</Link>
              
              <button 
                onClick={() => { openCart(); setIsMobileMenuOpen(false); }}
                className="border-b border-white/10 py-3 hover-theme-accent transition-colors flex items-center gap-2 text-left w-full  font-['Barlow_Condensed'] text-lg tracking-wide"
              >
                Cart <FaShoppingCart size={16} /> 
                {cartItems.length > 0 && <span className="theme-accent font-bold">({cartItems.length})</span>}
              </button>
              
              {user ? (
                 <button onClick={handleLogout} className="text-left border-b border-white/10 py-3 hover-theme-accent transition-colors theme-accent">Logout</button>
              ) : (
                 <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="border-b border-white/10 py-3 hover-theme-accent transition-colors theme-accent">Login</Link>
              )}

              <div className="mt-8">
                <Link to="/reservation" onClick={() => setIsMobileMenuOpen(false)} className="btn theme-accent-bg hover:bg-white hover:text-black text-white border-none w-full font-bold  rounded-[4px]">Reserve Table</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}