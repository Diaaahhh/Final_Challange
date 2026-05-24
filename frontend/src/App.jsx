import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import api from "./api"; // <--- Ensure API is imported for fetching the theme

// Import Components
import Navbar from "./Components/Header/Navbar";
import Hero from "./Components/Hero/Hero";
import Signup from "./Components/Authentication/Signup";
import Login from "./Components/Authentication/Login";
import Footer from "./Components/Footer/Footer";
import { CartProvider } from "./Components/Cart/CartContext";
import CartSidebar from "./Components/Cart/CartSidebar";

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
import Settings from "./Components/Settings/Settings";
import Branches from "./Components/Branches/Branches";
import Cart from "./Components/Cart/Cart";
import Checkout from "./Components/Cart/Checkout";
import TableLayout from "./Components/Table/TableLayout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./Components/Layout/Dashboard";
import BranchUser from "./Components/Contact/BranchUser";
import CreatePortfolio from "./Components/Portfolio/CreatePortfolio";
import PortfolioUser from "./Components/Portfolio/PortfolioUser";
import ViewPortfolio from "./Components/Portfolio/ViewPortfolio";
import UploadLogo from "./Components/Header/UploadLogo";

// --- DYNAMIC THEME DICTIONARY ---
export const themes = {
  1: {
    navbar: "#0E1014",
    body: "#F3F4F7",
    footer: "#0E1014",
    accent: "#C59D5F",
  }, // Dark & Gold (Your Default)
  2: {
    navbar: "#1E3A8A",
    body: "#f2e9e1",
    footer: "#1E3A8A",
    accent: "#FBBF24",
  }, // Blue & Yellow
  3: {
    navbar: "#064E3B",
    body: "#ECFDF5",
    footer: "#064E3B",
    accent: "#34D399",
  }, // Green & Mint
  4: {
    navbar: "#7F1100",
    body: "#f2e9e1",
    footer: "#02332D",
    accent: "#BF9861",
  }, // Green & Mint
  5: {
    navbar: "#ae341e",
    body: "#EFD9C7",
    footer: "#a36546",
    accent: "#F1BD78",
  }, // Green & Mint
  6: {
    navbar: "#6a4162",
    body: "#fefafa",
    footer: "#f6d2d6",
    accent: "#d46a92",
  }, // Green & Mint
};

// --- ADMIN PROTECTION GUARD ---
const AdminGuard = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return <Navigate to="/" replace />;
  if (user.role == 1) return <Navigate to="/" replace />;
  return children;
};

// --- LANDING PAGE DECISION COMPONENT ---
const HomeDecision = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  React.useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (user && user.role == 0 && justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn");
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

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
  const isAdminPage = location.pathname.startsWith("/admin");
  const shouldHideNavbarFooter = isAdminPage;

  // --- THEME STATE & FETCH LOGIC ---
  const [currentTheme, setCurrentTheme] = useState(themes[1]); // Default theme

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        // Fetch theme_id from your new settings API endpoint
        const res = await api.get("/settings/get-theme");
        if (res.data && res.data.theme_id && themes[res.data.theme_id]) {
          setCurrentTheme(themes[res.data.theme_id]);
        }
      } catch (error) {
        console.error("Failed to fetch theme, using default");
      }
    };
    fetchTheme();
  }, []);

  // --- INJECT CSS VARIABLES GLOBALLY ---
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-navbar",
      currentTheme.navbar
    );
    document.documentElement.style.setProperty(
      "--theme-body",
      currentTheme.body
    );
    document.documentElement.style.setProperty(
      "--theme-footer",
      currentTheme.footer
    );
    document.documentElement.style.setProperty(
      "--theme-accent",
      currentTheme.accent
    );
    document.body.style.backgroundColor = currentTheme.body;
  }, [currentTheme]);

  return (
    <CartProvider>
      {/* GLOBAL THEME UTILITY CLASSES */}
      <style>{`
        .theme-bg { background-color: var(--theme-navbar) !important; }
        .theme-accent { color: var(--theme-accent) !important; }
        .theme-accent-bg { background-color: var(--theme-accent) !important; }
        .theme-border { border-color: var(--theme-accent) !important; }
        .theme-ring { --tw-ring-color: var(--theme-accent) !important; }
        .theme-ring-offset { --tw-ring-offset-color: var(--theme-navbar) !important; }
        
        .hover-theme-accent:hover { color: var(--theme-accent) !important; }
        .hover-theme-accent-bg:hover { background-color: var(--theme-accent) !important; }
        .hover-theme-bg-text:hover { color: var(--theme-navbar) !important; }
      `}</style>

      {!shouldHideNavbarFooter && <Navbar />}

      <CartSidebar />
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<HomeDecision />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu-user" element={<MenuUser />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/about" element={<ViewAbout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/portfolio_user" element={<PortfolioUser />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/address"
          element={
            <div className="min-h-screen flex items-center justify-center pt-20">
              <h1 className="text-3xl font-bold">
                <Address />
              </h1>
            </div>
          }
        />
        <Route
          path="/branch_user"
          element={
            <div className="bg-base-200 min-h-screen">
              <BranchUser />
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
              <h1 className="text-3xl font-bold">
                <Map />
              </h1>
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
          <Route path="upload_logo" element={<UploadLogo />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create_portfolio" element={<CreatePortfolio />} />
          <Route path="branch_list" element={<Branches />} />
          <Route path="menu-list" element={<MenuList />} />
          <Route path="reservation_view" element={<ReservationView />} />
          <Route path="write_about" element={<WriteAbout />} />
          <Route path="view_review" element={<ViewReview />} />
          <Route path="upload_hero" element={<UploadHero />} />
          <Route path="settings" element={<Settings />} />
          <Route path="view_portfolio" element={<ViewPortfolio />} />
          <Route path="table" element={<TableLayout />} />
        </Route>
      </Routes>

      {!shouldHideNavbarFooter && <Footer />}
    </CartProvider>
  );
}

export default App;
