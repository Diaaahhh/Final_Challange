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
  FaChevronDown,
  FaSpinner
} from "react-icons/fa";
import api from "../../api"; 

export default function Reservation() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
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
  
  // UI toggles
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [fetchingUserData, setFetchingUserData] = useState(false);

  const calendarRef = useRef(null);
  const tableDropdownRef = useRef(null);

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

  // 2. Fetch tables whenever branch_id changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!formData.branch_id) {
        setTables([]);
        return;
      }
      try {
        const res = await api.get(`/reservation/tables/${formData.branch_id}`);
        setTables(res.data || []);
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

  // 4. Handle clicks outside the custom table dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(event.target)) {
        setShowTableDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NEW: Handle phone blur to fetch user data
  const handlePhoneBlur = async (e) => {
    const phoneNumber = e.target.value;
    if (phoneNumber && phoneNumber.length > 5) {
      setFetchingUserData(true);
      try {
        const res = await api.get(`/reservation/get-user-by-phone/${phoneNumber}`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            name: res.data.name || res.data.cust_name || prev.name,
          }));
        }
      } catch (err) {
        // User not found, just ignore - let user fill manually
        console.log("User not found by phone, proceeding with manual entry.");
      } finally {
        setFetchingUserData(false);
      }
    }
  };

  // Handle standard inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "branch_id") {
      setFormData((prev) => ({ ...prev, branch_id: value, table_number: [] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle custom Table Checkbox toggle
  const handleTableToggle = (tableNo) => {
    setFormData(prev => {
      const currentTables = prev.table_number;
      if (currentTables.includes(tableNo)) {
        // Remove if already selected
        return { ...prev, table_number: currentTables.filter(t => t !== tableNo) };
      } else {
        // Add to selection
        return { ...prev, table_number: [...currentTables, tableNo] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Custom Validation for Table Array
    if (formData.table_number.length === 0) {
        setError("Please select at least one table.");
        return;
    }

    setLoading(true);

    try {
      await api.post("/reservation/create", formData);
      setSuccess(true);
      setFormData({
        name: "",
        phone: "",
        guest_number: "",
        event_name: "Others..",
        notes: "",
        date: "",
        time: "",
        branch_id: "",
        table_number: [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(229,231,235)] py-12 px-4 font-['Inter']">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg relative">
        
        {/* Header */}
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
              
              {/* --- BRANCH DROPDOWN --- */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-[#C59D5F]" /> Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial']"
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* --- TABLE NUMBER (CUSTOM CHECKBOX DROPDOWN) --- */}
              <div className="relative" ref={tableDropdownRef}>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaUtensils className="text-[#C59D5F]" /> Table No. <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setShowTableDropdown(!showTableDropdown)}
                  className="w-full bg-[#F3F4F7] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all cursor-pointer flex justify-between items-center font-['Arial']"
                >
                  <span className="truncate text-gray-700">
                    {formData.table_number.length > 0 
                      ? `Selected: Table ${formData.table_number.join(", ")}` 
                      : "-- Select Table(s) --"}
                  </span>
                  <FaChevronDown className="text-gray-400 text-xs" />
                </div>

                {showTableDropdown && (
                  <div className="absolute top-full left-0 mt-2 z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg max-h-60 overflow-y-auto font-['Arial'] py-2">
                    {tables.length > 0 ? (
                      tables.map((t) => (
                        <label key={t.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors text-gray-700">
                          <input
                            type="checkbox"
                            checked={formData.table_number.includes(t.table_no)}
                            onChange={() => handleTableToggle(t.table_no)}
                            className="mr-3 w-4 h-4 text-[#C59D5F] focus:ring-[#C59D5F] rounded border-gray-300"
                          />
                          Table {t.table_no} {t.person_no ? `(${t.person_no} Seats)` : ""}
                        </label>
                      ))
                    ) : (
                      <div className="p-4 text-gray-500 text-sm text-center">Please select a branch first</div>
                    )}
                  </div>
                )}
              </div>

              {/* Phone - Modified with onBlur handler */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaPhone className="text-[#C59D5F]" /> Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    placeholder="Phone Number"
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all pr-10"
                    required
                  />
                  {fetchingUserData && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <FaSpinner className="animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Phone number will auto-fill your name if you're a returning customer</p>
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
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all"
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
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all"
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
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial']"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Meeting">Business Meeting</option>
                  <option value="Others..">Others...</option>
                </select>
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
                  <FaClock className="text-[#C59D5F]" /> Time <span className="text-red-500">*</span>
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
            </div>

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
                className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all h-24 text-gray-700"
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
  );
}