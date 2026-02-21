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
  FaTimes,
  FaUtensils,
  FaMapMarkerAlt 
} from "react-icons/fa";
import api from "../../api";

export default function ReservationView() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const [floorPlan, setFloorPlan] = useState([]);
  
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  const [editFormData, setEditFormData] = useState({
    id: "", name: "", phone: "", guest_number: "", event_name: "", notes: "", date: "", time: "", table_number: ""
  });

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
      table_number: res.table_number || "" 
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
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-12 px-4 font-['Inter']">
      <style>{`
        calendar-date.cally {
          --color-accent: #007BFF;
          --color-text: #ffffff;
          --color-bg: #111111;
          --color-bg-hover: #1A1A1A;
          border: 1px solid #2A2A2A;
          border-radius: 12px;
          padding: 12px;
          background: #111111;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,123,255,0.05);
        }
        calendar-month {
          --color-text-header: #007BFF;
          font-weight: 600;
        }
      `}</style>

      <div className="container mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#1E1E1E] pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-['Barlow_Condensed'] font-bold uppercase text-white">
              Booking<span className="text-[#007BFF]">List</span>
            </h1>
            <p className="text-[#A0A0A0] text-sm mt-2 font-medium tracking-wide">Manage incoming table reservations</p>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0 items-center">
             <div className="bg-[#111111] border border-[#2A2A2A] px-4 py-2 rounded-lg shadow-sm text-sm font-bold">
                <span className="text-[#A0A0A0] mr-2">Total:</span>
                <span className="text-[#007BFF]">{reservations.length}</span>
             </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-[#111111] rounded-xl border border-[#1E1E1E] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0A0A0A] text-[#A0A0A0] text-xs uppercase tracking-wider font-['Barlow_Condensed'] border-b border-[#1E1E1E]">
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Table No</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-12 text-[#007BFF] font-bold tracking-widest">Loading Reservations...</td></tr>
                ) : reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-[#1A1A1A] transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-white font-['Barlow_Condensed'] text-lg tracking-wide uppercase">{res.name}</div>
                        <div className="flex items-center gap-2 text-xs text-[#A0A0A0] mt-1"><FaPhone className="text-[#C59D5F]" /> {res.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] bg-[#007BFF]/10 text-[#007BFF] px-2 py-1 rounded border border-[#007BFF]/20 font-bold uppercase flex items-center gap-1 w-fit">
                          <FaGlassCheers /> {res.event_name || "Casual"}
                        </span>
                        <div className="text-xs text-[#A0A0A0] mt-2 flex items-center gap-1 font-medium"><FaUsers className="text-[#555]" /> {res.guest_number} Guests</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-mono text-sm font-bold flex items-center gap-2">
                            <FaCalendarAlt className="text-[#C59D5F]" /> {formatDateDDMMYY(res.date)}
                          </span>
                          <span className="text-[#A0A0A0] text-xs flex items-center gap-2">{res.time}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {res.table_number ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#C59D5F]/20 text-[#C59D5F] flex items-center justify-center font-bold text-sm border border-[#C59D5F]/30">
                              <FaUtensils size={10} />
                            </div>
                            <span className="text-sm font-bold text-white">{res.table_number}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#444] italic">Not Assigned</span>
                        )}
                      </td>
                      
                      <td className="p-4 text-[#A0A0A0] text-xs max-w-[180px] truncate italic">{res.notes || "No special requests"}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                            <button onClick={() => handleView(res)} className="p-2 text-[#555] hover:text-[#007BFF] transition-colors rounded hover:bg-[#007BFF]/10"><FaEye /></button>
                            <button onClick={() => handleEditClick(res)} className="p-2 text-[#555] hover:text-blue-400 transition-colors rounded hover:bg-blue-400/10"><FaEdit /></button>
                            <button onClick={() => handleDelete(res.id)} className="p-2 text-[#555] hover:text-red-400 transition-colors rounded hover:bg-red-400/10"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-[#555]">
                      <FaBookOpen className="mx-auto text-4xl mb-3 opacity-20" /> 
                      <p className="text-[#A0A0A0]">No reservations found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {openModal && selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-[#2A2A2A] relative overflow-hidden">
            <div className="bg-[#0A0A0A] p-6 border-b border-[#1E1E1E] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">Booking Details</h3>
              <button onClick={() => setOpenModal(false)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Customer Name</label>
                  <p className="text-3xl font-['Barlow_Condensed'] text-white font-bold mt-1">{selectedRes.name}</p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold tracking-wider">Phone</label>
                  <p className="text-lg text-[#C59D5F] font-mono font-bold mt-1">{selectedRes.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold block mb-2 tracking-wider">Date & Time</label>
                  <p className="text-white font-bold flex items-center gap-2">
                    <FaCalendarAlt className="text-[#C59D5F]" /> {formatDateDDMMYY(selectedRes.date)} @ {selectedRes.time}
                  </p>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                  <label className="text-xs text-[#A0A0A0] uppercase font-bold block mb-2 tracking-wider">Guests</label>
                  <p className="text-white font-bold flex items-center gap-2">
                    <FaUsers className="text-[#C59D5F]" /> {selectedRes.guest_number} People
                  </p>
                </div>
              </div>

              <div className="bg-[#C59D5F]/10 p-4 rounded-lg border border-[#C59D5F]/20">
                 <label className="text-xs text-[#C59D5F] uppercase font-bold block mb-2 tracking-wider">Assigned Table(s)</label>
                 <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-[#C59D5F]" />
                    <span className="text-xl font-bold text-white">{selectedRes.table_number || "None"}</span>
                 </div>
              </div>

              <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#1E1E1E]">
                <label className="text-xs text-[#A0A0A0] uppercase font-bold block mb-2 tracking-wider">Special Notes</label>
                <div className="max-h-[60px] overflow-y-auto pr-2">
                  <p className="text-[#C0C0C0] text-sm leading-relaxed italic break-words">
                    {selectedRes.notes ? `"${selectedRes.notes}"` : "No special instructions provided."}
                  </p>
                </div>
              </div>
              
              <button onClick={() => setOpenModal(false)} className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-black font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-sm font-['Barlow_Condensed'] shadow-[0_0_20px_rgba(0,123,255,0.3)]">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {openEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-[#2A2A2A] relative overflow-visible">
            <div className="bg-[#0A0A0A] p-6 border-b border-[#1E1E1E] flex justify-between items-center">
              <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">Modify Reservation</h3>
              <button onClick={() => setOpenEditModal(false)} className="text-[#555] hover:text-[#007BFF] transition-colors text-lg"><FaTimes /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Name</label>
                  <input required type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] p-2 rounded-lg outline-none text-white font-bold focus:border-[#007BFF] transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Phone</label>
                  <input required type="text" name="phone" value={editFormData.phone} onChange={handleEditChange} className="w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] p-2 rounded-lg outline-none text-white font-mono focus:border-[#007BFF] transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={calendarContainerRef}>
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Date</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] p-2 rounded-lg text-left text-white font-medium flex items-center gap-2 hover:border-[#007BFF] transition-colors"
                  >
                    <FaCalendarAlt className="text-[#007BFF]" />
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
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Time</label>
                  <div className="relative mt-1">
                    <input
                      required
                      type="time"
                      name="time"
                      value={editFormData.time}
                      onChange={handleEditChange}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] p-2 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Assigned Table(s)</label>
                <div className="relative mt-1">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                    <input 
                        type="text" 
                        name="table_number" 
                        value={editFormData.table_number} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] p-2 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors"
                        placeholder="e.g. 1, 2"
                    />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Notes</label>
                <textarea name="notes" rows="3" value={editFormData.notes} onChange={handleEditChange} className="w-full mt-1 bg-[#1A1A1A] border border-[#2A2A2A] p-2 rounded-lg outline-none text-white text-sm focus:border-[#007BFF] transition-colors"></textarea>
              </div>

              <button type="submit" className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-black font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest font-['Barlow_Condensed'] shadow-[0_0_20px_rgba(0,123,255,0.2)] text-base">
                <FaSave /> Update Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}