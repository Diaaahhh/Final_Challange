import React, { useEffect, useState } from "react";
import { FaUtensils, FaCoffee, FaImage, FaPlus, FaMinus, FaStore, FaCartPlus } from "react-icons/fa";
import { useCart } from "../Cart/CartContext";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";

// --- SUB-COMPONENT: Individual Menu Item Card ---
const MenuItemCard = ({ item, branchId, branchName }) => {
  // Destructure handlers
  const { handleAddToCart, setIsCartOpen } = useCart();
  
  // 1. Local state initialized to 0
  const [localQty, setLocalQty] = useState(0);

  // 2. Handlers for local +/-
  const increment = () => setLocalQty(prev => prev + 1);
  const decrement = () => setLocalQty(prev => (prev > 0 ? prev - 1 : 0));

  // 3. "Add to Cart" Handler
  const onAddToCart = () => {
    if (localQty > 0) {
      // Pass branchName to context so it can be shown in sidebar
      handleAddToCart(item, localQty, branchId, branchName);
      
      // Reset local counter to 0 after adding
      setLocalQty(0); 
      
      // Open Sidebar
      if (setIsCartOpen) {
        setIsCartOpen(true);
      }
    }
  };

  const isActive = Number(item.m_status) === 1;
  const isAddDisabled = localQty === 0;

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
    <div className={`group bg-white rounded-xl shadow-sm transition-all duration-300 border border-gray-100 flex p-4 gap-4 items-start relative
      ${!isActive ? "opacity-60 grayscale bg-gray-50 pointer-events-none" : "hover:shadow-md"}`}>
      
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
          <span className="text-base font-bold text-amber-600 whitespace-nowrap ml-2">
            {Number(item.m_price).toLocaleString()} <span className="text-xs font-normal text-gray-500">Tk</span>
          </span>
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
                <span className="text-[10px] uppercase font-bold text-gray-400">Out of Stock</span>
             </div>
          )}

          {isActive && (
            <div className="flex items-center gap-3 w-full">
              
              {/* Local Quantity Selector */}
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-8">
                <button 
                  onClick={decrement}
                  disabled={localQty === 0}
                  className={`px-2 h-full rounded-l-lg transition-colors flex items-center justify-center
                    ${localQty === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <FaMinus size={8} />
                </button>
                <span className={`w-6 text-center font-bold text-sm ${localQty === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
                    {localQty}
                </span>
                <button 
                  onClick={increment}
                  className="px-2 h-full text-gray-600 hover:bg-gray-200 rounded-r-lg transition-colors flex items-center justify-center"
                >
                  <FaPlus size={8} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={onAddToCart}
                disabled={isAddDisabled}
                className={`flex-1 h-8 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm
                  ${isAddDisabled 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "bg-[#C59D5F] hover:bg-[#0E1014] text-white cursor-pointer" 
                  }`}
              >
                Add <FaCartPlus size={12} />
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default function MenuUser() {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const CACHE_KEY = 'user_selected_branch';
  const CACHE_DURATION = 60 * 60 * 1000; 

  const getCachedBranch = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { branchId, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return branchId;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
    return null;
  };

  const initialBranch = getCachedBranch();
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [showBranchModal, setShowBranchModal] = useState(!initialBranch);

  // 1. Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branchRes = await api.get("/menu-user/branches");
        setBranches(branchRes.data);
      } catch (err) {
        console.error("Error loading branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // 2. Fetch Categories
  useEffect(() => {
    if (!selectedBranch) return;
    
    const fetchCategories = async () => {
      try {
        const res = await api.get(`/menu-user/categories/${selectedBranch}`);
        setCategories(res.data);
        if (res.data.length > 0) {
          handleCategoryClick(res.data[0]);
        } else {
          setMenuItems([]);
          setActiveCategory(null);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, [selectedBranch]);

  const handleCategoryClick = async (category) => {
    setActiveCategory(category);
    setLoading(true);
    try {
      const res = await api.get(
        `/menu-user/items/${selectedBranch}/${category.id}`,
      );
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error loading items:", err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchId) => {
    setSelectedBranch(branchId);
    setShowBranchModal(false); 
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      branchId: branchId,
      timestamp: Date.now()
    }));
  };

  // Helper to get branch name for the card prop
  const currentBranchName = branches.find(b => b.branch_id === selectedBranch)?.branch_name || "Unknown Branch";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans relative">
      
      {/* --- BRANCH SELECTION MODAL --- */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0E1014] p-6 text-center border-b border-gray-800">
              <h2 className="text-2xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">
                Select A <span className="text-[#C59D5F]">Branch</span>
              </h2>
              <p className="text-gray-400 text-xs mt-2">Choose a location to view the menu</p>
            </div>
            
            <div className="p-6">
              {loadingBranches ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="loading loading-spinner text-[#C59D5F] loading-lg"></span>
                  <p className="text-gray-500 text-sm mt-3 font-bold">Loading Locations...</p>
                </div>
              ) : branches.length > 0 ? (
                <div className="grid gap-3">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleBranchSelect(branch.branch_id)}
                      className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#C59D5F] hover:bg-amber-50 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#C59D5F] transition-colors">
                          <FaStore className="text-gray-500 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-[#C59D5F] text-lg">
                            {branch.branch_name}
                          </h3>
                          <p className="text-xs text-gray-500">{branch.name}</p>
                        </div>
                      </div>
                      <span className="text-gray-300 group-hover:text-[#C59D5F] text-xl">→</span>
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
      <div className={`max-w-7xl mx-auto transition-opacity duration-500 ${showBranchModal ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        
       {/* Branch Info Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
             <FaStore className="text-[#C59D5F]" />
             <span className="text-gray-500 text-sm">Viewing Menu For:</span>
             <span className="font-bold text-gray-800 uppercase">
               {currentBranchName}
             </span>
          </div>
          <button 
            onClick={() => setShowBranchModal(true)}
            // --- UPDATED: CLEAN HIGHLIGHT STYLE ---
            className="text-sm font-bold text-[#000000] hover:text-[#C59D5F] border-b-2 border-[#000000] hover:border-[#C59D5F] transition-all duration-300 uppercase tracking-wider pb-1"
          >
            Choose another branch
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR (Categories) */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
              <div className="p-6 bg-gray-900 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                  <FaUtensils /> Categories
                </h2>
              </div>
              <div className="flex flex-col max-h-[60vh] overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`text-left px-6 py-4 transition-all duration-300 border-b border-gray-100 last:border-0 flex items-center justify-between group
                      ${activeCategory?.id === cat.id
                        ? "bg-amber-50 text-gray-900 border-l-4 border-l-amber-500 font-bold shadow-inner"
                        : "text-gray-600 hover:bg-gray-50 hover:pl-8 border-l-4 border-l-transparent"
                      }`}
                  >
                    <span className="text-sm uppercase tracking-wider">
                      {cat.menu_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT (Items) */}
          <div className="md:col-span-9 lg:col-span-9 flex flex-col gap-6">
            {activeCategory ? (
              <div className="animate-fade-in-up">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-tight">
                      {activeCategory.menu_name}
                    </h1>
                    <span className="text-amber-600 font-serif italic text-sm">
                      Delicious Selections
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                    {menuItems.length} Items
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 text-center py-20 flex flex-col items-center">
                      <span className="loading loading-spinner text-[#C59D5F] loading-lg"></span>
                    </div>
                  ) : menuItems.length > 0 ? (
                    menuItems.map((item) => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        branchId={selectedBranch}
                        branchName={currentBranchName} // Passing Branch Name
                      />
                    ))
                  ) : (
                    <div className="col-span-2 p-10 text-center">
                      <FaCoffee className="text-4xl mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400">No items found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl">
                <FaUtensils className="text-4xl mb-4 opacity-20" />
                <p>Select a category to view items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}