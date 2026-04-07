import React, { useState, useEffect } from 'react';
import { FaBuilding, FaSave, FaTruck, FaClock, FaHourglassHalf, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';
import api from '../../api';

export default function Settings() {
  const [companyCode, setCompanyCode] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  
  // --- EXISTING STATES FOR RESERVATION SETTINGS ---
  const [restOpen, setRestOpen] = useState('10:00'); 
  const [restClose, setRestClose] = useState('22:00');
  const [tablePrelockDuration, setTablePrelockDuration] = useState('30');

  // --- NEW STATES FOR SECURITY SETTINGS ---
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch existing settings on load
  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.data) {
           if (res.data.company_code) setCompanyCode(res.data.company_code);
           if (res.data.delivery_charge !== undefined) setDeliveryCharge(res.data.delivery_charge);
           
           if (res.data.rest_open) setRestOpen(res.data.rest_open.substring(0, 5));
           if (res.data.rest_close) setRestClose(res.data.rest_close.substring(0, 5));
           if (res.data.table_prelock_duration !== undefined) setTablePrelockDuration(res.data.table_prelock_duration);

           // Load Security Settings (Convert 1/0 from DB to true/false for UI)
           if (res.data.otp !== undefined) setOtpEnabled(res.data.otp === 1);
           if (res.data.captcha !== undefined) setCaptchaEnabled(res.data.captcha === 1);
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
          delivery_charge: deliveryCharge,
          rest_open: restOpen,
          rest_close: restClose,
          table_prelock_duration: tablePrelockDuration,
          // Convert true/false back to 1/0 for DB
          otp: otpEnabled ? 1 : 0,
          captcha: captchaEnabled ? 1 : 0
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1014] flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#007BFF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#A0A0A0] mt-4 font-mono uppercase tracking-widest text-sm">Loading System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1014] p-4 md:p-8 text-white font-['Inter'] relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#007BFF] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#007BFF]/20 flex items-center justify-center border border-[#007BFF]/30">
                <FaBuilding className="text-[#007BFF] text-lg" />
              </span>
              System Settings
            </h2>
            <p className="text-[#A0A0A0] text-sm mt-2 ml-11">
              Manage core configurations for your restaurant.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="bg-[#111111] p-8 rounded-2xl shadow-2xl border border-[#222]">
          
          <div className="space-y-6">
            
            {/* COMPANY CODE */}
            <div className="group">
              <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#007BFF] transition-colors">
                Company Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaBuilding className="text-[#555] group-focus-within:text-[#007BFF] transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base"
                  required
                />
              </div>
              <p className="mt-2 text-[10px] text-[#555] uppercase tracking-wide font-bold">
                * Used for POS integration and synchronization
              </p>
            </div>

            {/* DELIVERY CHARGE */}
            <div className="group pt-4 border-t border-[#222]">
              <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#007BFF] transition-colors">
                Delivery Charge (৳)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaTruck className="text-[#555] group-focus-within:text-[#007BFF] transition-colors" />
                </div>
                <input 
                  type="number" 
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  min="0"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base"
                  required
                />
              </div>
              <p className="mt-2 text-[10px] text-[#555] uppercase tracking-wide font-bold">
                * Applied automatically to all Home Delivery orders
              </p>
            </div>

            {/* --- RESERVATION SETTINGS --- */}
            <div className="pt-6 pb-2 border-t border-[#222]">
                <h3 className="text-[#C59D5F] font-bold uppercase tracking-wider text-sm mb-4">Reservation Timings</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* OPENING TIME */}
                  <div className="group">
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#C59D5F] transition-colors">
                      Restaurant Open
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaClock className="text-[#555] group-focus-within:text-[#C59D5F] transition-colors" />
                      </div>
                      <input 
                        type="time" 
                        value={restOpen}
                        onChange={(e) => setRestOpen(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all font-mono tracking-wide font-bold shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* CLOSING TIME */}
                  <div className="group">
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#C59D5F] transition-colors">
                      Restaurant Close
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaClock className="text-[#555] group-focus-within:text-[#C59D5F] transition-colors" />
                      </div>
                      <input 
                        type="time" 
                        value={restClose}
                        onChange={(e) => setRestClose(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all font-mono tracking-wide font-bold shadow-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PRE-RESERVATION BUFFER */}
                <div className="group">
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#C59D5F] transition-colors">
                    Pre-Reservation Buffer (Minutes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaHourglassHalf className="text-[#555] group-focus-within:text-[#C59D5F] transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      value={tablePrelockDuration}
                      onChange={(e) => setTablePrelockDuration(e.target.value)}
                      min="0"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base"
                      required
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-[#555] uppercase tracking-wide font-bold">
                    * The table will be locked to walk-ins this many minutes prior to a booking.
                  </p>
                </div>
            </div>

            {/* --- NEW SECTION: SECURITY SETTINGS --- */}
            <div className="pt-6 pb-2 border-t border-[#222]">
                <h3 className="text-[#007BFF] font-bold uppercase tracking-wider text-sm mb-4">Security & Verification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  
                  {/* OTP Switch */}
                  <div className={`flex items-center justify-between bg-[#1A1A1A] border ${otpEnabled ? 'border-[#007BFF]/50' : 'border-[#2A2A2A]'} rounded-xl p-4 shadow-sm transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${otpEnabled ? 'bg-[#007BFF]/20 text-[#007BFF]' : 'bg-[#333] text-[#555]'} transition-colors`}>
                         <FaMobileAlt />
                       </div>
                       <div>
                         <span className="text-sm font-bold text-white uppercase tracking-wider block">OTP Gateway</span>
                         <span className="text-[10px] text-[#555] font-bold uppercase tracking-wide">SMS Verification</span>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={otpEnabled} 
                        onChange={() => setOtpEnabled(!otpEnabled)} 
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007BFF]"></div>
                    </label>
                  </div>

                  {/* Captcha Switch */}
                  {/* <div className={`flex items-center justify-between bg-[#1A1A1A] border ${captchaEnabled ? 'border-[#007BFF]/50' : 'border-[#2A2A2A]'} rounded-xl p-4 shadow-sm transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${captchaEnabled ? 'bg-[#007BFF]/20 text-[#007BFF]' : 'bg-[#333] text-[#555]'} transition-colors`}>
                         <FaShieldAlt />
                       </div>
                       <div>
                         <span className="text-sm font-bold text-white uppercase tracking-wider block">Google Captcha</span>
                         <span className="text-[10px] text-[#555] font-bold uppercase tracking-wide">Bot Protection</span>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={captchaEnabled} 
                        onChange={() => setCaptchaEnabled(!captchaEnabled)} 
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007BFF]"></div>
                    </label>
                  </div> */}

                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving}
              className="w-full btn border-none rounded-xl font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg py-4 flex items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0066e6] text-black transition-all duration-300 shadow-[0_0_25px_rgba(0,123,255,0.3)] hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] transform active:scale-95 disabled:opacity-50 mt-4"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="text-xl" /> Save Settings
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}