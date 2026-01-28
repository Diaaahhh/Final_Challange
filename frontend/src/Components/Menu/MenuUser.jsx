import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaCoffee, FaTag } from 'react-icons/fa'; 

export default function MenuUser() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); 
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Categories on Mount
  useEffect(() => {
    axios.get("http://localhost:8081/api/menu-user/categories")
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) {
          handleCategoryClick(res.data[0]);
        }
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // 2. Handle Category Click
  const handleCategoryClick = async (category) => {
    setActiveCategory(category);
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8081/api/menu-user/items/${category.code}`);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* === LEFT SIDEBAR: CATEGORIES === */}
        <div className="md:col-span-3 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
                {/* Header: Black Background with Golden Text */}
                <div className="p-6 bg-gray-900 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
                        <FaUtensils /> 
                        Our Menu
                    </h2>
                    <p className="text-xs text-amber-200/80 mt-1 uppercase tracking-widest">Select Category</p>
                </div>
                
                <div className="flex flex-col">
                    {categories.map((cat) => (
                        <button
                            key={cat.code}
                            onClick={() => handleCategoryClick(cat)}
                            className={`
                                text-left px-6 py-4 transition-all duration-300 border-b border-gray-100 last:border-0
                                flex items-center justify-between group
                                ${activeCategory?.code === cat.code 
                                    ? "bg-amber-50 text-gray-900 border-l-4 border-l-amber-500 font-bold shadow-inner" 
                                    : "text-gray-600 hover:bg-gray-50 hover:pl-8 border-l-4 border-l-transparent"}
                            `}
                        >
                            <span className="text-sm uppercase tracking-wider">{cat.name}</span>
                            {/* Golden Indicator Dot */}
                            {(activeCategory?.code === cat.code) && (
                                <span className="text-amber-500 text-lg">•</span>
                            )}
                        </button>
                    ))}
                    
                    {categories.length === 0 && (
                        <div className="p-6 text-gray-400 text-sm text-center">Loading Categories...</div>
                    )}
                </div>
            </div>
        </div>

        {/* === RIGHT CONTENT: ITEMS LIST === */}
        <div className="md:col-span-9 lg:col-span-9">
            {activeCategory ? (
                <div className="animate-fade-in-up">
                    {/* Header: Black Text with Golden Underline Accent */}
                    <div className="flex items-end gap-4 mb-8 border-b-2 border-gray-200 pb-4">
                        <h1 className="text-4xl font-extrabold text-gray-900 uppercase tracking-tight">
                            {activeCategory.name}
                        </h1>
                        <span className="text-amber-600 text-lg font-serif italic mb-1">Selection</span>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                        {loading ? (
                            <div className="col-span-2 text-center py-20 text-gray-400">Loading delicious items...</div>
                        ) : menuItems.length > 0 ? (
                            menuItems.map((item) => (
                                <div key={item.code} className="group relative">
                                    {/* Item Header */}
                                    <div className="flex justify-between items-baseline mb-2 border-b border-gray-300 border-dotted pb-1">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors">
                                            {item.name}
                                        </h3>
                                        {/* Golden Price */}
                                        <span className="text-xl font-bold text-amber-600">
                                            {Number(item.price).toLocaleString()} <span className="text-sm font-normal text-gray-500">Tk</span>
                                        </span>
                                    </div>

                                    {/* Item Body */}
                                    <p className="text-gray-600 text-sm leading-relaxed italic">
                                        {item.description || "No description available."}
                                    </p>
                                    
                                    {/* Item Footer: Code Badge */}
                                    <div className="mt-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                            <FaTag className="text-[8px] text-amber-500" /> #{item.code}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 p-10 bg-white rounded-xl shadow-sm text-center border border-gray-100">
                                <FaCoffee className="text-6xl text-gray-200 mx-auto mb-4"/>
                                <h3 className="text-lg font-bold text-gray-400">No items found</h3>
                                <p className="text-gray-400 text-sm">This category is currently empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Initial State
                <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <FaUtensils className="text-4xl text-gray-300 mx-auto mb-2"/>
                        <p>Select a category to view the menu</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}