import React, { useState, useEffect } from 'react';
import { 
  FaStore, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaInfoCircle,
  FaClock,
  FaUtensils,
  FaStar,
  FaChevronRight,
  FaQuoteLeft
} from 'react-icons/fa';
import api from '../../api';

export default function BranchUser() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [hoveredBranch, setHoveredBranch] = useState(null);

  useEffect(() => {
    api.get('/branches')
      .then(res => {
        const payload = res.data;
        let finalData = [];

        if (payload.data && Array.isArray(payload.data.branches)) {
            finalData = payload.data.branches;
        } 
        else if (Array.isArray(payload)) {
            finalData = payload;
        }
        else if (payload.data && Array.isArray(payload.data)) {
            finalData = payload.data;
        }

        setBranches(finalData);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to connect to Branch API.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      <div className="text-center">
        <div className="w-20 h-20 border-4 theme-border border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="theme-accent text-lg font-bold tracking-widest uppercase">Loading Branches</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the best locations</p>
      </div>
    </div>
  );

  return (
    <section 
      className="relative w-full min-h-screen overflow-hidden py-20 px-6 md:px-12 lg:px-24 transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      
      {/* Background Decor - Replaced amber with dynamic theme-accent-bg */}
      <div className="absolute top-0 right-0 w-96 h-96 theme-accent-bg rounded-full opacity-5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 theme-accent-bg rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] theme-accent-bg rounded-full opacity-5 blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="text-center lg:text-left mb-16 relative">
          <div className="inline-flex items-center gap-2 theme-accent text-sm font-bold tracking-[0.2em] uppercase mb-4">
            <span className="w-8 h-[2px] theme-accent-bg"></span>
            Our Locations
          </div>
          
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
            style={{ color: 'var(--theme-navbar)' }}
          >
            Find Your Nearest
            <span className="block theme-accent">Branch</span>
          </h1>
          
          <div className="relative max-w-2xl mx-auto lg:mx-0">
            <FaQuoteLeft className="absolute -top-6 -left-8 text-6xl theme-accent opacity-10 hidden lg:block" />
            <p className="text-gray-600 text-lg leading-relaxed relative z-10">
              Experience culinary excellence at any of our conveniently located branches. 
              Each location offers the same commitment to quality and service.
            </p>
          </div>
          
          <div className="w-24 h-1 theme-accent-bg mt-8 mx-auto lg:mx-0 rounded-full opacity-80"></div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-4 text-red-600">
              <FaInfoCircle className="text-2xl flex-shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && branches.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <FaStore className="text-7xl text-gray-200 mx-auto mb-6" />
            <p className="text-gray-800 text-xl font-bold">No branches found</p>
            <p className="text-gray-500 mt-2">Please check back later</p>
          </div>
        )}

        {/* BRANCH GRID - Beautiful Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch, index) => {
            const displayName = branch.name || "Unknown Branch";
            const locationName = branch.branch_name || "Main Location";
            const phone = branch.phone || "No Phone";
            const email = branch.email || "No Email";
            const id = branch.id || index;
            
            const isHovered = hoveredBranch === id;
            const isSelected = selectedBranch === id;

            return (
              <div
                key={id}
                onMouseEnter={() => setHoveredBranch(id)}
                onMouseLeave={() => setHoveredBranch(null)}
                onClick={() => setSelectedBranch(id)}
                className={`
                  group relative bg-white rounded-2xl overflow-hidden
                  border transition-all duration-500 cursor-pointer shadow-sm
                  ${isSelected 
                    ? 'theme-border shadow-md' 
                    : isHovered
                      ? 'theme-border shadow-xl scale-[1.02]'
                      : 'border-gray-200 hover-theme-border'
                  }
                `}
              >
                {/* Background Decor for Card */}
                <div className={`
                  absolute inset-0 transition-all duration-500 pointer-events-none
                  ${isHovered ? 'theme-accent-bg opacity-5' : 'opacity-0'}
                `}></div>
                
                {/* Animated Border Gradient */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none
                  bg-gradient-to-r from-transparent via-[var(--theme-accent)] to-transparent
                `}></div>

                {/* Card Header with Decorative Elements */}
                <div className="relative p-8 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-gray-900 group-hover:text-[var(--theme-accent)] transition-colors duration-300 mb-2">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FaMapMarkerAlt className="theme-accent" />
                        {locationName}
                      </p>
                    </div>
                    
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center
                      transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3
                      ${isHovered 
                        ? 'theme-accent-bg text-white shadow-md' 
                        : 'bg-gray-100 theme-accent'
                      }
                    `}>
                      <FaStore className="text-2xl" />
                    </div>
                  </div>

                  {/* Decorative Line */}
                  <div className={`
                    absolute bottom-0 left-0 w-0 h-0.5 theme-accent-bg transition-all duration-500
                    group-hover:w-full
                  `}></div>
                </div>

                {/* Card Body - Contact Information */}
                <div className="p-8 space-y-6 relative z-10">
                  {/* Phone */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100
                      transition-all duration-300 group-hover/item:theme-accent-bg group-hover/item:border-transparent
                    `}>
                      <FaPhoneAlt className={`
                        transition-colors duration-300
                        ${isHovered ? 'theme-accent group-hover/item:text-white' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Phone</p>
                      <a 
                        href={`tel:${phone}`} 
                        className="text-gray-800 font-bold hover-theme-accent transition-colors block"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100
                      transition-all duration-300 group-hover/item:theme-accent-bg group-hover/item:border-transparent
                    `}>
                      <FaEnvelope className={`
                        transition-colors duration-300
                        ${isHovered ? 'theme-accent group-hover/item:text-white' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Email</p>
                      <a 
                        href={`mailto:${email}`} 
                        className="text-gray-800 font-bold break-all hover-theme-accent transition-colors block"
                      >
                        {email}
                      </a>
                    </div>
                  </div>

                  {/* Additional Info - Hours */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100
                      transition-all duration-300 group-hover/item:theme-accent-bg group-hover/item:border-transparent
                    `}>
                      <FaClock className={`
                        transition-colors duration-300
                        ${isHovered ? 'theme-accent group-hover/item:text-white' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Opening Hours</p>
                      <p className="text-gray-800 font-bold">10:00 AM - 10:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 theme-border opacity-20 rounded-tr-2xl"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none">
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 theme-border opacity-20 rounded-bl-2xl"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        {branches.length > 0 && (
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 text-gray-500 font-medium">
              <FaUtensils className="theme-accent" />
              <p className="text-sm">All branches are open daily from 10:00 AM to 10:00 PM</p>
              <FaUtensils className="theme-accent" />
            </div>
            
            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="w-12 h-px theme-accent-bg opacity-30"></span>
              <FaStar className="theme-accent text-xs" />
              <span className="w-12 h-px theme-accent-bg opacity-30"></span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}