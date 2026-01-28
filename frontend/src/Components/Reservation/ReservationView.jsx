import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash, FaCalendarAlt, FaClock, FaPhone, FaUsers, FaGlassCheers } from 'react-icons/fa';

export default function ReservationView() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      // Ensure this URL matches your backend route
      const res = await axios.get("http://localhost:8081/api/reservation");
      setReservations(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setLoading(false);
    }
  };

  // 2. Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;

    try {
      await axios.delete(`http://localhost:8081/api/reservation/delete/${id}`);
      
      // Remove from UI immediately to avoid page reload
      setReservations((prev) => prev.filter((item) => item.id !== id));
      alert("Reservation deleted successfully");
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete. Check console for details.");
    }
  };

  // Helper to format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
             <h1 className="text-3xl font-bold text-gray-900">Reservation List</h1>
             <p className="text-sm text-gray-500 mt-1">Manage incoming table bookings</p>
          </div>
          <div className="bg-gray-900 text-amber-500 px-4 py-2 rounded-lg font-bold shadow-md">
             Total: {reservations.length}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading reservations...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold text-amber-500">Details</th>
                    <th className="p-4 font-semibold text-amber-500">Event Info</th>
                    <th className="p-4 font-semibold text-amber-500">Date & Time</th>
                    <th className="p-4 font-semibold text-amber-500">Notes</th>
                    <th className="p-4 font-semibold text-amber-500 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.length > 0 ? (
                    reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-amber-50 transition-colors group">
                        
                        {/* 1. Name, Phone, ID */}
                        <td className="p-4 align-top">
                           <div className="font-bold text-gray-800 text-lg">{res.name}</div>
                           <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                             <FaPhone className="text-xs text-amber-600"/> {res.phone}
                           </div>
                           <div className="text-xs text-gray-400 mt-1">ID: #{res.id}</div>
                        </td>

                        {/* 2. Guests & Event Type */}
                        <td className="p-4 align-top">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                    <FaGlassCheers /> {res.event_name || 'N/A'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                <FaUsers className="text-gray-400"/> 
                                <span className="font-semibold">{res.guest_number} Guests</span>
                            </div>
                        </td>

                        {/* 3. Date & Time */}
                        <td className="p-4 align-top">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2 text-gray-700 font-medium">
                                    <FaCalendarAlt className="text-amber-600"/> {formatDate(res.date)}
                                </span>
                                <span className="flex items-center gap-2 text-gray-500 text-sm">
                                    <FaClock className="text-gray-400"/> {res.time}
                                </span>
                            </div>
                        </td>

                        {/* 4. Notes */}
                        <td className="p-4 align-top max-w-xs">
                            <p className="text-sm text-gray-500 italic truncate">
                                {res.notes ? `"${res.notes}"` : <span className="text-gray-300">No notes</span>}
                            </p>
                        </td>

                        {/* 5. Delete Action */}
                        <td className="p-4 align-middle text-center">
                            <button 
                                onClick={() => handleDelete(res.id)}
                                className="text-gray-300 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="Delete Reservation"
                            >
                                <FaTrash size={18} />
                            </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-gray-400">
                            No reservations found.
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}