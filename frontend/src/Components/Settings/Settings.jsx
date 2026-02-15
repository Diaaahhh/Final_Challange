import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave } from 'react-icons/fa';
import api from '../../api';

export default function Settings() {
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch existing code on load
  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if(res.data && res.data.company_code) {
           setCompanyCode(res.data.company_code);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching settings", err);
        setLoading(false);
      });
  }, []);

  // 2. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/settings/update', { company_code: companyCode });
      alert("Company Code saved successfully!");
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex items-center justify-center font-['Barlow_Condensed'] font-bold text-xl uppercase tracking-widest">
      <span className="text-[#C59D5F] animate-pulse">Loading Configuration...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-24 pb-12 px-4 font-['Inter']">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center border-b border-[#E2E8F0] pb-6">
          <h2 className="text-[#64748B] font-['Barlow_Condensed'] tracking-widest uppercase text-sm font-bold mb-2">
            Configuration
          </h2>
          <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B]">
            System <span className="text-[#C59D5F]">Settings</span>
          </h1>
        </div>

        {/* SETTINGS CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-8 relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            
            {/* COMPANY CODE INPUT */}
            <div className="form-control">
              <label className="label text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2 block">
                Company Code
              </label>
              <div className="relative group">
                <FaBuilding className="absolute top-4 left-4 text-[#C59D5F] group-hover:scale-110 transition-transform duration-300" />
                <input 
                  type="text" 
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="e.g. 26672691"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-12 pr-4 text-[#1E293B] focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F] transition-all placeholder-gray-400 font-mono tracking-wide font-bold shadow-sm"
                  required
                />
              </div>
              <p className="mt-2 text-[10px] text-[#94A3B8] uppercase tracking-wide font-bold">
                * Required for API synchronization
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              className="w-full btn border-none rounded-xl font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg py-4 flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#C59D5F] text-white transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-95"
            >
              {saving ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <FaSave /> Save Settings
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}