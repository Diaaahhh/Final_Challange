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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-amber-500 text-lg font-light tracking-widest uppercase">Loading Branches</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the best locations</p>
      </div>
    </div>
  );

  return (
    
    <section className="relative w-full min-h-screen bg-base-200  overflow-hidden py-20 px-6 md:px-12 lg:px-24">
      
      {/* Background Decor - Inspired by ViewAbout */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600 rounded-full opacity-5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-800 rounded-full opacity-10 blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER - Elegant like ViewAbout */}
        <div className="text-center lg:text-left mb-16 relative">
          <div className="inline-flex items-center gap-2 text-amber-500 text-sm font-bold tracking-[0.2em] uppercase mb-4">
            <span className="w-8 h-[2px] bg-amber-500"></span>
            Our Locations
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
            Find Your Nearest
            <span className="block text-amber-500">Branch</span>
          </h1>
          
          <div className="relative max-w-2xl mx-auto lg:mx-0">
            <FaQuoteLeft className="absolute -top-6 -left-8 text-6xl text-amber-500/10 hidden lg:block" />
            <p className="text-gray-400 text-lg leading-relaxed relative z-10">
              Experience culinary excellence at any of our conveniently located branches. 
              Each location offers the same commitment to quality and service.
            </p>
          </div>
          
          <div className="w-24 h-1 bg-amber-500 mt-8 mx-auto lg:mx-0 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-red-400">
              <FaInfoCircle className="text-2xl flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && branches.length === 0 && (
          <div className="text-center py-20 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
            <FaStore className="text-7xl text-amber-500/30 mx-auto mb-6" />
            <p className="text-gray-400 text-xl font-light">No branches found</p>
            <p className="text-gray-600 mt-2">Please check back later</p>
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
                  group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl overflow-hidden
                  border transition-all duration-500 cursor-pointer
                  ${isSelected 
                    ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                    : isHovered
                      ? 'border-amber-500/50 shadow-xl scale-[1.02]'
                      : 'border-gray-700/50 hover:border-amber-500/30'
                  }
                `}
              >
                {/* Background Decor for Card */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 
                  transition-all duration-500 pointer-events-none
                  ${isHovered ? 'from-amber-500/5 to-amber-600/10' : ''}
                `}></div>
                
                {/* Animated Border Gradient */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
                  bg-gradient-to-r from-transparent via-amber-500/20 to-transparent
                `}></div>

                {/* Card Header with Decorative Elements */}
                <div className="relative p-8 border-b border-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-white group-hover:text-amber-500 transition-colors duration-300 mb-2">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-amber-500" />
                        {locationName}
                      </p>
                    </div>
                    
                    <div className={`
                      w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center
                      transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3
                      ${isHovered 
                        ? 'from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                        : 'from-gray-700 to-gray-800 text-amber-500'
                      }
                    `}>
                      <FaStore className="text-2xl" />
                    </div>
                  </div>

                  {/* Decorative Line */}
                  <div className={`
                    absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-500
                    group-hover:w-full
                  `}></div>
                </div>

                {/* Card Body - Contact Information */}
                <div className="p-8 space-y-6">
                  {/* Phone */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center
                      transition-all duration-300 group-hover/item:bg-amber-500/20
                    `}>
                      <FaPhoneAlt className={`
                        transition-colors duration-300
                        ${isHovered ? 'text-amber-500' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                      <a 
                        href={`tel:${phone}`} 
                        className="text-white font-medium hover:text-amber-500 transition-colors block"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center
                      transition-all duration-300 group-hover/item:bg-amber-500/20
                    `}>
                      <FaEnvelope className={`
                        transition-colors duration-300
                        ${isHovered ? 'text-amber-500' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                      <a 
                        href={`mailto:${email}`} 
                        className="text-white font-medium break-all hover:text-amber-500 transition-colors block"
                      >
                        {email}
                      </a>
                    </div>
                  </div>

                  {/* Additional Info - Hours (Example) */}
                  <div className="flex items-center gap-4 group/item">
                    <div className={`
                      w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center
                      transition-all duration-300 group-hover/item:bg-amber-500/20
                    `}>
                      <FaClock className={`
                        transition-colors duration-300
                        ${isHovered ? 'text-amber-500' : 'text-gray-400'}
                      `} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Opening Hours</p>
                      <p className="text-white font-medium">10:00 AM - 10:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Action */}
                <div className="p-6 bg-gray-900/50 border-t border-gray-700/50">
                  {/* <button className="w-full group/btn relative overflow-hidden">
                    <div className={`
                      absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 
                      transform transition-transform duration-500
                      ${isHovered ? 'translate-x-0' : '-translate-x-full'}
                    `}></div>
                    
                    <div className={`
                      relative flex items-center justify-center gap-2 py-3 px-6
                      border border-amber-500 rounded-lg overflow-hidden
                      transition-all duration-300
                      ${isHovered 
                        ? 'text-white border-transparent' 
                        : 'text-amber-500 hover:text-white'
                      }
                    `}>
                      <span className="font-semibold uppercase tracking-wider text-sm">View Details</span>
                      <FaChevronRight className={`
                        text-xs transition-transform duration-300
                        group-hover/btn:translate-x-1
                      `} />
                    </div>
                  </button> */}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20">
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-amber-500/30 rounded-tr-2xl"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-20 h-20">
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-amber-500/30 rounded-bl-2xl"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        {branches.length > 0 && (
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 text-gray-400">
              <FaUtensils className="text-amber-500" />
              <p className="text-sm">All branches are open daily from 10:00 AM to 10:00 PM</p>
              <FaUtensils className="text-amber-500" />
            </div>
            
            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="w-12 h-px bg-amber-500/30"></span>
              <FaStar className="text-amber-500 text-xs" />
              <span className="w-12 h-px bg-amber-500/30"></span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}