import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom"; 

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

// --- UPDATED COMPONENT: Admin Protection Guard ---
const AdminGuard = ({ children }) => {
  // 1. Get user from LocalStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // 2. SCENARIO A: User is NOT logged in.
  // Requirement: Redirect to "/" (Home).
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. SCENARIO B: User IS logged in, but Role is 1 (Regular Customer).
  // Requirement: Redirect to "/" (Home).
  if (user.role == 1) {
    return <Navigate to="/" replace />;
  }

  // 4. SCENARIO C: User is logged in AND is Admin (Role 0 or other).
  // Requirement: Allow access to the Admin Panel.
  return children;
};

function App() {
  const location = useLocation();

  const isAuthPage = ["/signup", "/login"].includes(location.pathname);
  // Admin page check ensures navbar hides on admin panel
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldHideNavbarFooter = isAuthPage || isAdminPage;

  return (
    <>
      {!shouldHideNavbarFooter && <Navbar />}

      <Routes>
        {/* --- PUBLIC HOME ROUTE --- */}
        {/* Anyone can visit this because it is NOT wrapped in AdminGuard */}
        <Route path="/" element={
          <>
            <Hero />
            <ViewAbout isHome={true} />
            <WriteReview />
          </>
        } />

        {/* Public Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/about" element={<ViewAbout />} />

        {/* --- PROTECTED ADMIN ROUTES --- */}
        {/* If someone adds "/admin" to the URL:
            1. AdminGuard runs.
            2. Checks if logged in? No -> Redirect to "/".
            3. Checks if Role 1? Yes -> Redirect to "/".
            4. If Admin -> Shows AdminLayout.
        */}
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