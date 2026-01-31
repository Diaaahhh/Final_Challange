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
import ViewReview from "./Components/Review/ViewReview";
import UploadHero from "./Components/Hero/UploadHero";

import Address from "./Components/Contact/Address";

import Map from "./Components/Contact/Map";

import Profile from "./Components/Profile/Profile";

import Settings from "./Components/Settings/Settings"
import Branches from "./Components/Branches/Branches";


// --- ADMIN PROTECTION GUARD ---
const AdminGuard = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role == 1) {
    return <Navigate to="/" replace />;
  }

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
        {/* --- PUBLIC HOME ROUTE --- */}
        <Route
          path="/"
          element={
            <>
              <Hero />
              <ViewAbout isHome={true} />
              <WriteReview />
            </>
          }
        />

        {/* --- PUBLIC MENU & AUTH --- */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/about" element={<ViewAbout />} />
        <Route path="/profile" element={<Profile />} />

        {/* --- DROPDOWN ROUTES (CONTACT) --- */}
        {/* 1. Address Page */}
        <Route
          path="/address"
          element={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <h1 className="text-3xl font-bold">
                <Address />
              </h1>
              {/* Replace this div with your <Address /> component later */}
            </div>
          }
        />

        {/* 2. Feedback Page (Reusing WriteReview) */}
        <Route
          path="/review"
          element={
            <div className="pt-24 pb-12 bg-base-200 min-h-screen">
              <WriteReview />
            </div>
          }
        />

        {/* 3. Map Page */}
        <Route
          path="/map"
          element={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <h1 className="text-3xl font-bold">
                <Map />
              </h1>
              {/* Replace this div with your <Map /> component later */}
            </div>
          }
        />

        {/* --- PROTECTED ADMIN ROUTES --- */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
                    <Route path="branch_list" element={<Branches />} />

          <Route path="create-menu" element={<CreateMenu />} />
          <Route path="menu-list" element={<MenuList />} />
          <Route path="reservation_view" element={<ReservationView />} />
          <Route path="write_about" element={<WriteAbout />} />
          <Route path="view_review" element={<ViewReview />} />
          <Route path="upload_hero" element={<UploadHero />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {!shouldHideNavbarFooter && <Footer />}
    </>
  );
}

export default App;
