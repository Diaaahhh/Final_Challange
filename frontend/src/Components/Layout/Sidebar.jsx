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
  FaStore,
  FaFolderPlus,
  FaTachometerAlt
} from "react-icons/fa";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const location = useLocation();

  // Helper to check active link for styling
  const isActive = (path) => {
    return location.pathname === path
      ? "bg-[#007BFF] text-white shadow-[0_0_20px_rgba(0,123,255,0.35)]"
      : "text-[#E0E0E0] hover:bg-[#1A1A1A] hover:text-[#007BFF]";
  };

  const menuItems = [
    // { path: "/admin/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { path: "/admin/menu-list", icon: FaListUl, label: "Menu List" },
    {
      path: "/admin/reservation_view",
      icon: FaCalendarAlt,
      label: "Reservations",
    },
    { path: "/admin/write_about", icon: FaPenNib, label: "Write About" },
    { path: "/admin/upload_hero", icon: FaImage, label: "Upload Banner" },
    { path: "/admin/settings", icon: FaCog, label: "Settings" },
    { path: "/admin/branch_list", icon: FaStore, label: "All Branches" },
    { path: "/admin/view_review", icon: FaComments, label: "Reviews" },
  ];

  return (
    <div className="flex h-screen font-['Arial_Black',_sans-serif] relative z-40">
      {/* SIDEBAR CONTAINER */}
      <div
        className={`${
          isOpen ? "w-72" : "w-0 lg:w-20"
        } bg-[#0A0A0A] border-r border-[#1E1E1E] transition-all duration-300 ease-in-out flex flex-col h-full overflow-hidden`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b border-[#1E1E1E] bg-[#111111]">
          <div
            className={`text-2xl  tracking-widest text-white ${
              !isOpen && "lg:hidden"
            }`}
          >
            <div className="navbar-start w-auto mr-0">
              <Link
                to="/"
                className="group flex flex-col items-center leading-none"
              >
                <h2 className="text-4xl  italic tracking-wider">
                  <span className="text-white group-hover:text-[#007BFF] transition-colors">
                    Khabar
                  </span>
                  <span className="text-[#C59D5F] group-hover:text-white transition-colors">
                    Table
                  </span>
                </h2>
                <p className="text-xs tracking-[0.4em] text-[#A0A0A0]  mt-1 group-hover:tracking-[0.5em] transition-all duration-300">
                  .com
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">

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
            </Link>
          ))}

          {/* PORTFOLIO DROPDOWN */}
          <div>
            <button
              onClick={() => setPortfolioOpen(!portfolioOpen)}
              className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left text-[#E0E0E0] hover:bg-[#1A1A1A] hover:text-[#007BFF] transition-all duration-300"
            >
              <FaFolderPlus className="text-xl min-w-[24px]" />
              <span
                className={`whitespace-nowrap text-sm tracking-wide ${
                  !isOpen && "lg:hidden"
                }`}
              >
                Portfolio
              </span>
            </button>

            {portfolioOpen && (
              <div className="ml-10 mt-1 flex flex-col gap-1">
                <Link
                  to="/admin/create_portfolio"
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${isActive(
                    "/admin/create_portfolio"
                  )}`}
                >
                  Create Portfolio
                </Link>
                <Link
                  to="/admin/view_portfolio"
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${isActive(
                    "/admin/view_portfolio"
                  )}`}
                >
                  View Portfolio
                </Link>
              </div>
              
            )}
          </div>

        </nav>
      </div>
    </div>
  );
}