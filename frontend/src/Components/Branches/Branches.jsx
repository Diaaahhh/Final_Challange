import React, { useState, useEffect } from 'react';
import { FaStore, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaInfoCircle } from 'react-icons/fa';
import api from '../../api';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      className="min-h-screen flex items-center justify-center font-['Barlow_Condensed'] uppercase tracking-widest text-xl transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
        <span className="loading loading-spinner theme-accent mr-3"></span>
        <span style={{ color: 'var(--theme-navbar)' }}>Loading Branches...</span>
    </div>
  );

  return (
    <div 
      className="min-h-screen pt-24 pb-12 px-4 font-['Inter'] transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      <div className="container mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 text-left">
          <h1 
            className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase"
            style={{ color: 'var(--theme-navbar)' }}
          >
              Branch <span className="theme-accent">List</span>
          </h1>
          <div className="w-24 h-1 theme-accent-bg mt-4 rounded-full"></div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="alert bg-red-500/10 border border-red-500/30 text-red-500 max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-lg p-4 font-bold">
                <FaInfoCircle /> {error}
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && branches.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                <FaStore className="text-6xl mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 text-lg font-bold">No branches found.</p>
            </div>
        )}

        {/* BRANCH GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, index) => {
                const displayName = branch.name || "Unknown Branch";
                const locationName = branch.branch_name || "Main Location";
                const phone = branch.phone || "No Phone";
                const email = branch.email || "No Email";
                const id = branch.id || index;

                return (
                    <div 
                        key={id} 
                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[var(--theme-accent)] transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl relative flex flex-col"
                    >
                        {/* Card Header (Dynamic Dark Theme) */}
                        <div className="theme-bg p-6 flex items-start justify-between shrink-0">
                            <div>
                                {/* group-hover:text-[var(--theme-accent)] applies the custom color perfectly on hover */}
                                <h3 className="text-xl font-['Barlow_Condensed'] font-bold uppercase text-white group-hover:text-[var(--theme-accent)] transition-colors tracking-wide">
                                    {displayName}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center theme-accent shrink-0">
                                <FaStore />
                            </div>
                        </div>

                        {/* Card Body (Light Theme for readability) */}
                        <div className="p-6 space-y-4 text-sm flex-1">
                            <div className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 theme-accent flex-shrink-0" />
                                <p className="leading-relaxed font-bold text-gray-800">
                                    {locationName}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                                <FaPhoneAlt className="theme-accent flex-shrink-0" />
                                <p className="text-gray-600 font-medium">{phone}</p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                                <FaEnvelope className="theme-accent flex-shrink-0" />
                                <p className="text-gray-600 font-medium">{email}</p>
                            </div>
                        </div>
                        
                        {/* Animated Bottom Line */}
                        <div className="theme-accent-bg h-1 w-0 group-hover:w-full transition-all duration-500 absolute bottom-0 left-0"></div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}