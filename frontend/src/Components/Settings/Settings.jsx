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
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center font-['Barlow_Condensed'] font-bold text-xl uppercase tracking-widest">
      <span className="text-[#007BFF] animate-pulse">Loading Configuration...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center border-b border-[#1E1E1E] pb-6">
          <h2 className="text-[#A0A0A0] font-['Barlow_Condensed'] tracking-widest uppercase text-sm font-bold mb-2">
            Configuration
          </h2>
          <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
            System <span className="text-[#007BFF]">Settings</span>
          </h1>
        </div>

        {/* SETTINGS CARD */}
        <div className="bg-[#111111] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#1E1E1E] p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#007BFF] rounded-full opacity-3 blur-3xl pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            
            {/* COMPANY CODE INPUT */}
            <div className="form-control">
              <label className="text-[#A0A0A0] text-xs font-bold uppercase tracking-widest mb-3 block">
                Company Code
              </label>
              <div className="relative group">
                <FaBuilding className="absolute top-4 left-4 text-[#007BFF] group-hover:scale-110 transition-transform duration-300" />
                <input 
                  type="text" 
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="e.g. 26672691"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base"
                  required
                />
              </div>
              <p className="mt-2 text-[10px] text-[#555] uppercase tracking-wide font-bold">
                * Required for API synchronization
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              className="w-full btn border-none rounded-xl font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg py-4 flex items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0066e6] text-black transition-all duration-300 shadow-[0_0_25px_rgba(0,123,255,0.3)] hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] transform active:scale-95 disabled:opacity-50"
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