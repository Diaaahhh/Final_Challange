import React, { useState, useEffect, useRef } from "react";
import "cally";
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaUsers,
  FaGlassCheers,
  FaPen,
  FaCheckCircle,
  FaUtensils,
  FaMapMarkerAlt,
  FaHome,
  FaExclamationCircle // <--- Add this one
} from "react-icons/fa";
import api from "../../api"; 
import useTableSuggestion from "../Hooks/useTableSuggestion"; // IMPORT CUSTOM HOOK

// Add this style block to prevent browser autofill from overriding your styles
const autofillFixStyles = `
  /* Remove browser autofill background */
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #F3F4F7 inset !important;
    -webkit-text-fill-color: #374151 !important;
    box-shadow: 0 0 0 30px #F3F4F7 inset !important;
    background-color: #F3F4F7 !important;
    background-clip: content-box !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* For Firefox */
  input:autofill {
    background-color: #F3F4F7 !important;
    color: #374151 !important;
    box-shadow: 0 0 0 30px #F3F4F7 inset !important;
  }
`;
export default function Reservation() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",         
    guest_number: "",
    event_name: "Others..",
    notes: "",
    date: "",
    time: "",
    branch_id: "",       
    table_number: [],    
  });

  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // --- USE THE CUSTOM HOOK HERE ---
  const suggestedTables = useTableSuggestion(formData.guest_number, tables);

  // 1. Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get("/reservation/branches"); 
        setBranches(res.data || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // 2. Fetch tables and occupied statuses whenever branch_id changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!formData.branch_id) {
        setTables([]);
        return;
      }
      try {
        const resTables = await api.get(`/reservation/tables/${formData.branch_id}`);
        const allTables = resTables.data || [];

        const resOccupied = await api.get(`/reservation/occupied-tables/${formData.branch_id}`);
        const occupiedTables = resOccupied.data || [];

        const finalTables = allTables.map(t => ({
            ...t,
            is_occupied: occupiedTables.includes(String(t.table_no).trim())
        }));

        setTables(finalTables);
      } catch (err) {
        console.error("Error fetching tables:", err);
      }
    };
    fetchTables();
  }, [formData.branch_id]);

  // 3. Handle Calendar Clicks
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value).toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  // --- Handle Auto-Fill on Phone Blur ---
  const handlePhoneBlur = async (e) => {
    const phoneNumber = e.target.value;
    if (phoneNumber && phoneNumber.length > 3) {
        try {
            const res = await api.get(`/reservation/get-user-by-phone/${phoneNumber}`);
            if (res.data) {
                setFormData(prev => ({
                    ...prev,
                    name: res.data.name || prev.name, 
                    address: res.data.address || prev.address, 
                }));
            }
        } catch (err) {
            console.log("User not found by phone, proceeding as new customer.");
        }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "branch_id") {
      setFormData((prev) => ({ ...prev, branch_id: value, table_number: [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTableSelect = (tableNo) => {
    setFormData(prev => {
        const currentTables = Array.isArray(prev.table_number) ? prev.table_number : [];
        if (currentTables.includes(tableNo)) {
            return { ...prev, table_number: currentTables.filter(t => t !== tableNo) };
        } else {
            return { ...prev, table_number: [...currentTables, tableNo] };
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.table_number.length === 0) {
        setError("Please select at least one available table.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setLoading(true);

    try {
      await api.post("/reservation/create", formData);
      setSuccess(true);
      setFormData({
        name: "",
        phone: "",
        address: "", 
        guest_number: "",
        event_name: "Others..",
        notes: "",
        date: "",
        time: "",
        branch_id: "",
        table_number: [],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  const renderChairs = (count, position) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={`${position}-${index}`} className="flex flex-col items-center">
        {position === 'top' && (
            <>
                <div className="w-3 h-1 bg-gray-800 rounded-full mb-[1px]"></div>
                <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
            </>
        )}
        {position === 'bottom' && (
            <>
                <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
                <div className="w-3 h-1 bg-gray-800 rounded-full mt-[1px]"></div>
            </>
        )}
      </div>
    ));
  };

  return (
    <>
      <style>{autofillFixStyles}</style>

    <div className="min-h-screen bg-[rgb(229,231,235)] py-12 px-4 font-['Inter']">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg relative">
        
        <div className="bg-[#0E1014] text-white p-8 text-center rounded-t-xl">
          <h2 className="text-3xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider mb-2">Book a Table</h2>
          <p className="text-gray-400 text-sm">Reserve your spot at your favorite branch.</p>
        </div>

        <div className="p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-3">
              <FaCheckCircle /> Reservation submitted successfully!
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Branch */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-[#C59D5F]" /> Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial'] text-black"
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option className="text-black" key={b.branch_id} value={b.branch_id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaPhone className="text-[#C59D5F]" /> Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur} 
                  placeholder="Phone Number"
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaUser className="text-[#C59D5F]" /> Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Full Name"
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaHome className="text-[#C59D5F]" /> Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your Full Address"
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                  required
                />
              </div>

              {/* Guest Number */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaUsers className="text-[#C59D5F]" /> Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="guest_number"
                  value={formData.guest_number}
                  onChange={handleChange}
                  min="1"
                  placeholder="E.g., 4"
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                  required
                />
              </div>

              {/* Date */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaCalendarAlt className="text-[#C59D5F]" /> Date <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full text-left bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700"
                >
                  {formData.date ? formData.date : "Select Date"}
                </button>
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-4">
                    <calendar-date
                      ref={calendarRef}
                      className="cally text-gray-900 border-none shadow-none"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.date}
                    >
                      <svg slot="previous" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                      <svg slot="next" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      <calendar-month></calendar-month>
                    </calendar-date>
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaClock className="text-[#C59D5F] text-black" /> Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700"
                  required
                />
              </div>

              {/* Event Name */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaGlassCheers className="text-[#C59D5F]" /> Occasion
                </label>
                <select
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleChange}
                  className="w-full text-black bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial']"
                >
                  <option className="text-black bg-white" value="Birthday">Birthday</option>
                  <option className="text-black bg-white" value="Anniversary">Anniversary</option>
                  <option className="text-black bg-white" value="Business Meeting">Business Meeting</option>
                  <option className="text-black bg-white" value="Corporate Lunch">Corporate Lunch</option>
                  <option className="text-black bg-white" value="Family Gathering">Family Gathering</option>
                  <option className="text-black bg-white" value="Reunion">Reunion</option>
                  <option className="text-black bg-white" value="Valentine’s Day Dinner">Valentine’s Day Dinner</option>
                  <option className="text-black bg-white" value="Charity Event">Charity Event</option>
                  <option className="text-black bg-white" value="VIP Reservation">VIP Reservation</option>
                  <option className="text-black bg-white" value="Others..">Others...</option>
                </select>
              </div>

            </div>

           {/* Visual Table Selection Grid */}
            {formData.branch_id && (
              <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-4">
                {/* --- BEAUTIFUL DYNAMIC TABLE SUMMARY --- */}
{(() => {
  // 1. Calculate Summary Data using Reservation state (formData)
  const selectedTableObjects = tables
    .filter((t) => formData.table_number.includes(t.table_no))
    .sort((a, b) => Number(a.table_no) - Number(b.table_no)); // Sort ascending

  const totalSelectedCapacity = selectedTableObjects.reduce(
    (sum, t) => sum + Number(t.person_no || t.capacity || 4),
    0
  );
  const parsedGuestCount = Number(formData.guest_number) || 0;
  const capacityMet = totalSelectedCapacity >= parsedGuestCount;

  return (
    <>
      <div className="flex justify-between items-end mb-3">
        <label className="block text-gray-700 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
          <FaUtensils className="text-[#C59D5F]" /> Select Table(s)
        </label>
      </div>

      {/* 2. Show Summary Card IF tables are selected */}
      {selectedTableObjects.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          {/* Status Indicator Line (Left Edge) */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              capacityMet ? "bg-green-500" : "bg-amber-500"
            }`}
          ></div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Left Side: Selected Tables Badges */}
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Selected Tables
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTableObjects.map((t) => (
                  <div
                    key={t.table_no}
                    className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden"
                  >
                    <span className="bg-[#0E1014] text-[#C59D5F] font-bold px-2 py-1 text-sm">
                      #{t.table_no}
                    </span>
                    <span className="text-gray-600 text-xs font-bold px-2 py-1 bg-gray-50">
                      {t.person_no || t.capacity || 4} Seats
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Capacity vs Guests Stats */}
            <div className="flex flex-row sm:flex-col gap-6 sm:gap-1 justify-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-5 min-w-[100px]">
              <div className="flex flex-col sm:items-end">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Total Guests
                </p>
                <p className="text-lg font-bold text-gray-800 leading-none mt-1">
                  {parsedGuestCount}
                </p>
              </div>
              <div className="flex flex-col sm:items-end mt-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Total Capacity
                </p>
                <p
                  className={`text-lg font-bold leading-none mt-1 ${
                    capacityMet ? "text-green-600" : "text-amber-500"
                  }`}
                >
                  {totalSelectedCapacity}
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message if Capacity is low */}
          {!capacityMet && parsedGuestCount > 0 && (
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100 flex items-center gap-2 font-bold">
              <FaExclamationCircle className="text-amber-500" size={14} />
              Selected capacity is less than your total guests!
            </div>
          )}
        </div>
      )}
    </>
  );
})()}

{tables.length > 0 ? (
                  // -------- CHANGES MADE HERE --------
                  // Wrapped the grid in a scrollable container with a fixed height
                 <div className="h-[350px] overflow-y-auto pr-3 mt-4 custom-scrollbar border border-gray-100 rounded-lg p-2">
    {/* ADD mt-6 HERE to push the entire grid down inside the scroll box */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6 pb-4 px-2">
        {tables.map(t => {
            const totalChairs = t.person_no || t.capacity || 4; 
            const topRow = Math.ceil(totalChairs / 2);
            const bottomRow = Math.floor(totalChairs / 2);
            
            const isSelected = formData.table_number.includes(t.table_no);
            const isOccupied = t.is_occupied;
            const isSuggested = suggestedTables.includes(t.table_no); // DYNAMIC STYLING FLAG

            return (
                <div 
                    key={t.id} 
                    onClick={() => {
                        if (!isOccupied) handleTableSelect(t.table_no);
                    }}
                    // Added mt-4 to the group to push individual items down slightly
                    className={`
                        group flex flex-col items-center justify-center p-3 mt-4 rounded-xl border-2 transition-all duration-300 relative
                        ${isOccupied 
                            ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-70' 
                            : isSelected 
                                ? 'border-[#C59D5F] bg-amber-50 shadow-md transform scale-105 cursor-pointer' 
                                : isSuggested
                                    ? 'border-green-500 bg-green-50 shadow-[0_0_15px_rgba(34,197,94,0.4)] transform scale-105 cursor-pointer animate-pulse'
                                    : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                        }
                    `}
                >
                    {isSuggested && !isOccupied && !isSelected && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-sm whitespace-nowrap">
                            ⭐ BEST FIT
                        </div>
                    )}

                    {isOccupied && (
                        <div className="absolute -top-4 -right-2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-sm">
                            BUSY
                        </div>
                    )}

                    <div className="flex gap-1 mb-1">{renderChairs(topRow, 'top')}</div>
                    
                    <div className={`
                        w-full h-16 rounded-md flex flex-col items-center justify-center shadow-inner relative overflow-hidden
                        ${isOccupied 
                            ? 'bg-red-200 text-red-800' 
                            : isSelected 
                                ? 'bg-[#C59D5F] text-white' 
                                : 'bg-gray-200 text-gray-600'
                        }
                    `}>
                        <div className="absolute inset-0 opacity-10 bg-black"></div>
                        <span className="font-['Barlow_Condensed'] font-bold text-lg relative z-10">
                            Table no.{t.table_no}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-black relative z-10">
                            {totalChairs} Seats
                        </span>
                    </div>
                    
                    <div className="flex gap-1 mt-1">{renderChairs(bottomRow, 'bottom')}</div>
                </div>
            );
        })}
    </div>
</div>
                  // -------- END OF CHANGES --------
                ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                    No physical tables found for this branch.
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                <FaPen className="text-[#C59D5F]" /> Special Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special requests?"
                className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all h-24 text-gray-800"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#C59D5F] text-white font-bold py-4 rounded-lg uppercase tracking-widest hover:bg-[#0E1014] transition-all duration-300 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Processing..." : "Confirm Reservation"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}