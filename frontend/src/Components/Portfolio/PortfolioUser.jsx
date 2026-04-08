import React, { useState, useEffect } from "react";
import { 
  FaUtensils, 
  FaStar, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaImages 
} from "react-icons/fa";
import api from "../../api";
import { IMAGE_BASE_URL } from "../../config";

export default function PortfolioUser() {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- MODAL & SLIDER STATE ---
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get("/portfolio")
      .then((res) => {
        const data = res.data.data || []; 
        setPortfolioItems(data);

        const uniqueCats = ["All", ...new Set(data.map(item => item.category))];
        setCategories(uniqueCats);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching gallery:", err);
        setError("Failed to load gallery items. Please try again later.");
        setLoading(false);
      });
  }, []);

  const filteredItems = selectedCategory === "All"
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === selectedCategory);

  // =========================================================
  // SLIDER & MODAL LOGIC
  // =========================================================
  const openModal = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0); // Reset to first image when opened
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  // Helper to get full image URL securely
  const getImageUrl = (filename) => {
    if (!filename) return "https://via.placeholder.com/800x600?text=No+Image";
    return `${IMAGE_BASE_URL}/uploads/portfolio/${filename}`;
  };

  // Create an array of all images for the slider (Banner + Gallery Images)
  const getAllImages = (item) => {
    if (!item) return [];
    // Filter out null/undefined in case they don't exist
    return [item.banner, ...(item.images || [])].filter(Boolean);
  };

  const nextImage = (e) => {
    e.stopPropagation(); // Prevent closing modal when clicking arrow
    const allImages = getAllImages(selectedItem);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const allImages = getAllImages(selectedItem);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // =========================================================
  // RENDER
  // =========================================================
  if (loading) return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      <span className="loading loading-spinner theme-accent loading-lg mb-4"></span>
      <p className="text-gray-800 text-lg font-bold tracking-widest uppercase font-['Barlow_Condensed']">
        Loading Showcase...
      </p>
    </div>
  );

  return (
    <div 
      className="min-h-screen text-gray-800 font-sans pb-20 pt-24 relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <span className="w-12 h-[2px] theme-accent-bg"></span>
            <FaUtensils className="theme-accent" />
            <span className="w-12 h-[2px] theme-accent-bg"></span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Playfair_Display'] font-bold text-gray-900 mb-4">
            Our <span className="theme-accent"></span> Gallery
          </h1>
        </div>

        {/* CATEGORY TABS */}
        <div className="border-b border-gray-200 mb-12 overflow-x-auto">
          <div className="flex flex-row items-center justify-center gap-x-2 md:gap-x-4 min-w-max pb-px">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-4 transition-all duration-300 relative group font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm hover:text-gray-900 ${
                    isActive ? 'theme-accent' : 'text-gray-500'
                  }`}
                >
                  {category}
                  <span className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t transition-all duration-300 ${
                    isActive ? 'theme-accent-bg scale-x-100' : 'bg-transparent scale-x-0 group-hover:scale-x-50 group-hover:bg-gray-300'
                  }`}></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PORTFOLIO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const displayImageUrl = getImageUrl(item.banner);

            return (
              <div 
                key={item.id} 
                onClick={() => openModal(item)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  <img
                    src={displayImageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20"></div>
                  
                  {/* Icon showing there are multiple images */}
                  {item.images && item.images.length > 0 && (
                    <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <FaImages /> {item.images.length + 1}
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider theme-accent mb-3">
                    <FaStar size={10} />
                    {item.category}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 hover-theme-accent transition-colors font-['Barlow_Condensed'] uppercase tracking-wider line-clamp-1">
                    {item.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          MODAL OVERLAY & SLIDER
          ========================================================= */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm"
          onClick={closeModal} // Clicking background closes modal
        >
          {/* Modal Content Box */}
          <div 
            className="bg-white w-full max-w-4xl rounded-2xl border border-gray-100 overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            {/* Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 bg-black/50 hover-theme-accent-bg text-white p-2 rounded-full transition-colors"
            >
              <FaTimes size={20} />
            </button>

            {/* Slider Section */}
            <div className="relative w-full max-w-[895px] h-[500px] mx-auto bg-gray-900 flex items-center justify-center group shrink-0">
              <img 
                src={getImageUrl(getAllImages(selectedItem)[currentImageIndex])} 
                alt="Slider" 
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-md"
              />

              {/* Slider Controls (Only show if more than 1 image) */}
              {getAllImages(selectedItem).length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover-theme-accent-bg text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                  >
                    <FaChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover-theme-accent-bg text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                  >
                    <FaChevronRight size={20} />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest z-20">
                    {currentImageIndex + 1} / {getAllImages(selectedItem).length}
                  </div>
                </>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider theme-accent mb-4">
                <FaStar size={12} />
                {selectedItem.category}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 font-['Playfair_Display'] mb-4">
                {selectedItem.title}
              </h2>
              
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {selectedItem.description ? selectedItem.description : <span className="italic">No description provided for this item.</span>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}