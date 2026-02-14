import React from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";

// Import Components
import Navbar from "./Components/Header/Navbar";
import Hero from "./Components/Hero/Hero";
import Signup from "./Components/Authentication/Signup";
import Login from "./Components/Authentication/Login";
import Footer from "./Components/Footer/Footer";
import { CartProvider } from './Components/Cart/CartContext';
// Admin Imports
import AdminLayout from "./Components/Layout/AdminLayout";
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
import Cart from "./Components/Cart/Cart";
import Checkout from "./Components/Cart/Checkout";

// --- ADMIN PROTECTION GUARD ---
const AdminGuard = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role 1 is blocked from Admin, Role 0 is permitted
  if (user.role == 1) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- LANDING PAGE DECISION COMPONENT ---
const HomeDecision = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  // We use useEffect to handle the redirect safely
  React.useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");

    if (user && user.role == 0 && justLoggedIn) {
      // 1. Remove the flag immediately
      sessionStorage.removeItem("justLoggedIn");
      
      // 2. Redirect to admin
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // While the useEffect is checking, or if no redirect is needed, show home
  return (
    <>
      <Hero />
      <ViewAbout isHome={true} />
      <WriteReview />
    </>
  );
};

function App() {
  const location = useLocation();

  const isAuthPage = ["/signup", "/login"].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldHideNavbarFooter = isAuthPage || isAdminPage;

  return (
    <CartProvider>
      {!shouldHideNavbarFooter && <Navbar />}

      <Routes>
        {/* Role 0 redirected only on first entry after login, else allowed to view */}
        <Route path="/" element={<HomeDecision />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/about" element={<ViewAbout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/address"
          element={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <h1 className="text-3xl font-bold"><Address /></h1>
            </div>
          }
        />

        <Route
          path="/review"
          element={
            <div className="pt-24 pb-12 bg-base-200 min-h-screen">
              <WriteReview />
            </div>
          }
        />

        <Route
          path="/map"
          element={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <h1 className="text-3xl font-bold"><Map /></h1>
            </div>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="branch_list" element={<Branches />} />
          <Route path="menu-list" element={<MenuList />} />
          <Route path="reservation_view" element={<ReservationView />} />
          <Route path="write_about" element={<WriteAbout />} />
          <Route path="view_review" element={<ViewReview />} />
          <Route path="upload_hero" element={<UploadHero />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {!shouldHideNavbarFooter && <Footer />}
    </CartProvider>
  );
}

export default App;