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
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#C59D5F] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[#E0E0E0] text-lg font-bold tracking-widest uppercase font-['Barlow_Condensed']">Loading Showcase...</p>
    </div>
  );

  return (
    <div className="bg-[#0D0D0D] min-h-screen text-[#E0E0E0] font-sans pb-20 pt-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <span className="w-12 h-[2px] bg-[#C59D5F]"></span>
            <FaUtensils className="text-[#C59D5F]" />
            <span className="w-12 h-[2px] bg-[#C59D5F]"></span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Playfair_Display'] font-bold text-[#E0E0E0] mb-4">
            Our <span className="text-[#C59D5F]"></span> Gallery
          </h1>
        </div>

        {/* CATEGORY TABS */}
        <div className="border-b border-[#2A2A2A] mb-12 overflow-x-auto">
          <div className="flex flex-row items-center justify-center gap-x-2 md:gap-x-4 min-w-max pb-px">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-4 transition-all duration-300 relative group font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm hover:text-white ${isActive ? 'text-[#C59D5F]' : 'text-[#A0A0A0]'}`}
                >
                  {category}
                  <span className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t transition-all duration-300 ${isActive ? 'bg-[#C59D5F] scale-x-100' : 'bg-[#C59D5F]/0 scale-x-0 group-hover:scale-x-50'}`}></span>
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
                className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden  hover:border-[#C59D5F]/50 hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={displayImageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-20"></div>
                  
                  {/* Icon showing there are multiple images */}
                  {item.images && item.images.length > 0 && (
                    <div className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <FaImages /> {item.images.length + 1}
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#2A2A2A] border border-[#333333] rounded-full text-xs font-bold uppercase tracking-wider text-[#C59D5F] mb-3">
                    <FaStar size={10} />
                    {item.category}
                  </div>
                  <h3 className="text-lg font-semibold text-[#E0E0E0] group-hover:text-[#C59D5F] transition-colors font-['Barlow_Condensed'] uppercase tracking-wider">
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
            className="bg-[#1A1A1A] w-full max-w-4xl rounded-2xl border border-[#2A2A2A] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            {/* Close Button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-[#C59D5F] text-white p-2 rounded-full transition-colors"
            >
              <FaTimes size={20} />
            </button>

            {/* Slider Section */}
            <div className="relative w-full max-w-[895px] h-[500px] mx-auto bg-black flex items-center justify-center group shrink-0">
              <img 
                src={getImageUrl(getAllImages(selectedItem)[currentImageIndex])} 
                alt="Slider" 
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              />

              {/* Slider Controls (Only show if more than 1 image) */}
              {getAllImages(selectedItem).length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#C59D5F] text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                  >
                    <FaChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#C59D5F] text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
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
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2A2A2A] border border-[#333333] rounded-full text-xs font-bold uppercase tracking-wider text-[#C59D5F] mb-4">
                <FaStar size={12} />
                {selectedItem.category}
              </div>
              <h2 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-4">
                {selectedItem.title}
              </h2>
              
              <div className="text-[#A0A0A0] leading-relaxed whitespace-pre-wrap">
                {selectedItem.description ? selectedItem.description : <span className="italic">No description provided for this item.</span>}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}