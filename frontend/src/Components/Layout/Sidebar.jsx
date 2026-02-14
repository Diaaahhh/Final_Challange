import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaUtensils,
  FaListUl,
  FaBars,
  FaTimes,
  FaCalendarAlt,
  FaPenNib,
  FaComments,
  FaImage,
  FaCog,
  FaStore
} from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  // Helper to check active link for styling
  const isActive = (path) => {
    return location.pathname === path
      ? "bg-[#C59D5F] text-[#0E1014] font-bold shadow-[0_0_15px_rgba(197,157,95,0.3)]"
      : "text-gray-400 hover:bg-white/5 hover:text-[#C59D5F]";
  };

  const menuItems = [
        { path: "/admin/branch_list", icon: FaStore, label: "All Stores" },

    // { path: "/admin/create-menu", icon: FaUtensils, label: "Create Menu" },
    { path: "/admin/menu-list", icon: FaListUl, label: "Menu List" },
    { path: "/admin/reservation_view", icon: FaCalendarAlt, label: "Reservations"},
    { path: "/admin/write_about", icon: FaPenNib, label: "Write About" },
    { path: "/admin/view_review", icon: FaComments, label: "Reviews" },
    { path: "/admin/upload_hero", icon: FaImage, label: "Upload Hero" },
    { path: "/admin/settings", icon: FaCog, label: "Settings" },
  ];

return (
    <div className="flex h-screen font-['Inter'] relative z-40">
      {/* SIDEBAR CONTAINER - Changed to bg-[#F1F5F9] and border-[#E2E8F0] */}
      <div className={`${isOpen ? "w-72" : "w-0 lg:w-20"} bg-[#F1F5F9] border-r border-[#E2E8F0] transition-all duration-300 ease-in-out flex flex-col h-full overflow-hidden`}>
        
        {/* Header - Changed to bg-[#E2E8F0] */}
        <div className="h-20 flex items-center justify-center border-b border-[#E2E8F0] bg-[#E2E8F0]">
          <h2 className={`font-['Barlow_Condensed'] font-bold text-2xl uppercase tracking-widest text-[#1E293B] ${!isOpen && "lg:hidden"}`}>
            {/* LOGO */}
<div className="navbar-start w-auto mr-0">
  <Link to="/" className="group flex flex-col items-center leading-none">
    <h2 className="text-4xl font-['Barlow_Condensed'] font-extrabold uppercase italic tracking-wider">
      {/* Changed text-white to text-[#1E293B] and hover to gold */}
      <span className="text-[#1E293B] group-hover:text-[#C59D5F] transition-colors">
        Khabar
      </span>
      {/* Kept gold, but added a hover state to dark charcoal */}
      <span className="text-[#C59D5F] group-hover:text-[#1E293B] transition-colors">
        Table
      </span>
    </h2>
    <p className="text-xs font-['Inter'] tracking-[0.4em] text-gray-500 uppercase mt-1 group-hover:tracking-[0.5em] transition-all duration-300">
      .com
    </p>
  </Link>
</div>
          </h2>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive(item.path)}`}>
              <item.icon className="text-xl min-w-[24px]" />
              <span className={`whitespace-nowrap text-sm tracking-wide ${!isOpen && "lg:hidden"}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
