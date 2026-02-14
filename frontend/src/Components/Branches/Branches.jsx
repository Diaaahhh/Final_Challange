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
    /* Background changed to Pure White, Text to Dark Charcoal */
    <div className="min-h-screen bg-white text-[#1E293B] flex items-center justify-center font-['Barlow_Condensed'] uppercase tracking-widest text-xl">
        <span className="loading loading-spinner text-[#C59D5F] mr-2"></span> Loading Branches...
    </div>
  );

  return (
    /* Background changed to Ghost White (#F8FAFC), Text to Dark Charcoal (#1E293B) */
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-24 pb-12 px-4 font-['Inter']">
      <div className="container mx-auto">
        
        {/* HEADER */}
<div className="mb-12 text-left"> {/* Changed text-center to text-left */}
   
    <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B]">
        Branch <span className="text-[#C59D5F]">List</span>
    </h1>
    {/* Removed mx-auto to align the bar to the left */}
    <div className="w-24 h-1 bg-[#C59D5F] mt-4 rounded-full"></div>
</div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="alert bg-red-50 border border-red-200 text-red-600 max-w-2xl mx-auto mb-8 flex items-center gap-3">
                <FaInfoCircle /> {error}
            </div>
        )}

        {/* EMPTY STATE - Changed to Light Gray background (#F1F5F9) */}
        {!loading && !error && branches.length === 0 && (
            <div className="text-center text-[#64748B] py-12 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                <FaStore className="text-6xl mx-auto mb-4 opacity-20" />
                <p>No branches found.</p>
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
                    /* Card Background: Pure White (#FFFFFF), Border: Silver (#E2E8F0) */
                    <div 
                        key={id} 
                        className="group bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#C59D5F] transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                    >
                        {/* Card Header - Light Gray background (#F1F5F9) */}
                        <div className="bg-[#F1F5F9] p-6 border-b border-[#E2E8F0] flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B] group-hover:text-[#C59D5F] transition-colors">
                                    {displayName}
                                </h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#C59D5F]/10 flex items-center justify-center text-[#C59D5F]">
                                <FaStore />
                            </div>
                        </div>

                        {/* Card Body - Text changed to Medium Gray (#64748B) */}
                        <div className="p-6 space-y-4 text-sm text-[#64748B]">
                            <div className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-[#C59D5F]" />
                                <p className="leading-relaxed font-bold text-[#475569]">
                                    {locationName}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-[#E2E8F0] pt-4">
                                <FaPhoneAlt className="text-[#C59D5F]" />
                                <p>{phone}</p>
                            </div>

                            <div className="flex items-center gap-3 border-t border-[#E2E8F0] pt-4">
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