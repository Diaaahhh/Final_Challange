import React, { useEffect, useState } from "react";
import {
  FaUtensils,
  FaCoffee,
  FaImage,
  FaPlus,
  FaMinus,
  FaStore,
  FaCartPlus,
  FaArrowLeft,
} from "react-icons/fa";
import { useCart } from "../Cart/CartContext";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

// --- SUB-COMPONENT: Individual Menu Item Card ---
const MenuItemCard = ({ item, branchId, branchName }) => {
  const { handleAddToCart, setIsCartOpen, cartItems } = useCart();

  const [localQty, setLocalQty] = useState(0);
  
  const handleQtyChange = (value) => {
    const newQty = Number(value);
    if (isNaN(newQty) || newQty < 0) return;
    const diff = newQty - localQty;
    setLocalQty(newQty);
    if (diff !== 0) {
      handleAddToCart(item, diff, branchId, branchName);
    }
  };

  useEffect(() => {
    const cartItem = cartItems.find(
      (c) => String(c.m_menu_sl) === String(item.m_menu_sl)
    );
    if (cartItem) {
      setLocalQty(cartItem.quantity);
    } else {
      setLocalQty(0);
    }
  }, [cartItems, item.m_menu_sl]);

  const increment = () => {
    setLocalQty((prev) => prev + 1);
    handleAddToCart(item, 1, branchId, branchName);
  };

  const decrement = () => {
    if (localQty > 0) {
      setLocalQty((prev) => prev - 1);
      handleAddToCart(item, -1, branchId, branchName);
    }
  };

  const onAddToCart = () => {
    let qtyToAdd = localQty;
    if (localQty === 0) {
      qtyToAdd = 1;
      setLocalQty(1);
    }
    handleAddToCart(item, qtyToAdd, branchId, branchName);
    if (setIsCartOpen) setIsCartOpen(true);
  };

  const isActive = Number(item.m_status) === 1;

  // --- DISCOUNT JSON PARSING & MATH ---
  const basePrice = Number(item.m_price) || 0;
  let discPerc = 0;
  try {
    const d = item.discount ? JSON.parse(item.discount) : {};
    discPerc = Number(d[branchId]) || 0;
  } catch (e) {
    discPerc = 0;
  }
  const effectivePrice = basePrice - basePrice * (discPerc / 100);

  const formatDescription = (rawInput) => {
    if (!rawInput) return "No description available.";
    if (Array.isArray(rawInput)) return rawInput.join(", ");
    const strVal = String(rawInput);
    try {
      const parsed = JSON.parse(strVal);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return strVal;
    } catch (e) {
      return strVal.replace(/[\[\]"]/g, "").replace(/,/g, ", ");
    }
  };

  return (
    <div
      className={`group bg-white rounded-xl shadow-sm transition-all duration-300 border border-gray-100 flex p-4 gap-4 items-start relative
      ${
        !isActive
          ? "opacity-60 grayscale bg-gray-50 pointer-events-none"
          : "hover:shadow-md"
      }`}
    >
      {/* RED DISCOUNT BADGE */}
      {discPerc > 0 && (
        <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10 animate-pulse">
          {discPerc}% OFF
        </div>
      )}

      {/* Image Section */}
      <div className="w-[85px] h-[85px] shrink-0 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        {item.m_image ? (
          <img
            src={`${IMAGE_BASE_URL}/${item.m_image}`}
            alt={item.m_menu_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FaImage />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col min-h-[85px]">
        {/* Top Row: Name & Price */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-gray-800 line-clamp-1">
              {item.m_menu_name}
            </h3>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block mb-1">
              #{item.m_menu_sl}
            </span>
          </div>

          {/* DYNAMIC PRICING DISPLAY */}
          <div className="flex flex-col items-end ml-2">
            {discPerc > 0 ? (
              <>
                <span className="text-[10px] text-gray-400 line-through">
                  {basePrice.toLocaleString()} Tk
                </span>
                <span className="text-base font-bold theme-accent whitespace-nowrap">
                  {effectivePrice.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-gray-500">Tk</span>
                </span>
              </>
            ) : (
              <span className="text-base font-bold theme-accent whitespace-nowrap">
                {basePrice.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-500">Tk</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle Row: Description */}
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">
          {formatDescription(item.m_ingredient)}
        </p>

        {/* Bottom Row: Actions */}
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-gray-100 pt-3">
          {!isActive && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              <span className="text-[10px]  font-bold text-gray-400">
                Out of Stock
              </span>
            </div>
          )}

          {isActive && (
            <div className="flex items-center gap-3 w-full">
              {localQty === 0 ? (
                <button
                  onClick={onAddToCart}
                  className="flex-1 h-8 rounded-lg font-bold text-xs  tracking-wider transition-opacity hover:opacity-90 flex items-center justify-center gap-2 shadow-sm theme-accent-bg text-white cursor-pointer"
                >
                  Add <FaCartPlus size={12} />
                </button>
              ) : (
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8">
                  <button
                    onClick={decrement}
                    className="px-2 h-full text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors flex items-center justify-center"
                  >
                    <FaMinus size={8} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-10 text-center font-bold text-sm text-gray-800 bg-transparent outline-none"
                  />
                  <button
                    onClick={increment}
                    className="px-2 h-full text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors flex items-center justify-center"
                  >
                    <FaPlus size={8} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MenuUser() {
  const navigate = useNavigate();

  const [allCategories, setAllCategories] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeCategory, setActiveCategory] = useState({
    id: "All",
    menu_name: "All Items",
  });
  
  const [loading, setLoading] = useState(true);
  const [isBranchForced, setIsBranchForced] = useState(false); // NEW: Tracks if DB is forcing a branch

  const CACHE_KEY = "user_selected_branch";
  const CACHE_DURATION = 60 * 60 * 1000;

  const getCachedBranch = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { branchId, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) return branchId;
        else localStorage.removeItem(CACHE_KEY);
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    return null;
  };

  const initialBranch = getCachedBranch();
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [showBranchModal, setShowBranchModal] = useState(!initialBranch);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // NEW: Fetching settings simultaneously with branches and menu items
        const [branchRes, itemRes, settingsRes] = await Promise.all([
          api.get("/menu_user/branches"),
          api.get("/menu_user/list"),
          api.get("/settings") 
        ]);

        let branchList = [];
        let isSingleBranch = false;

        // 1. DETECT IF IT'S A SINGLE BRANCH (Object instead of Array)
        if (branchRes.data?.type === "branch" || branchRes.data?.message === "Branch found") {
          isSingleBranch = true;
          branchList = [branchRes.data.data]; 
        } 
        // 2. DETECT IF IT'S MULTIPLE BRANCHES
        else if (Array.isArray(branchRes.data)) {
          branchList = branchRes.data;
        } else if (Array.isArray(branchRes.data?.data)) {
          branchList = branchRes.data.data;
        }

        const formattedBranches = branchList.map((b) => ({
          ...b,
          branch_id: b.branch_id ?? b.id,
        }));
        
        setBranches(formattedBranches);
        setAllMenuItems(Array.isArray(itemRes.data) ? itemRes.data : []);
        console.log("BRANCHES:", formattedBranches);
console.log("MENU ITEMS:", itemRes.data);

        // --- NEW LOGIC: DB OVERRIDE CHECK ---
        const dbBranchId = settingsRes.data?.branch_id;

        if (dbBranchId) {
          // If branch_id exists in the database settings, override EVERYTHING
          setSelectedBranch(String(dbBranchId));
          setShowBranchModal(false);
          setIsBranchForced(true); // Used to hide the "Choose another branch" button
        } else {
  setIsBranchForced(false);

  const cachedBranch = getCachedBranch();

  // Single branch company
  if (isSingleBranch && formattedBranches.length > 0) {
    const singleBranchId = String(
      formattedBranches[0].branch_id
    );

    setSelectedBranch(singleBranchId);
    setShowBranchModal(false);

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        branchId: singleBranchId,
        timestamp: Date.now(),
      })
    );
  }

  // Cached branch exists
  else if (cachedBranch) {

    const branchExists = formattedBranches.some(
      (branch) =>
        String(branch.branch_id) ===
        String(cachedBranch)
    );

    if (branchExists) {

      setSelectedBranch(
        String(cachedBranch)
      );

      setShowBranchModal(false);

    } else {

      // Cached branch belongs to another company
      localStorage.removeItem(
        CACHE_KEY
      );

      // Auto select first branch if available
      if (formattedBranches.length > 0) {

        const firstBranchId = String(
          formattedBranches[0].branch_id
        );

        setSelectedBranch(
          firstBranchId
        );

        setShowBranchModal(false);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            branchId: firstBranchId,
            timestamp: Date.now(),
          })
        );

      } else {

        setSelectedBranch(null);
        setShowBranchModal(true);

      }
    }
  }

  // No cached branch
  else {

    if (formattedBranches.length === 1) {

      const firstBranchId = String(
        formattedBranches[0].branch_id
      );

      setSelectedBranch(
        firstBranchId
      );

      setShowBranchModal(false);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          branchId: firstBranchId,
          timestamp: Date.now(),
        })
      );

    } else {

      setShowBranchModal(true);

    }
  }
}
        
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

useEffect(() => {
    if (!selectedBranch) return;
    const fetchCategoriesForBranch = async () => {
      try {
        const catRes = await api.get(`/menu_user/categories/${selectedBranch}`);
        const rawCategories = Array.isArray(catRes.data) ? catRes.data : [];
        
        // Normalize the category object so it ALWAYS has an 'id' property
        const formattedCategories = rawCategories.map((cat) => ({
          ...cat,
          id: cat.id ?? cat.category_id ?? cat.m_category_id, 
        }));

        setAllCategories(formattedCategories);
        console.log("CATEGORIES:", formattedCategories);
      } catch (err) {
        console.error("Error fetching categories for branch:", err);
        setAllCategories([]);
      }
    };
    fetchCategoriesForBranch();
  }, [selectedBranch]);

  const filteredItems = allMenuItems.filter((item) => {
    const branchArray = String(item.m_branch_id || "").split("-");
    const matchesBranch =
      String(item.m_branch_id) === String(selectedBranch) ||
      branchArray.includes(String(selectedBranch));
    const matchesCategory =
      activeCategory.id === "All" ||
      String(item.category_id) === String(activeCategory.id);
    return matchesBranch && matchesCategory;
  });

  const handleBranchSelect = (branchId) => {
    setSelectedBranch(branchId);
    setActiveCategory({ id: "All", menu_name: "All Items" });
    setShowBranchModal(false);
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ branchId: branchId, timestamp: Date.now() })
    );
  };

  const currentBranchName =
    branches.find((b) => String(b.branch_id) === String(selectedBranch))
      ?.branch_name || "Unknown Branch";
