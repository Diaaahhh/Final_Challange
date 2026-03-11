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
  FaMapMarkerAlt,
  FaFilter,
  FaUser 
} from "react-icons/fa";
import api from "../../api";

export default function ReservationView() {
  const [reservations, setReservations] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [selectedBranch, setSelectedBranch] = useState("All"); 
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState(null);
  
  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  const [editFormData, setEditFormData] = useState({
    id: "", 
    branch_id: "", 
    name: "", 
    phone: "", 
    guest_number: "", 
    event_name: "", 
    notes: "", 
    date: "", 
    time: "", 
    table_number: ""
  });

  // --- 1. Fetch Branches ---
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

  // --- 2. Fetch All Reservations ---
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reservation/list");
      setReservations(res.data || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // --- 3. FILTER LOGIC ---
  const filteredReservations = selectedBranch === "All"
    ? reservations
    : reservations.filter(res => {
        if (!res.branch_id) return false;
        return String(res.branch_id) === String(selectedBranch);
      });

  // --- Handle Outside Click for Calendar ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handle Cally Date Selection ---
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value).toISOString().split("T")[0];
        setEditFormData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  // --- CRUD Operations ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;
    try {
      await api.delete(`/reservation/delete/${id}`);
      fetchReservations();
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert("Failed to delete reservation: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // FIXED: Properly handles submission with error handling and loading state
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    
    try {
      // Prepare the data for submission
      const submissionData = {
        branch_id: editFormData.branch_id,
        name: editFormData.name,
        phone: editFormData.phone,
        guest_number: parseInt(editFormData.guest_number) || 0,
        event_name: editFormData.event_name || "Others..",
        notes: editFormData.notes || "",
        date: editFormData.date,
        time: editFormData.time,
        table_number: editFormData.table_number || ""
      };
      
      await api.put(`/reservation/update/${editFormData.id}`, submissionData);
      setOpenEditModal(false);
      fetchReservations();
    } catch (err) {
      console.error("Error updating reservation:", err);
      setEditError(err.response?.data?.error || "Failed to save changes. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const openView = (res) => {
    setSelectedRes(res);
    setOpenModal(true);
  };

  // FIXED: Properly formats date and prepares edit data
  const openEdit = (res) => {
    let safeDate = "";
    if (res.date) {
      const d = new Date(res.date);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        safeDate = `${y}-${m}-${day}`;
      }
    }

    setEditFormData({
      id: res.id,
      branch_id: res.branch_id || "",
      name: res.name || "",
      phone: res.phone || "",
      guest_number: res.guest_number || "",
      event_name: res.event_name || "Others..",
      notes: res.notes || "",
      date: safeDate,
      time: res.time || "",
      table_number: res.table_number || ""
    });
    setEditError("");
    setOpenEditModal(true);
  };

  const getBranchName = (branchId) => {
    if (!branchId) return "N/A";
    const branch = branches.find(b => String(b.branch_id) === String(branchId));
    return branch ? branch.branch_name : `Branch ${branchId}`;
  };

  return (
    <div className="p-6 bg-[#0E1014] min-h-screen text-white font-['Inter']">
      
      {/* Header and Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-white">
            Reservations
          </h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Manage and view all table bookings.</p>
        </div>
        
        <div className="flex gap-3 mt-6 md:mt-0 items-center">
          
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-xs" />
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:border-[#007BFF] focus:outline-none appearance-none cursor-pointer min-w-[150px] hover:border-[#007BFF] transition-colors"
            >
              <option value="All" className="bg-[#1A1A1A]">All Branches</option>
              {Array.isArray(branches) && branches.map((branch) => (
                <option key={branch.id} value={branch.branch_id} className="bg-[#1A1A1A]">
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#1A1A1A] px-4 py-2 rounded-lg border border-[#2A2A2A] shadow-sm">
            <span className="text-[#C59D5F] font-bold text-lg">{filteredReservations.length}</span> <span className="text-[#A0A0A0] text-sm uppercase tracking-wide">Total Bookings</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#A0A0A0] flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#C59D5F] border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading reservations...
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-10 text-center text-[#A0A0A0] flex flex-col items-center">
            <FaBookOpen className="text-4xl text-[#3A3A3A] mb-3" />
            <p>No reservations found for this branch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#222222] border-b border-[#333] text-[#A0A0A0] text-xs uppercase tracking-wider font-bold">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#2A2A2A]">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-[#202020] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white mb-1">{res.name}</div>
                      <div className="text-[#A0A0A0] flex items-center gap-2 text-xs">
                        <FaPhone className="text-[#C59D5F]" /> {res.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#2A2A2A] text-[#C59D5F] px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {getBranchName(res.branch_id)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[#E0E0E0] mb-1">
                        <FaCalendarAlt className="text-[#C59D5F]" /> 
                        {res.date ? new Date(res.date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-[#A0A0A0] text-xs">
                        <FaClock className="text-[#C59D5F]" /> {res.time}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 mb-1">
                        <span className="flex items-center gap-1 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-xs text-[#E0E0E0]">
                          <FaUsers className="text-[#007BFF]" /> {res.guest_number}
                        </span>
                        <span className="flex items-center gap-1 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-xs text-[#E0E0E0]">
                          <FaUtensils className="text-[#28A745]" /> Table: {res.table_number || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-[#A0A0A0] flex items-center gap-1">
                        <FaGlassCheers className="text-[#FFC107]" /> {res.event_name || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => openView(res)} 
                          className="text-[#A0A0A0] hover:text-white transition-colors" 
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button 
                          onClick={() => openEdit(res)} 
                          className="text-[#007BFF] hover:text-[#3399FF] transition-colors" 
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(res.id)} 
                          className="text-[#DC3545] hover:text-[#FF4C4C] transition-colors" 
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- VIEW MODAL --- */}
      {openModal && selectedRes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in">
          <div className="bg-[#1A1A1A] w-full max-w-md rounded-2xl shadow-2xl border border-[#333] overflow-hidden">
            <div className="bg-[#0E1014] p-5 border-b border-[#333] flex justify-between items-center">
              <h2 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaBookOpen className="text-[#C59D5F]" /> Booking Details
              </h2>
              <button onClick={() => setOpenModal(false)} className="text-[#A0A0A0] hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Customer Name</p>
                  <p className="font-bold text-white">{selectedRes.name}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Phone Number</p>
                  <p className="font-bold text-white">{selectedRes.phone}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Branch</p>
                  <p className="font-bold text-[#C59D5F]">{getBranchName(selectedRes.branch_id)}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Date & Time</p>
                  <p className="font-bold text-white">
                    {selectedRes.date ? new Date(selectedRes.date).toLocaleDateString() : ''} at {selectedRes.time}
                  </p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Table Number(s)</p>
                  <p className="font-bold text-white">{selectedRes.table_number || "None Assigned"}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0] uppercase mb-1">Guests</p>
                  <p className="font-bold text-white">{selectedRes.guest_number} People</p>
                </div>
              </div>
              
              <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                <p className="text-xs text-[#A0A0A0] uppercase mb-1">Occasion / Event</p>
                <p className="font-bold text-white">{selectedRes.event_name || "N/A"}</p>
              </div>

              <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                <p className="text-xs text-[#A0A0A0] uppercase mb-1">Special Notes</p>
                <p className="text-[#E0E0E0]">{selectedRes.notes || "No special requests provided."}</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#333] bg-[#111]">
              <button onClick={() => setOpenModal(false)} className="w-full bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-widest text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {openEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in">
          <div className="bg-[#1A1A1A] w-full max-w-lg rounded-2xl shadow-2xl border border-[#333] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0E1014] p-5 border-b border-[#333] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaEdit className="text-[#007BFF]" /> Edit Booking
              </h2>
              <button onClick={() => setOpenEditModal(false)} className="text-[#A0A0A0] hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {editError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input 
                        type="text" 
                        name="name" 
                        value={editFormData.name} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Phone</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input 
                        type="text" 
                        name="phone" 
                        value={editFormData.phone} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Branch</label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <select 
                        name="branch_id" 
                        value={editFormData.branch_id} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors appearance-none font-['Arial']" 
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Table No.</label>
                    <div className="relative">
                      <FaUtensils className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input 
                        type="text" 
                        name="table_number" 
                        value={editFormData.table_number} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors" 
                        placeholder="e.g. 1, 2, 3" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" ref={calendarContainerRef}>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Date</label>
                    <button 
                      type="button" 
                      onClick={() => setShowCalendar(!showCalendar)} 
                      className="w-full text-left bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors relative"
                    >
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F]" />
                      {editFormData.date || "Select Date"}
                    </button>
                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3">
                        <calendar-date 
                          ref={calendarRef} 
                          className="cally text-gray-900" 
                          value={editFormData.date}
                          min={new Date().toISOString().split("T")[0]}
                        >
                          <svg slot="previous" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                          </svg>
                          <svg slot="next" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                          </svg>
                          <calendar-month></calendar-month>
                        </calendar-date>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Time</label>
                    <div className="relative">
                      <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input 
                        type="time" 
                        name="time" 
                        value={editFormData.time} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Guests</label>
                    <div className="relative">
                      <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input 
                        type="number" 
                        name="guest_number" 
                        value={editFormData.guest_number} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors" 
                        min="1"
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Event</label>
                    <div className="relative">
                      <FaGlassCheers className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <select 
                        name="event_name" 
                        value={editFormData.event_name} 
                        onChange={handleEditChange} 
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors appearance-none font-['Arial']"
                      >
                        <option className="bg-[#222] text-white" value="Birthday">Birthday</option>
                        <option className="bg-[#222] text-white" value="Anniversary">Anniversary</option>
                        <option className="bg-[#222] text-white" value="Business Meeting">Business Meeting</option>
                        <option className="bg-[#222] text-white" value="Corporate Lunch">Corporate Lunch</option>
                        <option className="bg-[#222] text-white" value="Family Gathering">Family Gathering</option>
                        <option className="bg-[#222] text-white" value="Reunion">Reunion</option>
                        <option className="bg-[#222] text-white" value="Valentine’s Day Dinner">Valentine’s Day Dinner</option>
                        <option className="bg-[#222] text-white" value="Charity Event">Charity Event</option>
                        <option className="bg-[#222] text-white" value="VIP Reservation">VIP Reservation</option>
                        <option className="bg-[#222] text-white" value="Others..">Others...</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1">Notes</label>
                  <textarea 
                    name="notes" 
                    rows="3" 
                    value={editFormData.notes} 
                    onChange={handleEditChange} 
                    className="w-full bg-[#222] border border-[#333] p-3 rounded-lg outline-none text-white text-sm focus:border-[#007BFF] transition-colors placeholder-[#666]" 
                    placeholder="Any special requests?"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest font-['Barlow_Condensed'] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}