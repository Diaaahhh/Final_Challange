import React, { useEffect, useState, useRef } from "react";
import "cally"; 
import {
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaPhone,
  FaUsers,
  FaGlassCheers,
  FaEye,
  FaEdit,
  FaSave,
  FaBookOpen,
  FaTimes
} from "react-icons/fa";
import api from "../../api";

export default function ReservationView() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  const [editFormData, setEditFormData] = useState({
    id: "", name: "", phone: "", guest_number: "", event_name: "", notes: "", date: "", time: "",
  });

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

  // Listen for Cally date changes
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        setEditFormData((prev) => ({ ...prev, date: e.target.value }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reservation");
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (res) => {
    let formattedDate = res.date ? new Date(res.date).toISOString().split("T")[0] : "";
    let formattedTime = res.time ? res.time.substring(0, 5) : "";

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
      await api.put(`/reservation/update/${editFormData.id}`, editFormData);
      setReservations((prev) =>
        prev.map((item) => (item.id === editFormData.id ? { ...item, ...editFormData } : item))
      );
      setOpenEditModal(false);
    } catch (err) {
      alert("Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/reservation/delete/${id}`);
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleView = (res) => {
    setSelectedRes(res);
    setOpenModal(true);
  };

  const formatDateDDMMYY = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pt-24 pb-12 px-4 font-['Inter']">
      <style>{`
        calendar-date.cally {
          --color-accent: #C59D5F;
          --color-text: #1E293B;
          --color-bg: #ffffff;
          --color-bg-hover: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px;
          background: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
        calendar-month {
          --color-text-header: #1E293B;
          font-weight: 600;
        }
      `}</style>

      <div className="container mx-auto max-w-7xl">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#E2E8F0] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-[#1E293B]">
              Booking<span className="text-[#C59D5F]">List</span>
            </h1>
            <p className="text-[#64748B] text-sm mt-2 font-medium tracking-wide">Manage incoming table reservations</p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0 items-center">
             <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-lg shadow-sm text-sm font-bold">
                <span className="text-[#64748B] mr-2">Total:</span>
                <span className="text-[#C59D5F]">{reservations.length}</span>
             </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F1F5F9] text-[#64748B] text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-[#E2E8F0]">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12 text-[#C59D5F]">Loading Reservations...</td></tr>
                ) : reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[#1E293B] font-['Barlow_Condensed'] text-lg tracking-wide uppercase">{res.name}</div>
                        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1"><FaPhone className="text-[#C59D5F]" /> {res.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold uppercase flex items-center gap-1 w-fit">
                          <FaGlassCheers /> {res.event_name || "Casual"}
                        </span>
                        <div className="text-xs text-[#475569] mt-2 flex items-center gap-1 font-medium"><FaUsers className="text-[#64748B]" /> {res.guest_number} Guests</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[#1E293B] font-mono text-sm font-bold flex items-center gap-2">
                            <FaCalendarAlt className="text-[#C59D5F]" /> {formatDateDDMMYY(res.date)}
                          </span>
                          <span className="text-[#64748B] text-xs flex items-center gap-2"><FaClock /> {res.time}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#64748B] text-xs max-w-[180px] truncate italic">{res.notes || "No special requests"}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                            <button onClick={() => handleView(res)} className="p-2 text-[#64748B] hover:text-[#C59D5F] transition-colors"><FaEye /></button>
                            <button onClick={() => handleEditClick(res)} className="p-2 text-[#64748B] hover:text-blue-600 transition-colors"><FaEdit /></button>
                            <button onClick={() => handleDelete(res.id)} className="p-2 text-[#64748B] hover:text-red-500 transition-colors"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#64748B]">
                      <FaBookOpen className="mx-auto text-4xl mb-3 opacity-20" /> No reservations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- DETAILS MODAL --- */}
      {openModal && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#F1F5F9] p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-[#1E293B] uppercase tracking-wider">Booking Details</h3>
              <button onClick={() => setOpenModal(false)} className="text-[#64748B] hover:text-[#1E293B]"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-xs text-[#64748B] uppercase font-bold">Customer Name</label>
                  <p className="text-3xl font-['Barlow_Condensed'] text-[#1E293B] font-bold">{selectedRes.name}</p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-[#64748B] uppercase font-bold">Phone</label>
                  <p className="text-lg text-[#C59D5F] font-mono font-bold">{selectedRes.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                  <label className="text-xs text-[#64748B] uppercase font-bold block mb-1">Date & Time</label>
                  <p className="text-[#1E293B] font-bold flex items-center gap-2">
                    <FaCalendarAlt className="text-[#C59D5F]" /> {formatDateDDMMYY(selectedRes.date)} @ {selectedRes.time}
                  </p>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                  <label className="text-xs text-[#64748B] uppercase font-bold block mb-1">Guests</label>
                  <p className="text-[#1E293B] font-bold flex items-center gap-2">
                    <FaUsers className="text-[#C59D5F]" /> {selectedRes.guest_number} People
                  </p>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
  <label className="text-xs text-[#64748B] uppercase font-bold block mb-2">Special Notes</label>
  {/* Added max-height and overflow-y-auto for the scroller */}
  <div className="max-h-[60px] overflow-y-auto pr-2">
    <p className="text-[#475569] text-sm leading-relaxed italic break-words">
      {selectedRes.notes ? `"${selectedRes.notes}"` : "No special instructions provided."}
    </p>
  </div>
</div>
              
              <button onClick={() => setOpenModal(false)} className="w-full bg-[#1E293B] text-white font-bold py-3 rounded-xl hover:bg-[#C59D5F] transition-colors uppercase tracking-widest text-sm font-['Barlow_Condensed']">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {openEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] relative overflow-visible">
            <div className="bg-[#F1F5F9] p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-[#1E293B] uppercase tracking-wider">Modify Reservation</h3>
              <button onClick={() => setOpenEditModal(false)} className="text-[#64748B] hover:text-[#1E293B]"><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase">Name</label>
                  <input required type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full mt-1 bg-[#F1F5F9] border border-[#E2E8F0] p-2 rounded-lg outline-none text-[#1E293B] font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase">Phone</label>
                  <input required type="text" name="phone" value={editFormData.phone} onChange={handleEditChange} className="w-full mt-1 bg-[#F1F5F9] border border-[#E2E8F0] p-2 rounded-lg outline-none text-[#1E293B] font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={calendarContainerRef}>
                  <label className="text-xs font-bold text-[#64748B] uppercase">Date</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full mt-1 bg-[#F1F5F9] border border-[#E2E8F0] p-2 rounded-lg text-left text-[#1E293B] font-medium flex items-center gap-2"
                  >
                    <FaCalendarAlt className="text-[#C59D5F]" />
                    {editFormData.date ? formatDateDDMMYY(editFormData.date) : "Select Date"}
                  </button>

                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-1 z-[100]">
                      <calendar-date
                        ref={calendarRef}
                        className="cally"
                        value={editFormData.date}
                        min={new Date().toISOString().split("T")[0]}
                      >
                        <svg slot="previous" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                        <svg slot="next" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        <calendar-month></calendar-month>
                      </calendar-date>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-[#64748B] uppercase">Time</label>
                  <div className="relative mt-1">
                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                    <input
                      required
                      type="time"
                      name="time"
                      value={editFormData.time}
                      onChange={handleEditChange}
                      className="w-full bg-[#F1F5F9] border border-[#E2E8F0] p-2 pl-10 rounded-lg outline-none text-[#1E293B] focus:border-[#C59D5F] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase">Notes</label>
                <textarea name="notes" rows="3" value={editFormData.notes} onChange={handleEditChange} className="w-full mt-1 bg-[#F1F5F9] border border-[#E2E8F0] p-2 rounded-lg outline-none text-[#1E293B] text-sm"></textarea>
              </div>

              <button type="submit" className="w-full bg-[#C59D5F] hover:bg-[#b08d55] text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest font-['Barlow_Condensed']">
                <FaSave /> Update Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}