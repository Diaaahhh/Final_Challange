import React, { useEffect, useState } from "react";
import {
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaPhone,
  FaUsers,
  FaGlassCheers,
  FaEye,
  FaTimes,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import api from "../../api";

export default function ReservationView() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedRes, setSelectedRes] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // --- EDIT STATE ---
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    phone: "",
    guest_number: "",
    event_name: "",
    notes: "",
    date: "",
    time: "",
  });

  // 1. Fetch Data
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get("/reservation");
      setReservations(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setLoading(false);
    }
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = (res) => {
    // 1. Format Date: Convert to YYYY-MM-DD for the native date input
    let formattedDate = "";
    if (res.date) {
      formattedDate = new Date(res.date).toISOString().split("T")[0];
    }

    // 2. Format Time: Cut off seconds
    let formattedTime = "";
    if (res.time) {
      formattedTime = res.time.substring(0, 5);
    }

    setEditFormData({
      id: res.id,
      name: res.name,
      phone: res.phone,
      guest_number: res.guest_number,
      event_name: res.event_name || "Casual",
      notes: res.notes || "",
      date: formattedDate,
      time: formattedTime,
    });

    setOpenEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(
        `/reservation/update/${editFormData.id}`,
        editFormData
      );

      setReservations((prev) =>
        prev.map((item) =>
          item.id === editFormData.id ? { ...item, ...editFormData } : item
        )
      );

      setOpenEditModal(false);
      alert("Reservation updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?"))
      return;
    try {
      await api.delete(`/reservation/delete/${id}`);
      setReservations((prev) => prev.filter((item) => item.id !== id));
      alert("Reservation deleted successfully");
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Failed to delete.");
    }
  };

  const handleView = (res) => {
    setSelectedRes(res);
    setOpenModal(true);
  };

  const formatDateDDMMYY = (dateString) => {
    if (!dateString) return "Select date";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reservation List
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage incoming table bookings
            </p>
          </div>
          <div className="bg-gray-900 text-amber-500 px-4 py-2 rounded-lg font-bold shadow-md">
            Total: {reservations.length}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading reservations...
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold text-amber-500">
                      Details
                    </th>
                    <th className="p-4 font-semibold text-amber-500">
                      Event Info
                    </th>
                    <th className="p-4 font-semibold text-amber-500">
                      Date & Time
                    </th>
                    <th className="p-4 font-semibold text-amber-500">Notes</th>
                    <th className="p-4 font-semibold text-amber-500 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.length > 0 ? (
                    reservations.map((res) => (
                      <tr
                        key={res.id}
                        className="hover:bg-amber-50 transition-colors group"
                      >
                        <td className="p-4 align-top">
                          <div className="font-bold text-gray-800 text-lg">
                            {res.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <FaPhone className="text-xs text-amber-600" />{" "}
                            {res.phone}
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit mb-2">
                            <FaGlassCheers /> {res.event_name || "N/A"}
                          </span>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <FaUsers className="text-gray-400" />
                            <span className="font-semibold">
                              {res.guest_number} Guests
                            </span>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-gray-700 font-medium">
                              <FaCalendarAlt className="text-amber-600" />{" "}
                              {formatDateDDMMYY(res.date)}
                            </span>
                            <span className="flex items-center gap-2 text-gray-500 text-sm">
                              <FaClock className="text-gray-400" /> {res.time}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 align-top max-w-xs">
                          <p className="text-sm text-gray-500 italic truncate">
                            {res.notes ? (
                              `"${res.notes}"`
                            ) : (
                              <span className="text-gray-300">No notes</span>
                            )}
                          </p>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleView(res)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                              title="View Details"
                            >
                              <FaEye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditClick(res)}
                              className="text-gray-400 hover:text-amber-600 transition-colors p-2 rounded-full hover:bg-amber-50"
                              title="Edit Reservation"
                            >
                              <FaEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(res.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                              title="Delete Reservation"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-12 text-center text-gray-400"
                      >
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

      {/* --- DETAILS MODAL --- */}
      {openModal && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaGlassCheers className="text-amber-500" /> Booking Details
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="hover:rotate-90 transition-transform text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  Customer
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedRes.name}
                </p>
                <p className="text-amber-600 font-medium flex items-center gap-2 mt-1">
                  <FaPhone size={12} /> {selectedRes.phone}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Date
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {formatDateDDMMYY(selectedRes.date)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Time
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {selectedRes.time}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Guests
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {selectedRes.guest_number} People
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Event
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {selectedRes.event_name || "General"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">
                  Special Notes
                </label>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-gray-700 italic text-sm leading-relaxed max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200">
                  {selectedRes.notes ? (
                    `"${selectedRes.notes}"`
                  ) : (
                    <span className="text-gray-400">
                      No special instructions provided.
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setOpenModal(false)}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {openEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-500 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaEdit /> Edit Reservation
              </h3>
              <button
                onClick={() => setOpenEditModal(false)}
                className="hover:rotate-90 transition-transform text-amber-100 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Phone
                  </label>
                  <input
                    required
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* --- NORMAL NATIVE DATE INPUT --- */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Time
                  </label>
                  <input
                    required
                    type="time"
                    name="time"
                    value={editFormData.time}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Guests
                  </label>
                  <input
                    required
                    type="number"
                    name="guest_number"
                    value={editFormData.guest_number}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Event Type
                  </label>
                  <select
                    name="event_name"
                    value={editFormData.event_name}
                    onChange={handleEditChange}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900"
                  >
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Casual">Casual</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  value={editFormData.notes}
                  onChange={handleEditChange}
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-gray-900"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <FaSave /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}