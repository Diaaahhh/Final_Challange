import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { FaUtensils, FaQuoteLeft } from "react-icons/fa";
import api from '../../api'
import { IMAGE_BASE_URL } from "../../config";

export default function ViewAbout({ isHome = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/view-about");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching about content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      // Changed to use the body color instead of navbar color
      <div 
        className="min-h-[400px] flex items-center justify-center theme-accent"
        style={{ backgroundColor: 'var(--theme-body)' }}
      >
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  const imageUrl = data?.image 
    ? `${ IMAGE_BASE_URL }/uploads/${data.image}` 
    : "https://via.placeholder.com/600x400?text=Restaurant+Ambience";

  // --- LOGIC: Truncate text ONLY if isHome is true ---
  const displayText = (isHome && data?.text) 
    ? data.text.substring(0, 200) + "..." 
    : data?.text;

  return (
    <section 
      className="relative w-full overflow-hidden py-20 px-6 md:px-12 lg:px-24 transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }} // <-- Dynamically pulls your body color
    >
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 theme-accent-bg rounded-full opacity-5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 theme-accent-bg rounded-full opacity-10 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* --- LEFT SIDE: IMAGE --- */}
          <div className="w-full lg:w-1/2 relative group">
            
            {/* Dynamic themed border with opacity */}
            <div className="absolute -inset-4 border-2 theme-border opacity-30 rounded-xl transform rotate-2 transition-all group-hover:rotate-0 duration-500"></div>
            
            <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/20 aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
              <img 
                src={imageUrl} 
                alt="About Us" 
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* --- RIGHT SIDE: CONTENT --- */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
            
            {/* Changed from text-white to dynamically use the dark navbar color so it's readable on light body bg */}
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight"
              style={{ color: 'var(--theme-navbar)' }} 
            >
              {data?.heading || "The Essence of Taste"}
            </h2>

            <div className="relative">
              <FaQuoteLeft className="absolute -top-6 -left-8 text-6xl theme-accent opacity-10 hidden lg:block" />
              {/* Changed from text-gray-400 to text-gray-700 for better contrast */}
              <p className="text-gray-700 text-lg leading-relaxed relative z-10 text-justify">
                {displayText || "Discover the finest culinary experience..."}
              </p>
            </div>

            {/* --- BUTTON --- */}
            {isHome && (
              <div className="pt-4">
                <Link 
                  to="/about"
                  className="px-8 py-3 bg-transparent border theme-border theme-accent hover-theme-accent-bg hover-theme-bg-text transition-all duration-300 font-semibold  tracking-wider text-sm rounded-sm inline-block"
                >
                  Read More
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}