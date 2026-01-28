import React, { useState } from "react";
import axios from "axios";
import { FaCalendarAlt, FaClock, FaUser, FaPhone, FaUsers, FaGlassCheers, FaPen, FaCheckCircle } from 'react-icons/fa';

export default function Reservation() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guest_number: "",
    event_name: "Others..", // Default value
    notes: "",
    date: "",
    time: ""
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axios.post("http://localhost:8081/api/reservation/create", formData);
      setSuccess(true);
      // Reset form
      setFormData({
        name: "",
        phone: "",
        guest_number: "",
        event_name: "Others..",
        notes: "",
        date: "",
        time: ""
      });
    } catch (err) {
      setError("Failed to submit reservation. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans">
      
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        
        {/* Left Side: Decorative / Info (Optional, makes it look pro) */}
        <div className="bg-gray-900 text-white md:w-1/3 p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Decorative Gold Circle */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500 rounded-full opacity-20 blur-3xl"></div>
            
            <div>
                <h2 className="text-3xl font-bold text-amber-500 mb-2">Book A Table</h2>
                <p className="text-gray-400 text-sm">Reserve your spot for an unforgettable dining experience.</p>
            </div>

            <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4 text-amber-100/80">
                    <FaPhone className="text-amber-500" />
                    <span>+880 123 456 789</span>
                </div>
                <div className="flex items-center gap-4 text-amber-100/80">
                    <FaCalendarAlt className="text-amber-500" />
                    <span>Open Daily: 10am - 11pm</span>
                </div>
            </div>

            <div className="mt-auto pt-8">
               <p className="text-xs text-gray-500">Note: Reservations are held for 15 minutes past the scheduled time.</p>
            </div>
        </div>

        {/* Right Side: The Form */}
        <div className="md:w-2/3 p-8 md:p-12">
            
            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
                    <FaCheckCircle className="text-xl"/>
                    <div>
                        <span className="font-bold">Success!</span> Your table has been reserved.
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="form-control md:col-span-2">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    <div className="relative">
                        <FaUser className="absolute left-3 top-3.5 text-gray-400"/>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            required
                            className="input input-bordered w-full pl-10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                    <div className="relative">
                        <FaPhone className="absolute left-3 top-3.5 text-gray-400"/>
                        <input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange}
                            required
                            className="input input-bordered w-full pl-10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="017..."
                        />
                    </div>
                </div>

                {/* Guest Number */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Guests</label>
                    <div className="relative">
                        <FaUsers className="absolute left-3 top-3.5 text-gray-400"/>
                        <input 
                            type="number" 
                            name="guest_number" 
                            value={formData.guest_number} 
                            onChange={handleChange}
                            required
                            min="1"
                            className="input input-bordered w-full pl-10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="2"
                        />
                    </div>
                </div>

                {/* Date */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Date</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            name="date" 
                            value={formData.date} 
                            onChange={handleChange}
                            required
                            className="input input-bordered w-full focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                        />
                    </div>
                </div>

                {/* Time */}
                <div className="form-control">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Time</label>
                    <div className="relative">
                        <input 
                            type="time" 
                            name="time" 
                            value={formData.time} 
                            onChange={handleChange}
                            required
                            className="input input-bordered w-full focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                        />
                    </div>
                </div>

                {/* Event Name */}
                <div className="form-control md:col-span-2">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Event Type</label>
                    <div className="relative">
                        <FaGlassCheers className="absolute left-3 top-3.5 text-gray-400"/>
                        <select 
                            name="event_name" 
                            value={formData.event_name} 
                            onChange={handleChange}
                            className="select select-bordered w-full pl-10 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="Birthday">Birthday</option>
                            <option value="Anniversary">Anniversary</option>
                            <option value="Reunion">Reunion</option>
                            <option value="Official Meetup">Official Meetup</option>
                            <option value="Wedding Program">Wedding Program</option>
                            <option value="Others..">Others..</option>
                        </select>
                    </div>
                </div>

                {/* Special Notes */}
                <div className="form-control md:col-span-2">
                    <label className="label text-xs font-bold text-gray-500 uppercase">Special Notes</label>
                    <div className="relative">
                        <FaPen className="absolute left-3 top-4 text-gray-400"/>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="textarea textarea-bordered w-full pl-10 h-24 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                            placeholder="Any allergies? Special seating request?"
                        ></textarea>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 mt-4">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn w-full bg-gray-900 text-amber-500 border-none hover:bg-gray-800 hover:text-amber-400 transition-all shadow-lg text-lg uppercase tracking-wider"
                    >
                        {loading ? <span className="loading loading-spinner"></span> : "Confirm Reservation"}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
}