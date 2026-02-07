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
      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 bg-black/50 lg:hidden transition-opacity z-30 ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* TOGGLE BUTTON */}
      <button
        className={`absolute top-4 -right-12 z-50 bg-[#C59D5F] text-black p-2 rounded-r-md shadow-xl transition-all hover:bg-white`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* SIDEBAR CONTAINER */}
      <div
        className={`
          ${isOpen ? "w-72" : "w-0 lg:w-20"} 
          bg-[#0E1014] border-r border-white/5 transition-all duration-300 ease-in-out 
          flex flex-col h-full overflow-hidden
        `}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/5 bg-[#1A1C21]">
          <h2
            className={`font-['Barlow_Condensed'] font-bold text-2xl uppercase tracking-widest text-[#C59D5F] ${
              !isOpen && "lg:hidden"
            }`}
          >
            Admin Panel
          </h2>
          {!isOpen && (
            <span className="text-[#C59D5F] font-bold text-xl hidden lg:block">
              AP
            </span>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative ${isActive(
                item.path
              )}`}
            >
              <item.icon className="text-xl min-w-[24px]" />
              <span
                className={`whitespace-nowrap text-sm tracking-wide ${
                  !isOpen && "lg:hidden"
                }`}
              >
                {item.label}
              </span>

              {/* Tooltip */}
              {!isOpen && (
                <div className="absolute left-16 bg-[#C59D5F] text-black text-xs font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
