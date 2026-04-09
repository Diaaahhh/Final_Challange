import React, { useState, useEffect, useRef } from 'react';
import { FaBuilding, FaSave, FaTruck, FaClock, FaHourglassHalf, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast'; 

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

  // --- Validation & Locking States ---
  const [isFormUnlocked, setIsFormUnlocked] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  
  // To prevent the auto-save from running on the initial page load
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // To track the previous code so we only save when the text ACTUALLY changes
  const prevCodeRef = useRef('');

  // 1. Fetch existing settings on load
  useEffect(() => {
    api.get('/settings')
      .then(async (res) => {
        if (res.data) {
           if (res.data.delivery_charge !== undefined) setDeliveryCharge(res.data.delivery_charge);
           if (res.data.rest_open) setRestOpen(res.data.rest_open.substring(0, 5));
           if (res.data.rest_close) setRestClose(res.data.rest_close.substring(0, 5));
           if (res.data.table_prelock_duration !== undefined) setTablePrelockDuration(res.data.table_prelock_duration);
           if (res.data.otp !== undefined) setOtpEnabled(res.data.otp === 1);
           if (res.data.captcha !== undefined) setCaptchaEnabled(res.data.captcha === 1);

           if (res.data.company_code) {
             const loadedCode = String(res.data.company_code);
             setCompanyCode(loadedCode);
             prevCodeRef.current = loadedCode; 

             // Auto-verify the loaded code to unlock the form initially
             setIsValidatingCode(true);
             try {
                const branchRes = await api.get('/branches');
                if (branchRes.data && branchRes.data.status === true) {
                    setIsFormUnlocked(true);
                }
             } catch(e) {
                setIsFormUnlocked(false);
             } finally {
                setIsValidatingCode(false);
             }
           }
        }
        setLoading(false);
        setInitialLoadDone(true); // Mark that initial load is finished
      })
      .catch(err => {
        console.error("Error fetching settings", err);
        setLoading(false);
        setInitialLoadDone(true);
      });
  }, []);

  // 2. Debounce -> Save to DB -> Verify via branches.js
  useEffect(() => {
    if (!initialLoadDone) return; // Don't run while the page is still loading

    const safeCode = String(companyCode);
    
    // Only run this logic if the company code text ACTUALLY changed
    if (safeCode === prevCodeRef.current) return;
    prevCodeRef.current = safeCode; // Update the ref

    if (!safeCode.trim()) {
      setIsFormUnlocked(false);
      setIsValidatingCode(false);
      return;
    }
    
    setIsFormUnlocked(false); // Lock the form instantly
    setIsValidatingCode(true); // Show "Verifying..."

    const delayDebounceFn = setTimeout(async () => {
      try {
        // STEP A: Store inside database FIRST
        await api.post('/settings/update', { 
            company_code: safeCode,
            delivery_charge: deliveryCharge,
            rest_open: restOpen,
            rest_close: restClose,
            table_prelock_duration: tablePrelockDuration,
            otp: otpEnabled ? 1 : 0,
            captcha: captchaEnabled ? 1 : 0
        });

        // STEP B: The verification process starts automatically
        // This calls branches.js, which reads the newly saved code from the DB!
        const res = await api.get(`/branches`);
        
        if (res.data && res.data.status === true) {
          setIsFormUnlocked(true); // Unlock if successful
          toast.success("Settings saved & Company Verified!");
        } else {
          setIsFormUnlocked(false);
          toast.error("No company found with this code.");
        }
      } catch (error) {
        setIsFormUnlocked(false);
        toast.error("No company found or network error.");
      } finally {
        setIsValidatingCode(false);
      }
    }, 1000); // Waits 1000ms (1 second) after the user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [companyCode, deliveryCharge, restOpen, restClose, tablePrelockDuration, otpEnabled, captchaEnabled, initialLoadDone]);

  // 3. Handle Submit (Manual Save Button)
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
          otp: otpEnabled ? 1 : 0,
          captcha: captchaEnabled ? 1 : 0
      });
      toast.success("Settings updated successfully!");    
    } catch (err) {
      console.error("Error saving settings", err);
      toast.error("Failed to update settings");    
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider group-focus-within:text-[#007BFF] transition-colors">
                  Company Code
                </label>
                {/* Status Indicators */}
                {isValidatingCode && <span className="text-[#007BFF] text-[10px] uppercase font-bold animate-pulse">Saving & Verifying...</span>}
                {!isValidatingCode && isFormUnlocked && companyCode && <span className="text-green-500 text-[10px] uppercase font-bold">✓ Valid Code</span>}
                {!isValidatingCode && !isFormUnlocked && companyCode && <span className="text-red-500 text-[10px] uppercase font-bold">✕ Invalid</span>}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaBuilding className={`transition-colors ${isFormUnlocked ? 'text-green-500' : 'text-[#555] group-focus-within:text-[#007BFF]'}`} />
                </div>
                <input 
                  type="text" 
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className={`w-full bg-[#1A1A1A] border rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base
                    ${isFormUnlocked ? 'border-green-500/50 focus:border-green-500 focus:ring-1 focus:ring-green-500/30' : 
                     (companyCode && !isValidatingCode ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' : 
                     'border-[#2A2A2A] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30')}`}
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
                  disabled={!isFormUnlocked}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  min="0"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base disabled:opacity-40 disabled:cursor-not-allowed"
                  required
                />
              </div>
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
                        disabled={!isFormUnlocked}
                        onChange={(e) => setRestOpen(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all font-mono tracking-wide font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
                        disabled={!isFormUnlocked}
                        onChange={(e) => setRestClose(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all font-mono tracking-wide font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PRE-RESERVATION BUFFER */}
                <div className="group">
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 group-focus-within:text-[#C59D5F] transition-colors">
                    Hold Table Before Arrival (Minutes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaHourglassHalf className="text-[#555] group-focus-within:text-[#C59D5F] transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      value={tablePrelockDuration}
                      disabled={!isFormUnlocked}
                      onChange={(e) => setTablePrelockDuration(e.target.value)}
                      min="0"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#C59D5F] focus:ring-1 focus:ring-[#C59D5F]/30 transition-all placeholder-[#444] font-mono tracking-wide font-bold shadow-sm text-base disabled:opacity-40 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
            </div>

            {/* --- SECURITY SETTINGS --- */}
            <div className="pt-6 pb-2 border-t border-[#222]">
                <h3 className="text-[#007BFF] font-bold uppercase tracking-wider text-sm mb-4">Security & Verification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* OTP Switch */}
                  <div className={`flex items-center justify-between bg-[#1A1A1A] border ${otpEnabled ? 'border-[#007BFF]/50' : 'border-[#2A2A2A]'} rounded-xl p-4 shadow-sm transition-all duration-300 ${!isFormUnlocked ? 'opacity-40' : ''}`}>
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
                        disabled={!isFormUnlocked}
                        className="sr-only peer" 
                        checked={otpEnabled} 
                        onChange={() => setOtpEnabled(!otpEnabled)} 
                      />
                      <div className={`w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${otpEnabled ? 'peer-checked:bg-[#007BFF]' : ''}`}></div>
                    </label>
                  </div>
                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={saving || !isFormUnlocked || isValidatingCode}
              className="w-full btn border-none rounded-xl font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-lg py-4 flex items-center justify-center gap-2 bg-[#007BFF] hover:bg-[#0066e6] text-black transition-all duration-300 shadow-[0_0_25px_rgba(0,123,255,0.3)] hover:shadow-[0_0_40px_rgba(0,123,255,0.5)] transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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