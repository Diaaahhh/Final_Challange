import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom"; // Added Navigate

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
import ViewAbout from "./Components/About/ViewAbout"; 

import WriteReview from "./Components/Review/WriteReview";
import ViewReview from './Components/Review/ViewReview';
import UploadHero from './Components/Hero/UploadHero';

// --- NEW COMPONENT: Admin Protection Guard ---
// This checks if the user is allowed to be here
const AdminGuard = ({ children }) => {
  // 1. Get user from LocalStorage (Assuming you saved it there during Login)
  const user = JSON.parse(localStorage.getItem("user"));

  // 2. If not logged in at all -> Go to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If User has Role 1 (Regular User) -> Go to Home (Access Denied)
  // Using '==' to catch both string "1" and number 1
  if (user.role == 1) {
    return <Navigate to="/" replace />;
  }

  // 4. If Logged in AND not Role 1 (must be Admin) -> Show the page
  return children;
};

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
            {/* Pass isHome={true} to show the preview version */}
            <ViewAbout isHome={true} />
            <WriteReview />
          </>
        } />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        
        {/* Full About Page */}
        <Route path="/about" element={<ViewAbout />} />

        {/* --- PROTECTED ADMIN ROUTES --- */}
        {/* We wrap the AdminLayout inside the AdminGuard */}
        <Route path="/admin" element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }>
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