console.log("selectedBranch =", selectedBranch);
console.log("activeCategory =", activeCategory);
console.log("filteredItems =", filteredItems);
  return (
    <div 
      className="min-h-screen p-4 md:p-8 font-sans relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }} // Dynamically pulled from theme
    >
      {/* --- BRANCH SELECTION MODAL --- */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] ${
              branches.length > 5 ? "max-w-2xl" : "max-w-md"
            }`}
          >
            {/* Modal Header dynamically themed */}
            <div className="p-6 text-center border-b border-gray-800 relative shrink-0 theme-bg">
              <button
                onClick={() => navigate(-1)}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                title="Go Back"
              >
                <FaArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-['Barlow_Condensed'] font-bold text-white  tracking-wider">
                Select A <span className="theme-accent">Branch</span>
              </h2>
              <p className="text-gray-400 text-xs mt-2">
                Choose a location to view the menu
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="loading loading-spinner theme-accent loading-lg"></span>
                  <p className="text-gray-500 text-sm mt-3 font-bold">
                    Loading Locations...
                  </p>
                </div>
              ) : branches.length > 0 ? (
                <div
                  className={`grid gap-3 ${
                    branches.length > 5 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch.branch_id)}
                      className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#C59D5F] hover:bg-amber-50 transition-all duration-200 text-left h-full"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:theme-accent-bg transition-colors shrink-0">
                          <FaStore className="text-gray-500 group-hover:text-white" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-gray-800 hover-theme-accent text-lg truncate">
                            {branch.branch_name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {branch.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-300 hover-theme-accent text-xl ml-2 shrink-0">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No branches available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN MENU CONTENT --- */}
      <div
        className={`max-w-7xl mx-auto transition-opacity duration-500 ${
          showBranchModal ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
        }`}
      >
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <FaStore className="theme-accent" />
            <span className="text-gray-500 text-sm">Viewing Menu For:</span>
            <span className="font-bold text-gray-800 ">
              {currentBranchName}
            </span>
          </div>
          
          {/* ONLY show 'Choose another branch' if DB hasn't locked the branch AND multiple branches exist */}
          {!isBranchForced && branches.length > 1 && (
            <button
              onClick={() => setShowBranchModal(true)}
              className="text-sm font-bold border-b-2 transition-all duration-300  tracking-wider pb-1"
              style={{ color: 'var(--theme-navbar)', borderColor: 'var(--theme-navbar)' }}
            >
              Choose another branch
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR (Categories) */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
              {/* Dynamic Theme Category Header */}
              <div className="p-6 text-white theme-bg">
                <h2 className="text-xl font-bold flex items-center gap-2 theme-accent">
                  <FaUtensils /> Categories
                </h2>
              </div>
              <div className="flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar">
                <button
                  onClick={() =>
                    setActiveCategory({ id: "All", menu_name: "All Items" })
                  }
                  className={`text-left px-6 py-4 transition-all duration-300 border-b border-gray-100 last:border-0 flex items-center justify-between group ${
                    activeCategory.id === "All"
                      ? "bg-amber-50 text-gray-900 border-l-4 theme-border font-bold shadow-inner"
                      : "text-gray-600 hover:bg-gray-50 hover:pl-8 border-l-4 border-l-transparent"
                  }`}
                >
                  <span className="text-sm  tracking-wider">
                    All Items
                  </span>
                </button>

                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-left px-6 py-4 transition-all duration-300 border-b border-gray-100 last:border-0 flex items-center justify-between group ${
                      activeCategory.id === cat.id
                        ? "bg-amber-50 text-gray-900 border-l-4 theme-border font-bold shadow-inner"
                        : "text-gray-600 hover:bg-gray-50 hover:pl-8 border-l-4 border-l-transparent"
                    }`}
                  >
                    <span className="text-sm  tracking-wider">
                      {cat.menu_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT (Items) */}
          <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6">
            <div className="animate-fade-in-up">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900  tracking-tight">
                    {activeCategory.menu_name}
                  </h1>
                  <span className="theme-accent font-serif italic text-sm">
                    Delicious Selections
                  </span>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                  {filteredItems.length} Items
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-2 text-center py-20 flex flex-col items-center">
                    <span className="loading loading-spinner theme-accent loading-lg"></span>
                  </div>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      branchId={selectedBranch}
                      branchName={currentBranchName}
                    />
                  ))
                ) : (
                  <div className="col-span-2 p-10 text-center bg-white rounded-xl border border-gray-100">
                    <FaCoffee className="text-4xl mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 font-bold tracking-wide">
                      No items found in this category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}