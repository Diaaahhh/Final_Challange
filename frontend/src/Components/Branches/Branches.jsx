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
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center font-['Barlow_Condensed'] uppercase tracking-widest text-xl">
        <span className="loading loading-spinner text-[#00FFD1] mr-3"></span>
        <span className="text-[#E0E0E0]">Loading Branches...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 text-left">
          <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
              Branch <span className="text-[#007BFF]">List</span>
          </h1>
          <div className="w-24 h-1 bg-[#007BFF] mt-4 rounded-full shadow-[0_0_10px_rgba(0,123,255,0.5)]"></div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="alert bg-red-500/10 border border-red-500/30 text-red-400 max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-lg p-4">
                <FaInfoCircle /> {error}
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && branches.length === 0 && (
            <div className="text-center text-[#555] py-12 bg-[#111111] rounded-xl border border-[#1E1E1E]">
                <FaStore className="text-6xl mx-auto mb-4 opacity-20" />
                <p className="text-[#A0A0A0] text-lg">No branches found.</p>
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
                        className="group bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden hover:border-[#007BFF] transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_0_25px_rgba(0,123,255,0.15)]"
                    >
                        {/* Card Header */}
                        <div className="bg-[#0A0A0A] p-6 border-b border-[#1E1E1E] flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-['Barlow_Condensed'] font-bold uppercase text-white group-hover:text-[#00FFD1] transition-colors tracking-wide">
                                    {displayName}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF]">
                                <FaStore />
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-4 text-sm text-[#A0A0A0]">
                            <div className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-[#C59D5F] flex-shrink-0" />
                                <p className="leading-relaxed font-semibold text-[#E0E0E0]">
                                    {locationName}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-[#1E1E1E] pt-4">
                                <FaPhoneAlt className="text-[#007BFF] flex-shrink-0" />
                                <p className="text-[#C0C0C0]">{phone}</p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-[#1E1E1E] pt-4">
                                <FaEnvelope className="text-[#007BFF] flex-shrink-0" />
                                <p className="text-[#C0C0C0]">{email}</p>
                            </div>
                        </div>
                        
                        <div className="bg-[#007BFF] h-0.5 w-0 group-hover:w-full transition-all duration-500 shadow-[0_0_10px_rgba(0,123,255,0.5)]"></div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}