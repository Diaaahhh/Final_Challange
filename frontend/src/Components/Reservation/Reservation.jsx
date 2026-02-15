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
  FaMapMarkerAlt
} from "react-icons/fa";
import api from "../../api";

export default function Reservation() {
  // --- Form State ---
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guest_number: "",
    event_name: "Others..",
    notes: "",
    date: "",
    time: "",
    table_number: [] // Changed to Array for multiple selections
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  
  // --- Layout State ---
  const [floorPlan, setFloorPlan] = useState([]);

  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  // --- Fetch Floor Plan on Mount ---
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await api.get("/tables");
        setFloorPlan(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load floor plan", err);
      }
    };
    fetchLayout();
  }, []);

  // --- Calendar Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarContainerRef.current &&
        !calendarContainerRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        setFormData((prev) => ({ ...prev, date: e.target.value }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- NEW: Handle Multiple Table Selection ---
  const handleTableSelect = (tableNum) => {
    setFormData((prev) => {
      const currentTables = prev.table_number;
      if (currentTables.includes(tableNum)) {
        // If already selected, remove it (deselect)
        return { ...prev, table_number: currentTables.filter(t => t !== tableNum) };
      } else {
        // If not selected, add it
        return { ...prev, table_number: [...currentTables, tableNum] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Prepare data payload (Convert array to string for backend)
    const payload = {
        ...formData,
        table_number: formData.table_number.join(", ") // "1, 5, 8"
    };

    try {
      await api.post("/reservation/create", payload);
      setSuccess(true);
      setFormData({
        name: "", phone: "", guest_number: "", event_name: "Others..", notes: "", date: "", time: "",
        table_number: []
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to make reservation.");
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const inputClass =
    "w-full bg-gray-800/50 text-white border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-gray-500 text-sm";
  const textareaClass =
    "w-full bg-gray-800/50 text-white border border-gray-700 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-gray-500 text-sm h-24 resize-none";

  return (
    <div className="min-h-screen bg-gray-900 font-sans relative overflow-x-hidden">
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Restaurant Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/90 to-gray-900"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-bold tracking-[0.2em] uppercase mb-2 block">
            Reservation
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4">
            Book Your <span className="text-amber-500">Table</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-light">
            Experience culinary excellence. Select your tables directly from the map below.
          </p>
        </div>

        {/* --- MAIN CONTENT: FLEX LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* --- LEFT SIDE: RESERVATION FORM --- */}
          <div className="w-full lg:w-1/3 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            {success ? (
              <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                  <FaCheckCircle className="text-3xl" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">
                  Reservation Confirmed!
                </h3>
                <p className="text-gray-400">
                  We look forward to hosting you.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 text-amber-500 hover:text-amber-400 text-sm font-bold uppercase tracking-wider underline underline-offset-4"
                >
                  Book Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {error && (
                  <div className="md:col-span-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="label text-xs font-bold text-gray-400 uppercase">Full Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="label text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+880 1XXXXXXXXX"
                      required
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="relative" ref={calendarContainerRef}>
                  <label className="label text-xs font-bold text-gray-400 uppercase">Date</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`${inputClass} text-left flex items-center`}
                  >
                    <FaCalendarAlt className="absolute left-3 text-gray-400" />
                    <span className={formData.date ? "text-white" : "text-gray-500"}>
                      {formData.date || "Select Date"}
                    </span>
                  </button>
                  
                  {showCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200">
                      <calendar-date
                        ref={calendarRef}
                        className="cally text-gray-900" 
                        min={new Date().toISOString().split("T")[0]}
                      >
                        <svg slot="previous" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                        <svg slot="next" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                        <calendar-month></calendar-month>
                      </calendar-date>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label text-xs font-bold text-gray-400 uppercase">Time</label>
                  <div className="relative">
                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Guests & Table Selection Display */}
                <div>
                  <label className="label text-xs font-bold text-gray-400 uppercase">Guests</label>
                  <div className="relative">
                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="guest_number"
                      value={formData.guest_number}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="2"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-amber-500 uppercase">Table No.</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input
                      type="text"
                      name="table_number"
                      value={formData.table_number.length > 0 ? formData.table_number.join(", ") : "Select on Map"}
                      readOnly
                      className={`${inputClass} border-amber-500/50 text-amber-500 font-bold cursor-default`}
                      placeholder="Select on Map"
                    />
                  </div>
                </div>

                {/* Occasion */}
                <div className="md:col-span-2">
                  <label className="label text-xs font-bold text-gray-400 uppercase">Occasion</label>
                  <div className="relative">
                    <FaGlassCheers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleChange}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="Casual Dining">Casual Dining</option>
                      <option value="Birthday Party">Birthday Party</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Date Night">Date Night</option>
                      <option value="Business Meal">Business Meal</option>
                      <option value="Others..">Others..</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="label text-xs font-bold text-gray-400 uppercase">Special Request</label>
                  <div className="relative">
                    <FaPen className="absolute left-3 top-4 text-gray-400" />
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className={textareaClass}
                      placeholder="Allergies, specific requests..."
                    ></textarea>
                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading || formData.table_number.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-4 rounded-lg uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Confirming..." : (formData.table_number.length === 0 ? "Select Table to Book" : "Reserve Now")}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* --- RIGHT SIDE: FLOOR PLAN VISUALIZATION --- */}
          <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[700px] md:h-[800px]">
            
            {/* Map Header */}
            <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaUtensils className="text-amber-600" />
                <h3 className="font-['Barlow_Condensed'] font-bold text-gray-800 uppercase tracking-wide text-lg">
                  Interactive <span className="text-amber-600">Map</span>
                </h3>
              </div>
              <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-300 text-gray-500 uppercase font-bold tracking-wider">
                Select Multiple
              </span>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 overflow-auto relative bg-slate-50 p-8">
              <div className="relative w-[1000px] h-[800px] bg-white rounded-xl border border-dashed border-gray-300 shadow-sm mx-auto">
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#64748B 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {floorPlan.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <FaUtensils className="text-5xl mb-3 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-sm">Floor Plan Loading...</p>
                  </div>
                ) : (
                  floorPlan.map((item) => {
                    const isTable = item.type === 'table';
                    const isBookable = item.isBookable; // From API (true/false)
                    const isSelected = formData.table_number.includes(item.table_number);

                    return (
                      <div
                        key={item.id}
                        // Only add click handler if it IS a table and IS bookable
                        onClick={() => isTable && isBookable && handleTableSelect(item.table_number)}
                        className={`
                            absolute transition-all duration-200 
                            ${isTable && isBookable ? 'cursor-pointer hover:scale-105 z-10' : 'z-0'}
                        `}
                        style={{
                          left: `${item.pos_x}px`,
                          top: `${item.pos_y}px`,
                          width: `${item.width || 100}px`, 
                          height: `${item.height || 100}px`
                        }}
                      >
                        <div 
                          className="w-full h-full"
                          style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                        >
                          <div className={`
                            w-full h-full flex flex-col items-center justify-center rounded-lg border-2 shadow-sm transition-all
                            ${!isTable 
                                ? "bg-gray-200 border-gray-400 text-gray-500" // Wall/Object
                                : isSelected 
                                    ? "bg-green-100 border-green-500 text-green-700 shadow-green-200 ring-2 ring-green-500 ring-offset-2" // Selected
                                    : isBookable 
                                        ? "bg-white border-gray-800 text-gray-800 hover:border-amber-500 hover:shadow-amber-500/50" // Bookable
                                        : "bg-red-50 border-red-200 text-red-300 cursor-not-allowed opacity-70" // Not Bookable
                            }
                          `}>
                            {isTable ? (
                              <>
                                {isSelected && <FaCheckCircle className="absolute -top-2 -right-2 text-green-600 bg-white rounded-full z-20" />}
                                <FaUtensils className={`opacity-80 mb-1 ${isSelected ? "text-green-600" : "text-amber-600"}`} size={12} />
                                <span className="font-['Barlow_Condensed'] font-bold leading-none text-lg">
                                  {item.table_number}
                                </span>
                                <span className={`text-[9px] uppercase font-bold tracking-wider mt-1 ${isSelected ? "text-green-700" : "text-gray-500"}`}>
                                  {item.capacity} Seats
                                </span>
                              </>
                            ) : (
                              <span className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest px-1 text-center leading-tight text-[10px] overflow-hidden">
                                {item.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Map Footer */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-200 text-xs text-gray-500 font-medium flex justify-center gap-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-gray-800 rounded"></span> Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-500 rounded"></span> Selected</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></span> Wall/Object</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}