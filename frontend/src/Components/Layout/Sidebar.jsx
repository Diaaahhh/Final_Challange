import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUtensils, FaListUl, FaBars, FaTimes, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  // Helper to check active link for styling
  const isActive = (path) => {
    return location.pathname === path 
      ? 'bg-[#C59D5F] text-white shadow-lg shadow-[#C59D5F]/20' 
      : 'text-gray-400 hover:bg-white/5 hover:text-[#C59D5F]';
  };

  return (
    <div className="flex h-screen font-['Inter'] relative z-50">
      
      {/* MOBILE OVERLAY (Closes sidebar when clicked on mobile) */}
      <div 
        className={`fixed inset-0 bg-black/50 lg:hidden transition-opacity z-30 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* MOBILE TOGGLE BUTTON (Visible only on small screens) */}
      <button 
        className={`absolute top-4 left-4 z-50 lg:hidden text-white bg-[#0E1014] p-2 rounded-md border border-white/20 shadow-xl transition-all ${isOpen ? 'translate-x-64' : 'translate-x-0'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* SIDEBAR CONTAINER */}
      <div 
        className={`
          ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'} 
          bg-[#0E1014] border-r border-white/10 transition-all duration-300 ease-in-out 
          flex flex-col fixed lg:relative h-full z-40
        `}
      >
        
        

        {/* 2. NAVIGATION LINKS */}
        <nav className="flex-1 py-8 flex flex-col gap-2 px-3 overflow-y-auto">
          
          <p className={`text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 px-4 ${!isOpen && 'lg:hidden'}`}>
         Admin Panel
          </p>

          {/* Create Menu Item */}
          <Link 
            to="/admin/create-menu" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/create-menu')}`}
          >
            <FaUtensils className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              Create Menu
            </span>
            
            {/* Tooltip for collapsed mode */}
            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                Create Menu
              </div>
            )}
          </Link>

          {/* Menu List Item */}
          <Link 
            to="/admin/menu-list" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/menu-list')}`}
          >
            <FaListUl className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              Menu List
            </span>

            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
                Menu List
              </div>
            )}
          </Link>

          {/* //reservation Management */}
          <Link 
            to="/admin/reservation_view" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/reservation_view')}`}
          >
            <FaListUl className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              View Reservation
            </span>

            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
              View Reservation
              </div>
            )}
          </Link>

           {/* //create about */}
          <Link 
            to="/admin/write_about" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/write_about')}`}
          >
            <FaListUl className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              Create About
            </span>

            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
               Create About
              </div>
            )}
          </Link>

           {/* //view review */}
          <Link 
            to="/admin/view_review" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/view_review')}`}
          >
            <FaListUl className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              View Review
            </span>

            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
               View Review
              </div>
            )}
          </Link>

  {/* Upload Hero*/}
          <Link 
            to="/admin/upload_hero" 
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive('/admin/upload_hero')}`}
          >
            <FaListUl className="text-lg min-w-[20px]" />
            <span className={`whitespace-nowrap font-medium tracking-wide ${!isOpen && 'lg:hidden'}`}>
              Upload Hero
            </span>

            {!isOpen && (
              <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10">
               Upload Hero
              </div>
            )}
          </Link>
        </nav>


      
      </div>
    </div>
  );
}