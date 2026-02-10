import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave, FaGlobe } from 'react-icons/fa';
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

  if (loading) return <div className="min-h-screen bg-[#0E1014] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0E1014] text-white pt-24 pb-12 px-4 font-['Inter']">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-[#C59D5F] font-['Barlow_Condensed'] tracking-widest uppercase text-sm font-bold mb-2">Configuration</h2>
          <h1 className="text-4xl font-['Barlow_Condensed'] font-bold uppercase text-white">System Settings</h1>
        </div>

        {/* SETTINGS CARD */}
        <div className="bg-[#1A1C21] rounded-xl shadow-2xl border border-white/5 p-8 relative overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C59D5F] opacity-5 rounded-full blur-[50px] pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {/* COMPANY CODE INPUT */}
            <div className="form-control">
              <label className="label text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Company Code
              </label>
              <div className="relative">
                <FaBuilding className="absolute top-4 left-4 text-[#C59D5F]" />
                <input 
                  type="text" 
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="e.g. 26672691"
                  className="w-full bg-[#0E1014] border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] transition-colors placeholder-gray-600 font-mono tracking-wide"
                  required
                />
              </div>
              
              {/* API Info Hint */}
              {/* <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-[#0E1014]/50 p-3 rounded border border-white/5">
                <FaGlobe className="mt-0.5 text-[#C59D5F]" />
                <p>
                  This code connects to the external API: <br/>
                  <span className="text-gray-400 italic">https://pos.chulkani.com/company/all-branch-list/</span>
                  <span className="text-[#C59D5F] font-bold">{companyCode || '...'}</span>
                </p>
              </div> */}
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              className="w-full btn border-none rounded-lg font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-lg py-3 flex items-center justify-center gap-2 bg-[#C59D5F] hover:bg-white hover:text-[#0E1014] text-white transition-all duration-300"
            >
              {saving ? "Saving..." : <><FaSave /> Save Settings</>}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}