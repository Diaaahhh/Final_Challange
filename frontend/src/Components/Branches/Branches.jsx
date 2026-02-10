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
        console.log("Full API Payload:", payload); // Debugging

        let finalData = [];

        // TARGET: The specific structure you shared: { data: { branches: [...] } }
        if (payload.data && Array.isArray(payload.data.branches)) {
            finalData = payload.data.branches;
        } 
        // Fallback 1: Direct Array
        else if (Array.isArray(payload)) {
            finalData = payload;
        }
        // Fallback 2: data is the array
        else if (payload.data && Array.isArray(payload.data)) {
            finalData = payload.data;
        }

        setBranches(finalData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching branches:", err);
        setError("Failed to connect to Branch API.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0E1014] text-white flex items-center justify-center font-['Barlow_Condensed'] uppercase tracking-widest text-xl">
        <span className="loading loading-spinner text-[#C59D5F] mr-2"></span> Loading Branches...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0E1014] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 text-center">
            <h2 className="text-[#C59D5F] font-['Barlow_Condensed'] tracking-widest uppercase text-sm font-bold mb-2">
                Locations
            </h2>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
                Branch <span className="text-[#C59D5F]">List</span>
            </h1>
            <div className="w-24 h-1 bg-[#C59D5F] mx-auto mt-4 rounded-full"></div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="alert bg-red-900/20 border border-red-500 text-red-200 max-w-2xl mx-auto mb-8 flex items-center gap-3">
                <FaInfoCircle /> {error}
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && branches.length === 0 && (
            <div className="text-center text-gray-500 py-12 bg-[#1A1C21] rounded-xl border border-white/5">
                <FaStore className="text-6xl mx-auto mb-4 opacity-20" />
                <p>No branches found.</p>
            </div>
        )}

        {/* BRANCH GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, index) => {
                // MAPPING VARIABLES BASED ON YOUR JSON
                const displayName = branch.name || "Unknown Branch"; // e.g., "Dhaka Branch"
                const locationName = branch.branch_name || "Main Location"; // e.g., "Dhaka"
                const phone = branch.phone || "No Phone";
                const email = branch.email || "No Email";
                const id = branch.id || index;

                return (
                    <div 
                        key={id} 
                        className="group bg-[#1A1C21] border border-white/5 rounded-xl overflow-hidden hover:border-[#C59D5F] transition-all duration-300 hover:-translate-y-1 shadow-lg"
                    >
                        {/* Card Header */}
                        <div className="bg-[#0E1014] p-6 border-b border-white/5 flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-['Barlow_Condensed'] font-bold uppercase text-white group-hover:text-[#C59D5F] transition-colors">
                                    {displayName}
                                </h3>
                                {/* <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#1A1C21] px-2 py-1 rounded mt-2 inline-block">
                                    ID: {branch.branch_id || id}
                                </span> */}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#C59D5F]/10 flex items-center justify-center text-[#C59D5F]">
                                <FaStore />
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4 text-sm text-gray-400">
                            
                            {/* Location / City */}
                            <div className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-[#C59D5F]" />
                                <p className="leading-relaxed font-bold text-gray-300">
                                    {locationName}
                                </p>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                                <FaPhoneAlt className="text-[#C59D5F]" />
                                <p>{phone}</p>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                                <FaEnvelope className="text-[#C59D5F]" />
                                <p>{email}</p>
                            </div>
                        </div>
                        
                        <div className="bg-[#C59D5F] h-1 w-0 group-hover:w-full transition-all duration-500"></div>
                    </div>
                );
            })}
        </div>

      </div>
    </div>
  );
}