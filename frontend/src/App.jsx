import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Import Components
import Navbar from "./Components/Header/Navbar";
import Hero from "./Components/Hero/Hero";
import Signup from "./Components/Authentication/Signup";
import Login from "./Components/Authentication/Login";
import Footer from "./Components/Footer/Footer";

// Admin Imports
import AdminLayout from "./Components/Layout/AdminLayout";
import CreateMenu from "./Components/Menu/CreateMenu";
import MenuList from "./Components/Menu/MenuList";
import MenuUser from "./Components/Menu/MenuUser";

import Reservation from "./Components/Reservation/Reservation";
import ReservationView from "./Components/Reservation/ReservationView";

import WriteAbout from "./Components/About/WriteAbout";
import ViewAbout from "./Components/About/ViewAbout"; // Make sure this path is correct

import WriteReview from "./Components/Review/WriteReview";
import ViewReview from './Components/Review/ViewReview';

import UploadHero from './Components/Hero/UploadHero'
function App() {
  const location = useLocation();

  const isAuthPage = ["/signup", "/login"].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldHideNavbarFooter = isAuthPage || isAdminPage;

  return (
    <>
      {!shouldHideNavbarFooter && <Navbar />}

      <Routes>
        {/* --- MODIFIED HOME ROUTE --- */}
        <Route path="/" element={
          <>
            <Hero />
            {/* Pass isHome={true} to show the preview version (shorter text + button) */}
            <ViewAbout isHome={true} />
            <WriteReview />
          </>
        } />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        
        {/* Full About Page (No isHome prop, so it shows full text) */}
        <Route path="/about" element={<ViewAbout />} />


        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="create-menu" element={<CreateMenu />} />
          <Route path="menu-list" element={<MenuList />} />
          <Route path="reservation_view" element={<ReservationView />} />
          <Route path="write_about" element={<WriteAbout />} />
                    <Route path="view_review" element={<ViewReview />} />
                                        <Route path="upload_hero" element={<UploadHero />} />



        </Route>
      </Routes>

      {!shouldHideNavbarFooter && <Footer />}
    </>
  );
}

export default App;