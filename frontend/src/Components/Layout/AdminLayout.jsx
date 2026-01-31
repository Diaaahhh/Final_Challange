import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import Footer from './Footer'; 
import Navbar from './Navbar'; 

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#0E1014] text-white font-['Inter']">
      
      {/* 1. LEFT SIDE: Sidebar (Fixed) */}
      <Sidebar />

      {/* 2. RIGHT SIDE: Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* A. Admin Navbar */}
        <Navbar />

        {/* B. Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-[#1A1C21]">
          <Outlet />
        </main>

        {/* C. Admin Footer */}
        <Footer />
        
      </div>
    </div>
  );
}