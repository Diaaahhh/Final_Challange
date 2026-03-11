import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave, FaTruck } from 'react-icons/fa';
import api from '../../api';

export default function Settings() {
  const [companyCode, setCompanyCode] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(''); // NEW STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch existing settings on load
  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.data) {
           if (res.data.company_code) setCompanyCode(res.data.company_code);
           // Safely check if it exists so we can even load '0'
           if (res.data.delivery_charge !== undefined) setDeliveryCharge(res.data.delivery_charge);
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
      await api.post('/settings/update', { 
          company_code: companyCode,
          delivery_charge: deliveryCharge // SEND NEW STATE
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center font-['Inter']">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007BFF]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-12 px-4 sm:px-6 lg:px-8 font-['Inter'] flex justify-center">
      <div className="max-w-xl w-full">
        
        {/* HEADER SECTION */}
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-4xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-[#888] text-sm tracking-wide">
            Configure your core application preferences
          </p>
        </div>

        {/* SETTINGS CARD */}
        <div className="bg-[#121212] rounded-3xl p-8 border border-[#222] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Subtle top gradient glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#007BFF] to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            
            {/* COMPANY CODE INPUT */}
            <div className="space-y-3 group">
              <label className="text-sm font-bold text-[#AAA] uppercase tracking-widest flex items-center gap-2 group-focus-within:text-[#007BFF] transition-colors">
                <FaBuilding /> Company Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-[#555] font-mono font-bold text-lg">#</span>
                </div>
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

            {/* DELIVERY CHARGE INPUT */}
            <div className="space-y-3 group">
              <label className="text-sm font-bold text-[#AAA] uppercase tracking-widest flex items-center gap-2 group-focus-within:text-[#007BFF] transition-colors">
                <FaTruck /> Global Delivery Charge (Tk)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-[#555] font-bold text-lg">৳</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={deliveryCharge} 
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base"
                  required
                />
              </div>
              <p className="mt-2 text-[10px] text-[#555] uppercase tracking-wide font-bold">
                * Applied automatically to all Home Delivery orders
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              className="w-full btn border-none rounded-xl font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg py-4 flex items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0066e6] text-black transition-all duration-300 shadow-[0_0_25px_rgba(0,123,255,0.3)] hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] transform active:scale-95 disabled:opacity-50 mt-4"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="text-xl" /> Save Configuration
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}