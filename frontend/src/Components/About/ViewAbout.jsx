import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
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
      <div className="min-h-[400px] flex items-center justify-center bg-gray-900 text-amber-500">
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
    <section className="relative w-full bg-gray-900 overflow-hidden py-20 px-6 md:px-12 lg:px-24">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600 rounded-full opacity-5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-800 rounded-full opacity-10 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* --- LEFT SIDE: IMAGE (Original Size: w-1/2) --- */}
          <div className="w-full lg:w-1/2 relative group">
            
            <div className="absolute -inset-4 border-2 border-amber-500/30 rounded-xl transform rotate-2 transition-transform group-hover:rotate-0 duration-500"></div>
            
            <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50 aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <img 
                src={imageUrl} 
                alt="About Us" 
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* <div className="absolute bottom-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-lg text-white">
                <FaUtensils className="text-amber-400 text-xl mb-1" />
                <p className="text-xs font-light uppercase tracking-widest">Est. 1998</p>
              </div> */}
            </div>
          </div>

          {/* --- RIGHT SIDE: CONTENT (Original Size: w-1/2) --- */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
            
            {/* <div className="inline-flex items-center gap-2 text-amber-500 text-sm font-bold tracking-[0.2em] uppercase">
              <span className="w-8 h-[2px] bg-amber-500"></span>
              Our Story
            </div> */}

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
              {data?.heading || "The Essence of Taste"}
            </h2>

            <div className="relative">
              <FaQuoteLeft className="absolute -top-6 -left-8 text-6xl text-amber-500/10 hidden lg:block" />
              <p className="text-gray-400 text-lg leading-relaxed relative z-10 text-justify">
                {displayText || "Discover the finest culinary experience..."}
              </p>
            </div>

            {/* --- BUTTON (Only Visible if isHome is TRUE) --- */}
            {isHome && (
              <div className="pt-4">
                <Link 
                  to="/about"
                  className="px-8 py-3 bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-gray-900 transition-all duration-300 font-semibold uppercase tracking-wider text-sm rounded-sm inline-block"
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