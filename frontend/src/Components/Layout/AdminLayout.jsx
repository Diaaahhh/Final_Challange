import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import Footer from './Footer'; 
import Navbar from './Navbar'; 

export default function AdminLayout() {
  return (
    /* Changed bg-[#0E1014] to bg-[#F8FAFC] (Ghost White) and text-white to text-[#1E293B] (Dark Charcoal) */
    <div className="flex h-screen bg-[#F8FAFC] text-[#1E293B] font-['Inter']">
      
      {/* 1. LEFT SIDE: Sidebar (Fixed) */}
      <Sidebar />

      {/* 2. RIGHT SIDE: Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* A. Admin Navbar */}
        <Navbar />

        {/* B. Main Content */}
        {/* Changed bg-[#1A1C21] to bg-[#FFFFFF] (Pure White) for the content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-[#ffffff]">
          <Outlet />
        </main>

        {/* C. Admin Footer */}
        <Footer />
        
      </div>
    </div>
  );
}