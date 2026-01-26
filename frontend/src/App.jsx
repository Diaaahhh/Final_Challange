import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Import Components
import Navbar from './Components/Header/Navbar';
import Hero from './Components/Hero/Hero';
import Signup from './Components/Authentication/Signup';
import Login from './Components/Authentication/Login';
import Footer from './Components/Footer/Footer';

// Admin Imports
import AdminLayout from "./Components/Layout/AdminLayout"; 
// Make sure this path is correct! In previous steps we put it in 'Components/Admin/CreateMenu'
import CreateMenu from "./Components/Menu/CreateMenu"; 

function App() {
  const location = useLocation();

  // 1. Define which pages should NOT have the Public Navbar/Footer
  // We hide it on Signup, Login, AND any page starting with '/admin'
  const isAuthPage = ['/signup', '/login'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const shouldHideNavbarFooter = isAuthPage || isAdminPage;

  return (
    <> 
      {/* Hide Navbar on Signup, Login, and Admin pages */}
      {!shouldHideNavbarFooter && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
            {/* The URL will be /admin/create-menu */}
            <Route path="create-menu" element={<CreateMenu />} />
        </Route>
      </Routes>
   
      {/* Hide Footer on Signup, Login, and Admin pages */}
      {!shouldHideNavbarFooter && <Footer />}
    </>
  );
}

export default App;