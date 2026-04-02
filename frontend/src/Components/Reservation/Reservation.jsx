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
  FaHome,
  FaExclamationCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import api from "../../api";
import useTableSuggestion from "../Hooks/useTableSuggestion";

// Add this style block to prevent browser autofill from overriding your styles
const autofillFixStyles = `
  /* Remove browser autofill background */
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #F3F4F7 inset !important;
    -webkit-text-fill-color: #374151 !important;
    box-shadow: 0 0 0 30px #F3F4F7 inset !important;
    background-color: #F3F4F7 !important;
    background-clip: content-box !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* For Firefox */
  input:autofill {
    background-color: #F3F4F7 !important;
    color: #374151 !important;
    box-shadow: 0 0 0 30px #F3F4F7 inset !important;
  }
`;

export default function Reservation() {
  const [formData, setFormData] = useState({
    customer_id: null,
    name: "",
    phone: "",
    address: "",
    guest_number: "",
    event_name: "Others..",
    notes: "",
    date: "",
    time: "",
    branch_id: "",
    table_number: [],
    advance_payment: "",
  });

  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const verifyAbortRef = useRef(null);
  const lastVerifiedPhoneRef = useRef(null);
  const verifyingRef = useRef(false);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // --- NEW: State to hold settings for validation ---
  const [restaurantSettings, setRestaurantSettings] = useState(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const suggestedTables = useTableSuggestion(formData.guest_number, tables);

  // 1. Fetch branches and settings on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await api.get("/reservation/branches");
        setBranches(res.data || []);

        // --- NEW: Fetch settings to get rest_open and rest_close ---
        const settingsRes = await api.get("/settings");
        if (settingsRes.data) {
          setRestaurantSettings(settingsRes.data);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch tables and occupied statuses whenever branch_id changes
  useEffect(() => {
    if (formData.branch_id && formData.date && formData.time) {
      fetchTables();
    } else {
      setTables([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.branch_id, formData.date, formData.time]);

  const fetchTables = async () => {
    try {
      const tablesRes = await api.get(
        `/reservation/tables/${formData.branch_id}?date=${formData.date}&time=${formData.time}`
      );
      setTables(tablesRes.data);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const verifyPhone = async (phoneNumber) => {
    if (verifyingRef.current) return;

    if (lastVerifiedPhoneRef.current === phoneNumber) return;

    verifyingRef.current = true;

    try {
      setLoadingCustomer(true);

      if (verifyAbortRef.current) {
        verifyAbortRef.current.abort();
      }

      verifyAbortRef.current = new AbortController();

      const res = await api.get(
        `/reservation/get-user-by-phone/${phoneNumber}?branch_id=${formData.branch_id}`,
        { signal: verifyAbortRef.current.signal }
      );

      if (res.data && res.data.success === true) {
        setIsPhoneSubmitted(true);

        setFormData((prev) => ({
          ...prev,
          customer_id: res.data.customer_id,
          name: res.data.name || prev.name,
          address: res.data.address || prev.address,
        }));

        lastVerifiedPhoneRef.current = phoneNumber;
      } else {
        setIsPhoneSubmitted(false);

        setFormData((prev) => ({
          ...prev,
          customer_id: null,
          name: "",
          address: "",
        }));

        setPhoneMessage(res.data.message);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setIsPhoneSubmitted(false);
        console.error("Server error while verifying phone number.");
      }
    } finally {
      verifyingRef.current = false;
      setLoadingCustomer(false);
    }
  };
  // 3. Handle Calendar Clicks
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value)
          .toISOString()
          .split("T")[0];
        setFormData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  useEffect(() => {
    if (formData.phone.length === 11 && formData.branch_id) {
      verifyPhone(formData.phone);
    } else {
      setIsPhoneSubmitted(false);
    }
  }, [formData.phone, formData.branch_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let finalValue = value;

    // PHONE VALIDATION
    if (name === "phone") {
      setPhoneMessage("");

      if (!/^\d*$/.test(value)) return;
      if (value.length > 11) return;

      finalValue = value;
    }

    if (name === "branch_id") {
      lastVerifiedPhoneRef.current = null;
      setIsPhoneSubmitted(false);

      setFormData((prev) => ({
        ...prev,
        branch_id: finalValue,
        phone: "",
        name: "",
        customer_id: null,
        address: "",
        table_number: [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    }
  };

  const handleTableSelect = (tableNo) => {
    setFormData((prev) => {
      const currentTables = Array.isArray(prev.table_number)
        ? prev.table_number
        : [];
      if (currentTables.includes(tableNo)) {
        return {
          ...prev,
          table_number: currentTables.filter((t) => t !== tableNo),
        };
      } else {
        return { ...prev, table_number: [...currentTables, tableNo] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.table_number.length === 0) {
      setError("Please select at least one available table.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // --- NEW: Validate Current Time against Restaurant Open/Close Hours ---
    if (
      restaurantSettings &&
      restaurantSettings.rest_open &&
      restaurantSettings.rest_close
    ) {
      const now = new Date();
      const currentTotal = now.getHours() * 60 + now.getMinutes();

      const [openH, openM] = restaurantSettings.rest_open
        .split(":")
        .map(Number);
      const openTotal = openH * 60 + openM;

      const [closeH, closeM] = restaurantSettings.rest_close
        .split(":")
        .map(Number);
      const closeTotal = closeH * 60 + closeM;

      let isOpen = false;
      if (closeTotal > openTotal) {
        // Standard hours (e.g., 10 AM to 10 PM)
        isOpen = currentTotal >= openTotal && currentTotal <= closeTotal;
      } else {
        // Cross-midnight hours (e.g., 10 PM to 2 AM)
        isOpen = currentTotal >= openTotal || currentTotal <= closeTotal;
      }

      if (!isOpen) {
        // NEW: Formats "13:00:00" to "1:00 pm"
        const formatTimeAMPM = (timeString) => {
          const [hourString, minute] = timeString.split(":");
          let hour = parseInt(hourString, 10);
          const ampm = hour >= 12 ? "pm" : "am";
          hour = hour % 12 || 12; // Convert 0 to 12
          return `${hour}:${minute} ${ampm}`;
        };

        setError(
          `The restaurant remains open from ${formatTimeAMPM(
            restaurantSettings.rest_open
          )} to ${formatTimeAMPM(restaurantSettings.rest_close)}`
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return; // Halts the submission completely
      }
    }

    setLoading(true);

    try {
      await api.post("/reservation/create", formData);
      setSuccess(true);
      setFormData({
        customer_id: null,
        name: "",
        phone: "",
        address: "",
        guest_number: "",
        event_name: "Others..",
        notes: "",
        date: "",
        time: "",
        branch_id: "",
        table_number: [],
        advance_payment: "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred during submission."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderChairs = (count, position) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={`${position}-${index}`} className="flex flex-col items-center">
        {position === "top" && (
          <>
            <div className="w-3 h-1 bg-gray-800 rounded-full mb-[1px]"></div>
            <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
          </>
        )}
        {position === "bottom" && (
          <>
            <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
            <div className="w-3 h-1 bg-gray-800 rounded-full mt-[1px]"></div>
          </>
        )}
      </div>
    ));
  };
  const getCurrentStep = () => {
    if (!formData.branch_id) return 1;
    if (!isPhoneSubmitted) return 2;
    if (!formData.date) return 3;
    if (!formData.time) return 4;
    if (!formData.guest_number) return 5;
    if (formData.table_number.length === 0) return 6;
    return 7;
  };

  const currentStep = getCurrentStep();
  return (
    <>
      <style>{autofillFixStyles}</style>

      <div className="min-h-screen bg-[rgb(229,231,235)] py-12 px-4 font-['Inter']">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg relative">
          <div className="bg-[#0E1014] text-white p-8 text-center rounded-t-xl">
            <h2 className="text-3xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider mb-2">
              Book a Table
            </h2>
            <p className="text-gray-400 text-sm">
              Reserve your spot at your favorite branch.
            </p>
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
            {/* Reservation Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                {[
                  "Branch",
                  "Phone",
                  "Date",
                  "Time",
                  "Guests",
                  "Tables",
                  "Confirm",
                ].map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStep === stepNumber;
                  const isCompleted = currentStep > stepNumber;

                  return (
                    <div
                      key={step}
                      className="flex-1 flex flex-col items-center relative"
                    >
                      {/* Line */}
                      {index !== 0 && (
                        <div
                          className={`absolute left-0 top-3 w-full h-[2px] -z-10 
            ${isCompleted ? "bg-[#C59D5F]" : "bg-gray-200"}`}
                        ></div>
                      )}

                      {/* Circle */}
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-all duration-300
            ${
              isCompleted
                ? "bg-[#C59D5F] text-white"
                : isActive
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-500"
            }`}
                      >
                        {isCompleted ? "✓" : stepNumber}
                      </div>

                      {/* Label */}
                      <span
                        className={`mt-2 ${
                          isActive
                            ? "text-black"
                            : isCompleted
                            ? "text-[#C59D5F]"
                            : "text-gray-400"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-[#C59D5F]" /> Branch{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial'] text-black"
                    required
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((b) => (
                      <option
                        className="text-black"
                        key={b.branch_id}
                        value={b.branch_id}
                      >
                        {b.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaPhone className="text-[#C59D5F]" /> Phone
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="11"
                    disabled={!formData.branch_id}
                    placeholder={
                      formData.branch_id
                        ? "Phone Number"
                        : "Select branch first"
                    }
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                    required
                  />

                  {phoneMessage && (
                    <div className="mt-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                      {phoneMessage}
                    </div>
                  )}

                  {loadingCustomer && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#C59D5F] bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg w-fit">
                      <span className="w-4 h-4 border-2 border-[#C59D5F] border-t-transparent rounded-full animate-spin"></span>
                      Checking customer...
                    </div>
                  )}
                </div>
                {/* Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaUser className="text-[#C59D5F]" /> Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isPhoneSubmitted}
                    readOnly
                    placeholder="Your Full Name"
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaHome className="text-[#C59D5F]" /> Address{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    disabled={!isPhoneSubmitted}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your Full Address"
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                    required
                  />
                </div>

                {/* Guest Number */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaUsers className="text-[#C59D5F]" /> Number of Guests{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="guest_number"
                    value={formData.guest_number}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    disabled={!formData.time}
                    min="1"
                    placeholder="E.g., 4"
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-black"
                    required
                  />
                </div>

                {/* Date */}
                <div className="relative">
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaCalendarAlt className="text-[#C59D5F]" /> Date{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    disabled={!formData.branch_id || !isPhoneSubmitted}
                    className="w-full text-left bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 "
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

                {/* Time */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaClock className="text-[#C59D5F] text-black" /> Time{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={!formData.date}
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700"
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
                    disabled={!isPhoneSubmitted}
                    onChange={handleChange}
                    className="w-full text-black bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all font-['Arial']"
                  >
                    <option className="text-black bg-white" value="Anniversary">
                      Anniversary
                    </option>
                    <option className="text-black bg-white" value="Birthday">
                      Birthday
                    </option>
                    <option
                      className="text-black bg-white"
                      value="Charity Event"
                    >
                      Charity Event
                    </option>
                    <option
                      className="text-black bg-white"
                      value="Family Gathering"
                    >
                      Family Gathering
                    </option>
                    <option
                      className="text-black bg-white"
                      value="Business Meeting"
                    >
                      Official Meeting
                    </option>
                    <option className="text-black bg-white" value="Reunion">
                      Reunion
                    </option>
                    <option className="text-black bg-white" value="Others..">
                      Others...
                    </option>
                  </select>
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaMoneyBillWave className="text-[#C59D5F]" /> Amount Paid
                    in Advanced
                  </label>
                  <input
                    type="number"
                    name="advance_payment"
                    value={formData.advance_payment}
                    disabled={!isPhoneSubmitted}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g. 500 (Optional)"
                    className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-800"
                    min="0"
                  />
                </div>
              </div>

              {/* Visual Table Selection Grid */}
              {formData.branch_id && (
                <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-4">
                  {(() => {
                    const selectedTableObjects = tables
                      .filter((t) => formData.table_number.includes(t.table_no))
                      .sort((a, b) => Number(a.table_no) - Number(b.table_no));

                    const totalSelectedCapacity = selectedTableObjects.reduce(
                      (sum, t) => sum + Number(t.person_no || t.capacity || 4),
                      0
                    );
                    const parsedGuestCount = Number(formData.guest_number) || 0;
                    const capacityMet =
                      totalSelectedCapacity >= parsedGuestCount;

                    return (
                      <>
                        <div className="flex justify-between items-end mb-3">
                          <label className="block text-gray-700 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                            <FaUtensils className="text-[#C59D5F]" /> Select
                            Table(s)
                          </label>
                        </div>

                        {selectedTableObjects.length > 0 && (
                          <div className="mb-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                capacityMet ? "bg-green-500" : "bg-amber-500"
                              }`}
                            ></div>

                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                  Selected Tables
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedTableObjects.map((t) => (
                                    <div
                                      key={t.table_no}
                                      className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden"
                                    >
                                      <span className="bg-[#0E1014] text-[#C59D5F] font-bold px-2 py-1 text-sm">
                                        #{t.table_no}
                                      </span>
                                      <span className="text-gray-600 text-xs font-bold px-2 py-1 bg-gray-50">
                                        {t.person_no || t.capacity || 4} Seats
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-row sm:flex-col gap-6 sm:gap-1 justify-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-5 min-w-[100px]">
                                <div className="flex flex-col sm:items-end">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Total Guests
                                  </p>
                                  <p className="text-lg font-bold text-gray-800 leading-none mt-1">
                                    {parsedGuestCount}
                                  </p>
                                </div>
                                <div className="flex flex-col sm:items-end mt-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Total Capacity
                                  </p>
                                  <p
                                    className={`text-lg font-bold leading-none mt-1 ${
                                      capacityMet
                                        ? "text-green-600"
                                        : "text-amber-500"
                                    }`}
                                  >
                                    {totalSelectedCapacity}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {!capacityMet && parsedGuestCount > 0 && (
                              <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100 flex items-center gap-2 font-bold">
                                <FaExclamationCircle
                                  className="text-amber-500"
                                  size={14}
                                />
                                Selected capacity is less than your total
                                guests!
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {tables.length > 0 ? (
                    <div className="h-[350px] overflow-y-auto pr-3 mt-4 custom-scrollbar border border-gray-100 rounded-lg p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6 pb-4 px-2">
                        {tables.map((t) => {
                          const totalChairs = t.person_no || t.capacity || 4;
                          const topRow = Math.ceil(totalChairs / 2);
                          const bottomRow = Math.floor(totalChairs / 2);
                          const isSelected = formData.table_number.includes(
                            String(t.table_no)
                          );
                          const isOccupied = !t.isAvailable;
                          const isSuggested = suggestedTables.includes(
                            String(t.table_no)
                          );

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                if (!isOccupied)
                                  handleTableSelect(String(t.table_no));
                              }}
                              className={`
                group flex flex-col items-center justify-center p-3 mt-4 mb-5 rounded-xl border-2 transition-all duration-300 relative
                ${
                  isOccupied
                    ? "border-red-300 bg-red-50 cursor-not-allowed opacity-70"
                    : isSelected
                    ? "border-[#C59D5F] bg-amber-50 shadow-md transform scale-105 cursor-pointer"
                    : isSuggested
                    ? "border-green-500 bg-green-50 shadow-[0_0_15px_rgba(34,197,94,0.4)] transform scale-105 cursor-pointer animate-pulse"
                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                }
            `}
                            >
                              {isSuggested && !isOccupied && !isSelected && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-sm whitespace-nowrap">
                                  ⭐ BEST FIT
                                </div>
                              )}

                              {isOccupied && (
                                <div className="absolute -top-4 -right-2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full z-20 shadow-sm">
                                  BUSY
                                </div>
                              )}

                              <div className="flex gap-1 mb-1">
                                {renderChairs(topRow, "top")}
                              </div>

                              <div
                                className={`
                w-full h-16 rounded-md flex flex-col items-center justify-center shadow-inner relative overflow-hidden
                ${
                  isOccupied
                    ? "bg-red-200 text-red-800"
                    : isSelected
                    ? "bg-[#C59D5F] text-white"
                    : "bg-gray-200 text-gray-600"
                }
            `}
                              >
                                <div className="absolute inset-0 opacity-10 bg-black"></div>
                                <span className="font-['Barlow_Condensed'] font-bold text-lg relative z-10">
                                  Table no.{t.table_no}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-black relative z-10">
                                  {totalChairs} Seats
                                </span>
                              </div>

                              <div className="flex gap-1 mt-1">
                                {renderChairs(bottomRow, "bottom")}
                              </div>

                              {t.bookingMessage && t.isAvailable && (
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#C59D5F] font-bold text-center w-full">
                                  {t.bookingMessage}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                      No physical tables found for this branch.
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                  <FaPen className="text-[#C59D5F]" /> Special Note
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={!isPhoneSubmitted}
                  placeholder="Any special requests?"
                  className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all h-24 text-gray-800"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || !isPhoneSubmitted}
                className={`w-full bg-[#C59D5F] text-white font-bold py-4 rounded-lg uppercase tracking-widest hover:bg-[#0E1014] transition-all duration-300 ${
                  loading || !isPhoneSubmitted
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#C59D5F] hover:text-white"
                }`}
              >
                {loading ? "Processing..." : "Confirm Reservation"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
