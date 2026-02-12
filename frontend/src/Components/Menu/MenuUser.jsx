import React, { useEffect, useState } from "react";
import { FaUtensils, FaCoffee, FaImage, FaPlus, FaMinus } from "react-icons/fa";
import { useCart } from "../Cart/CartContext";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";

export default function MenuUser() {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use the global cart context
  const { cartItems, handleAddToCart } = useCart();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await api.get("/menu-user/branches");
        setBranches(branchRes.data);
        if (branchRes.data.length > 0) {
          setSelectedBranch(branchRes.data[0].branch_id);
        }
      } catch (err) {
        console.error("Error loading branches:", err);
      }
    };
    fetchBranches();
  }, []);

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

  // --- MODIFIED: Updates Global Context directly ---
  const updateQuantity = (item, delta) => {
    handleAddToCart(item, delta);
  };

  // Helper to get current quantity from global cart
  const getQuantity = (itemId) => {
    const item = cartItems.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* BRANCH TABS UI */}
        {branches.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 overflow-x-auto p-2 bg-white rounded-2xl shadow-sm border border-gray-200">
              {branches.map((branch) => (
                <button
                  key={branch.branch_id}
                  onClick={() => setSelectedBranch(branch.branch_id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
                                ${
                                  String(selectedBranch) ===
                                  String(branch.branch_id)
                                    ? "bg-amber-500 text-white shadow-md transform scale-105"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                >
                  {branch.branch_name || branch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR */}
          <div className="md:col-span-3 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
              <div className="p-6 bg-gray-900 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                  <FaUtensils /> Our Menu
                </h2>
              </div>
              <div className="flex flex-col">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`text-left px-6 py-4 transition-all duration-300 border-b border-gray-100 last:border-0 flex items-center justify-between group
                                    ${
                                      activeCategory?.id === cat.id
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

          {/* RIGHT CONTENT */}
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
                    <div className="col-span-2 text-center py-20 text-gray-400">
                      Loading...
                    </div>
                  ) : menuItems.length > 0 ? (
                    menuItems.map((item) => {
                      const isActive = Number(item.m_status) === 1;
                      const itemQty = getQuantity(item.id); // Get quantity from Context

                      return (
                        <div
                          key={item.id}
                          className={`group bg-white rounded-xl shadow-sm transition-all duration-300 border border-gray-100 flex p-4 gap-4 items-start relative
                                                ${!isActive ? "opacity-60 grayscale bg-gray-50" : "hover:shadow-md"}`}
                        >
                          <div className="w-[85px] h-[85px] shrink-0 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {item.m_image ? (
                              <img
                                src={`${IMAGE_BASE_URL}/${item.m_image}`}
                                alt={item.m_menu_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <FaImage />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col min-h-[85px]">
                            {/* TOP ROW */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-base font-bold text-gray-800">
                                  {item.m_menu_name}
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block mb-1">
                                  #{item.m_menu_sl}
                                </span>
                              </div>
                              <span className="text-base font-bold text-amber-600 whitespace-nowrap ml-2">
                                {Number(item.m_price).toLocaleString()}{" "}
                                <span className="text-xs font-normal text-gray-500">
                                  Tk
                                </span>
                              </span>
                            </div>

                            {/* MIDDLE ROW */}
                            <p className="text-gray-500 text-xs line-clamp-2 mb-2">
                              {formatDescription(item.m_ingredient)}
                            </p>

                            {/* BOTTOM ROW */}
                            <div className="mt-auto flex items-center justify-between border-t border-dashed border-gray-100 pt-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                                ></div>
                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                  {isActive ? "Available" : "Out of Stock"}
                                </span>
                              </div>

                              {isActive && (
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                  <button
                                    onClick={() => updateQuantity(item, -1)}
                                    className="p-1.5 rounded-md bg-white text-gray-600 hover:bg-amber-100 hover:text-amber-600 transition-colors shadow-sm"
                                  >
                                    <FaMinus size={10} />
                                  </button>

                                  <span className="text-sm font-bold min-w-[20px] text-center text-gray-800">
                                    {itemQty}
                                  </span>

                                  <button
                                    onClick={() => updateQuantity(item, 1)}
                                    className="p-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-colors"
                                  >
                                    <FaPlus size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-10 text-center">
                      <FaCoffee className="text-4xl mx-auto mb-2 text-gray-200" />
                      <p className="text-gray-400">No items found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 min-h-[400px]">
                Select a category
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
