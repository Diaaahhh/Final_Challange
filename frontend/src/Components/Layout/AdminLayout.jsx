// src/Components/Layout/AdminLayout.jsx (Check your path!)
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import Footer from './Footer'; // Make sure you created this file
import Navbar from './Navbar'; // Make sure you created this file

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. LEFT SIDE: Sidebar (Fixed) */}
      <Sidebar />

      {/* 2. RIGHT SIDE: Wrapper for Nav, Content, Footer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* A. Admin Navbar (Stays at the top) */}
        <Navbar />

        {/* B. Main Content (Scrollable Area) */}
        {/* 'flex-1' makes it take up all remaining space between Nav and Footer */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
          <Outlet />
        </main>

        {/* C. Admin Footer (Stays at the bottom) */}
        <Footer />
        
      </div>
    </div>
  );
}