import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
} from "react-icons/fa";

export default function Reservation() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guest_number: "",
    event_name: "Others..",
    notes: "",
    date: "",
    time: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false); // State to toggle calendar
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target)) {
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
        setShowCalendar(false); // Close on selection
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]); // Re-bind when calendar mounts

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      setError("Please select a date.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8081/api/reservation/create", formData);
      setSuccess(true);
      setFormData({
        name: "", phone: "", guest_number: "", event_name: "Others..",
        notes: "", date: "", time: "",
      });
    } catch (err) {
      setError("Failed to submit reservation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans text-gray-800">
      
      <style>{`
        calendar-date.cally {
          --color-accent: #f59e0b;
          --color-text: #374151;
          --color-bg: #ffffff;
          --color-bg-hover: #fef3c7;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        calendar-month {
          --color-text-header: #111827;
          font-weight: 600;
        }
      `}</style>

      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        {/* Left Side */}
        <div className="bg-gray-900 text-white md:w-1/3 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500 rounded-full opacity-20 blur-3xl"></div>
          <div>
            <h2 className="text-3xl font-bold text-amber-500 mb-2">Book A Table</h2>
            <p className="text-gray-400 text-sm">Reserve your spot for an unforgettable dining experience.</p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4 text-amber-100/80">
              <FaPhone className="text-amber-500" />
              <span>+880-1958-666 999</span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="md:w-2/3 p-8 md:p-12">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <FaCheckCircle className="text-xl" />
              <span>Success! Table reserved.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control md:col-span-2">
              <label className="label text-xs font-bold text-gray-400 uppercase">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3.5 text-gray-400" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input input-bordered w-full pl-10 focus:border-amber-500" placeholder="Enter your name" />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-gray-400 uppercase">Phone</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input input-bordered w-full pl-10 focus:border-amber-500" placeholder="017..." />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-gray-400 uppercase">Guests</label>
              <div className="relative">
                <FaUsers className="absolute left-3 top-3.5 text-gray-400" />
                <input type="number" name="guest_number" value={formData.guest_number} onChange={handleChange} required min="1" className="input input-bordered w-full pl-10 focus:border-amber-500" />
              </div>
            </div>

            {/* Date Field */}
            <div className="form-control relative" ref={calendarContainerRef}>
              <label className="label text-xs font-bold text-gray-400 uppercase">Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3.5 text-gray-400 z-10" />
                <button 
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="input input-bordered w-full pl-10 flex items-center text-left bg-white text-gray-700 focus:border-amber-500"
                >
                  {formData.date ? formData.date : "Select date"}
                </button>

                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-[100]">
                    <calendar-date 
                      ref={calendarRef}
                      className="cally" 
                      min={new Date().toISOString().split("T")[0]}
                    >
                      <svg aria-label="Previous" slot="previous" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                      <svg aria-label="Next" slot="next" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      <calendar-month></calendar-month>
                    </calendar-date>
                  </div>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold text-gray-400 uppercase">Time</label>
              <div className="relative">
                <FaClock className="absolute left-3 top-3.5 text-gray-400" />
                <input type="time" name="time" value={formData.time} onChange={handleChange} required className="input input-bordered w-full pl-10 focus:border-amber-500" />
              </div>
            </div>

            <div className="form-control md:col-span-2">
              <label className="label text-xs font-bold text-gray-400 uppercase">Event Type</label>
              <div className="relative">
                <FaGlassCheers className="absolute left-3 top-3.5 text-gray-400" />
                <select name="event_name" value={formData.event_name} onChange={handleChange} className="select select-bordered w-full pl-10 focus:border-amber-500">
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Others..">Others..</option>
                </select>
              </div>
            </div>

            <div className="form-control md:col-span-2">
              <label className="label text-xs font-bold text-gray-400 uppercase">Special Notes</label>
              <div className="relative">
                <FaPen className="absolute left-3 top-4 text-gray-400" />
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="textarea textarea-bordered w-full pl-10 h-24 focus:border-amber-500" placeholder="Allergies or seating requests..."></textarea>
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <button type="submit" disabled={loading} className="btn w-full bg-gray-900 text-amber-500 border-none hover:bg-gray-800 uppercase tracking-widest">
                {loading ? "Processing..." : "Confirm Reservation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}