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
  FaUser,
  FaMoneyBillWave,
  FaHourglassHalf,
  FaInfoCircle
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

  // Updated to match new DB schema
  const [editFormData, setEditFormData] = useState({
    id: "",
    branch_id: "",
    table_number: "",
    date: "",
    time: "",
    duration: 90,
    status: 0,
    advance_payment: 0,
    customer_id: ""
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

  // --- 3. FILTER LOGIC (Updated to re_branch_id) ---
  const filteredReservations =
    selectedBranch === "All"
      ? reservations
      : reservations.filter((res) => {
          if (!res.re_branch_id) return false;
          return String(res.re_branch_id) === String(selectedBranch);
        });

  // --- Handle Outside Click for Calendar ---
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

  // --- Handle Cally Date Selection ---
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value)
          .toISOString()
          .split("T")[0];
        setEditFormData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  // --- CRUD Operations ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reservation?"))
      return;
    try {
      await api.delete(`/reservation/delete/${id}`);
      fetchReservations();
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert(
        "Failed to delete reservation: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      // Prepare the data for submission matching the new backend schema
      const submissionData = {
        branch_id: editFormData.branch_id,
        table_number: editFormData.table_number,
        date: editFormData.date,
        time: editFormData.time,
        duration: parseInt(editFormData.duration) || 90,
        status: parseInt(editFormData.status) || 0,
        advance_payment: parseFloat(editFormData.advance_payment) || 0.00,
        customer_id: editFormData.customer_id || null
      };

      await api.put(`/reservation/update/${editFormData.id}`, submissionData);
      setOpenEditModal(false);
      fetchReservations();
    } catch (err) {
      console.error("Error updating reservation:", err);
      setEditError(
        err.response?.data?.error || "Failed to save changes. Please try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const openView = (res) => {
    setSelectedRes(res);
    setOpenModal(true);
  };

  // Extract Date and Time from DATETIME column
  const openEdit = (res) => {
    let safeDate = "";
    let safeTime = "";
    
    if (res.re_date) {
      const d = new Date(res.re_date);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        safeDate = `${y}-${m}-${day}`;

        const hr = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        safeTime = `${hr}:${min}`;
      } else if (typeof res.re_date === 'string') {
        const parts = res.re_date.split(/T|\s/);
        safeDate = parts[0];
        safeTime = parts[1] ? parts[1].substring(0, 5) : "";
      }
    }

    setEditFormData({
      id: res.id,
      branch_id: res.re_branch_id || "",
      table_number: res.re_table_no || "",
      date: safeDate,
      time: safeTime,
      duration: res.re_duration || 90,
      status: res.re_status !== undefined ? res.re_status : 0,
      advance_payment: res.re_adv_payment || 0,
      customer_id: res.re_customer_id || ""
    });
    setEditError("");
    setOpenEditModal(true);
  };

  const getBranchName = (branchId) => {
    if (!branchId) return "N/A";
    const branch = branches.find(
      (b) => String(b.branch_id) === String(branchId)
    );
    return branch ? branch.branch_name : `Branch ${branchId}`;
  };

  const getStatusBadge = (status) => {
    switch (Number(status)) {
      case 0: return <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-1 rounded text-[10px] font-bold  tracking-wider">Pending</span>;
      case 1: return <span className="bg-green-500/20 text-green-500 border border-green-500/50 px-2 py-1 rounded text-[10px] font-bold  tracking-wider">Confirmed</span>;
      case 2: return <span className="bg-blue-500/20 text-blue-500 border border-blue-500/50 px-2 py-1 rounded text-[10px] font-bold  tracking-wider">Hold</span>;
      case 3: return <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-[10px] font-bold  tracking-wider">Expired/Reject</span>;
      default: return <span className="bg-gray-500/20 text-gray-500 px-2 py-1 rounded text-xs font-bold ">Unknown</span>;
    }
  };

  return (
    <div className="p-6 bg-[#0E1014] min-h-screen text-white font-['Inter']">
      {/* Header and Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-['Barlow_Condensed'] font-bold  tracking-wider text-white">
            Reservations
          </h1>
          <p className="text-[#A0A0A0] text-sm mt-1">
            Manage and view all table bookings.
          </p>
        </div>

        <div className="flex gap-3 mt-6 md:mt-0 items-center">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-xs" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] text-white pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:border-[#007BFF] focus:outline-none appearance-none cursor-pointer min-w-[150px] hover:border-[#007BFF] transition-colors"
            >
              <option value="All" className="bg-[#1A1A1A]">
                All Branches
              </option>
              {Array.isArray(branches) &&
                branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.branch_id}
                    className="bg-[#1A1A1A]"
                  >
                    {branch.branch_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="bg-[#1A1A1A] px-4 py-2 rounded-lg border border-[#2A2A2A] shadow-sm">
            <span className="text-[#C59D5F] font-bold text-lg">
              {filteredReservations.length}
            </span>{" "}
            <span className="text-[#A0A0A0] text-sm  tracking-wide">
              Total Bookings
            </span>
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
                <tr className="bg-[#222222] border-b border-[#333] text-[#A0A0A0] text-xs  tracking-wider font-bold">
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Status & Payment</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#2A2A2A]">
                {filteredReservations.map((res) => {
                  
                  // Format Date nicely for the table
                  let displayDate = "N/A";
                  let displayTime = "N/A";
                  if (res.re_date) {
                    const d = new Date(res.re_date);
                    if (!isNaN(d.getTime())) {
                       displayDate = d.toLocaleDateString();
                       displayTime = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else if (typeof res.re_date === 'string') {
                       const parts = res.re_date.split(/T|\s/);
                       displayDate = parts[0];
                       displayTime = parts[1] ? parts[1].substring(0, 5) : "";
                    }
                  }

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-[#202020] transition-colors"
                    >
                      <td className="p-4 text-[#E0E0E0] font-medium">
                        {res.re_customer_id ? `#CUST-${res.re_customer_id}` : <span className="text-gray-500 italic">Guest</span>}
                      </td>
                      <td className="p-4">
                        <span className="bg-[#2A2A2A] text-[#C59D5F] px-2 py-1 rounded text-xs font-bold  tracking-wider">
                          {getBranchName(res.re_branch_id)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-[#E0E0E0] mb-1">
                          <FaCalendarAlt className="text-[#C59D5F]" />
                          {displayDate}
                        </div>
                        <div className="flex items-center gap-2 text-[#A0A0A0] text-xs">
                          <FaClock className="text-[#C59D5F]" /> {displayTime}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 mb-1">
                          <span className="flex items-center w-fit gap-1 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-xs text-[#E0E0E0]">
                            <FaUtensils className="text-[#28A745]" /> Table: {res.re_table_no || "N/A"}
                          </span>
                          <span className="flex items-center w-fit gap-1 bg-[#151515] border border-[#333] px-2 py-0.5 rounded text-[11px] text-[#A0A0A0]">
                            <FaHourglassHalf className="text-[#007BFF]" /> {res.re_duration} mins
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="mb-2">
                          {getStatusBadge(res.re_status)}
                        </div>
                        <div className="text-[11px] text-green-400 font-bold flex items-center gap-1">
                          <FaMoneyBillWave /> Adv: ৳{res.re_adv_payment}
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
                  )
                })}
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
              <h2 className="text-xl font-['Barlow_Condensed'] font-bold text-white  tracking-wider flex items-center gap-2">
                <FaBookOpen className="text-[#C59D5F]" /> Booking Details
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="text-[#A0A0A0] hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Customer ID
                  </p>
                  <p className="font-bold text-white">{selectedRes.re_customer_id || "Guest"}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Status
                  </p>
                  <p className="font-bold text-white mt-1">{getStatusBadge(selectedRes.re_status)}</p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Branch
                  </p>
                  <p className="font-bold text-[#C59D5F]">
                    {getBranchName(selectedRes.re_branch_id)}
                  </p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Date & Time
                  </p>
                  <p className="font-bold text-white">
                    {selectedRes.re_date ? new Date(selectedRes.re_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                  </p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Table Number(s)
                  </p>
                  <p className="font-bold text-white">
                    {selectedRes.re_table_no || "None Assigned"}
                  </p>
                </div>
                <div className="bg-[#222] p-3 rounded-lg border border-[#333]">
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Duration
                  </p>
                  <p className="font-bold text-white">
                    {selectedRes.re_duration} Minutes
                  </p>
                </div>
              </div>

              <div className="bg-[#222] p-3 rounded-lg border border-[#333] flex justify-between items-center">
                <div>
                  <p className="text-xs text-[#A0A0A0]  mb-1">
                    Advance Payment
                  </p>
                  <p className="text-xl font-bold text-green-500">
                    ৳{selectedRes.re_adv_payment}
                  </p>
                </div>
                <FaMoneyBillWave className="text-green-500/20 text-4xl" />
              </div>
            </div>

            <div className="p-4 border-t border-[#333] bg-[#111]">
              <button
                onClick={() => setOpenModal(false)}
                className="w-full bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors  tracking-widest text-sm"
              >
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
              <h2 className="text-xl font-['Barlow_Condensed'] font-bold text-white  tracking-wider flex items-center gap-2">
                <FaEdit className="text-[#007BFF]" /> Edit Booking
              </h2>
              <button
                onClick={() => setOpenEditModal(false)}
                className="text-[#A0A0A0] hover:text-white"
              >
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
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Status
                    </label>
                    <div className="relative">
                      <FaInfoCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditChange}
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors appearance-none"
                        required
                      >
                        <option value="0">0 - Pending</option>
                        <option value="1">1 - Confirmed</option>
                        <option value="2">2 - Hold</option>
                        <option value="3">3 - Expired/Reject</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Adv. Payment (৳)
                    </label>
                    <div className="relative">
                      <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 z-10" />
                      <input
                        type="number"
                        name="advance_payment"
                        value={editFormData.advance_payment}
                        onChange={handleEditChange}
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Branch
                    </label>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <select
                        name="branch_id"
                        value={editFormData.branch_id}
                        onChange={handleEditChange}
                        className="w-full bg-[#222] border border-[#333] p-3 rounded-lg outline-none text-white text-sm focus:border-[#007BFF] transition-colors pl-10"
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Table No.
                    </label>
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
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Date
                    </label>
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
                          <svg
                            slot="previous"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                            />
                          </svg>
                          <svg
                            slot="next"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
                            />
                          </svg>
                          <calendar-month></calendar-month>
                        </calendar-date>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Time
                    </label>
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

                <div>
                    <label className="text-xs font-bold text-[#A0A0A0]  tracking-wider block mb-1">
                      Duration (Minutes)
                    </label>
                    <div className="relative">
                      <FaHourglassHalf className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C59D5F] z-10" />
                      <input
                        type="number"
                        name="duration"
                        value={editFormData.duration}
                        onChange={handleEditChange}
                        className="w-full bg-[#222] border border-[#333] p-2.5 pl-10 rounded-lg outline-none text-white focus:border-[#007BFF] transition-colors"
                        min="1"
                        required
                      />
                    </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="w-full bg-[#007BFF] hover:bg-[#0066e6] text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2  tracking-widest font-['Barlow_Condensed'] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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