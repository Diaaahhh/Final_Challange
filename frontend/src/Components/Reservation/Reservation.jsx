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
import toast from "react-hot-toast";
import api from "../../api";
import useTableSuggestion from "../Hooks/useTableSuggestion";
import ReCAPTCHA from "react-google-recaptcha";

// Updated style block for clean white autofill backgrounds to match dynamic themes
const autofillFixStyles = `
  /* Remove browser autofill background */
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
    -webkit-text-fill-color: #374151 !important;
    box-shadow: 0 0 0 30px #ffffff inset !important;
    background-color: #ffffff !important;
    background-clip: content-box !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* For Firefox */
  input:autofill {
    background-color: #ffffff !important;
    color: #374151 !important;
    box-shadow: 0 0 0 30px #ffffff inset !important;
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

  // --- OTP & SECURITY STATES ---
  const [isOtpEnabled, setIsOtpEnabled] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
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
  const [maxTableSelection, setMaxTableSelection] = useState(10);

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
      setTables(tablesRes.data.tables);
      setMaxTableSelection(tablesRes.data.max_table_selection || 10);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  // 1. Fetch Settings on Load
  useEffect(() => {
    api.get("/reservation/reservation-settings")
      .then((res) => {
        if (res.data && res.data.success) {
          setIsOtpEnabled(res.data.otp === 1);
          setIsCaptchaEnabled(res.data.captcha === 1);
          if (res.data.otp !== 1) setIsPhoneVerified(true); // Bypass if disabled
        }
      })
      .catch((err) => console.error("Error fetching reservation settings:", err));
  }, []);

  // 2. Countdown Timer Logic
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 3. Handlers
  const handleSendOtp = async () => {
    if (formData.phone.length < 10) return alert("Please enter a valid phone number first.");
    try {
      const res = await api.post("/reservation/send-otp", { phone: formData.phone });
      if (res.data.success) {
        setOtpSent(true);
        setCountdown(300);
      }
    } catch (error) {
      alert("Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      const res = await api.post("/reservation/verify-otp", { phone: formData.phone, otp: otp });
      if (res.data.success) setIsPhoneVerified(true);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
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

  const getTableCapacity = (tableNo) => {
    const table = tables.find(
      (t) => String(t.table_no) === String(tableNo)
    );

    return Number(table?.person_no || table?.capacity || 4);
  };

  const handleTableSelect = (tableNo) => {
    setFormData((prev) => {
      const currentTables = Array.isArray(prev.table_number)
        ? prev.table_number
        : [];

      // remove if already selected
      if (currentTables.includes(tableNo)) {
        return {
          ...prev,
          table_number: currentTables.filter((t) => t !== tableNo),
        };
      }

      // calculate current seat capacity
      const currentSeatTotal = currentTables.reduce(
        (sum, t) => sum + getTableCapacity(t),
        0
      );

      const newTableSeats = getTableCapacity(tableNo);
      const newSeatTotal = currentSeatTotal + newTableSeats;

      // seat limit check
      if (newSeatTotal > maxTableSelection) {
        toast.error(`You can select maximum ${maxTableSelection} seat(s).`);
        return prev;
      }

      return {
        ...prev,
        table_number: [...currentTables, tableNo],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // --- NEW: CAPTCHA VALIDATION ---
    if (isCaptchaEnabled && !captchaToken) {
      setError("Please complete the Captcha verification.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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
      await api.post("/reservation/create", {
        ...formData,
        captchaToken: captchaToken
      });
      setSuccess(true);
      setCaptchaToken(null);
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

  const isTableStepCompleted =
    formData.branch_id &&
    isPhoneSubmitted &&
    isPhoneVerified &&
    formData.date &&
    formData.time &&
    formData.guest_number &&
    formData.table_number.length > 0;

  return (
    <>
      <style>{autofillFixStyles}</style>

      {/* Main Wrapper with Dynamic Theme Background */}
      <div 
        className="min-h-screen py-12 px-4 font-['Inter'] pt-24 transition-colors duration-300"
        style={{ backgroundColor: 'var(--theme-body)' }}
      >
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg relative border border-gray-100">
          
          {/* Dynamic Theme Header */}
          <div className="theme-bg text-white p-8 text-center rounded-t-xl transition-colors duration-300">
            <h2 className="text-3xl font-['Barlow_Condensed'] font-bold uppercase tracking-wider mb-2">
              Book a Table
            </h2>
            <p className="text-gray-300 text-sm">
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
                  ...(isOtpEnabled ? ["OTP"] : []),
                  "Date",
                  "Time",
                  "Guests",
                  "Tables",
                  ...(isCaptchaEnabled ? ["Captcha"] : []),
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
                          className={`absolute left-0 top-3 w-full h-[2px] -z-10 transition-colors duration-300
                            ${isCompleted ? "theme-accent-bg" : "bg-gray-200"}`}
                        ></div>
                      )}

                      {/* Circle */}
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs transition-all duration-300
                            ${
                              isCompleted
                                ? "theme-accent-bg text-white"
                                : isActive
                                ? "theme-bg text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                      >
                        {isCompleted ? "✓" : stepNumber}
                      </div>

                      {/* Label */}
                      <span
                        className={`mt-2 transition-colors duration-300 ${
                          isActive
                            ? "text-gray-900"
                            : isCompleted
                            ? "theme-accent"
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
                    <FaMapMarkerAlt className="theme-accent" /> Branch{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all font-['Arial'] text-black"
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

                {/* Phone Field (Merged) */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaPhone className="theme-accent" /> Phone
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength="11"
                      disabled={!formData.branch_id || (isOtpEnabled ? isPhoneVerified : false)}
                      placeholder={
                        formData.branch_id
                          ? "Phone Number (e.g. 017XXXXXXXX)"
                          : "Select branch first"
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-black disabled:opacity-50"
                      required
                    />
                    
                    {/* Send OTP Button */}
                    {isOtpEnabled && !isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={countdown > 0 || !formData.branch_id}
                        className={`px-6 rounded font-bold transition-all whitespace-nowrap text-sm shadow-sm ${
                          countdown > 0 || !formData.branch_id
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "theme-accent-bg text-white hover:opacity-90"
                        }`}
                      >
                        {countdown > 0 ? `Resend in ${formatTime(countdown)}` : (otpSent ? "Resend OTP" : "Send OTP")}
                      </button>
                    )}
                  </div>

                  {/* Phone Validation Message */}
                  {phoneMessage && (
                    <div className="mt-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                      {phoneMessage}
                    </div>
                  )}

                  {/* Loading Customer State */}
                  {loadingCustomer && (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium theme-accent bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg w-fit">
                      <span className="w-4 h-4 border-2 theme-border border-t-transparent rounded-full animate-spin"></span>
                      Checking customer...
                    </div>
                  )}

                  {/* Conditional OTP Input Box */}
                  {isOtpEnabled && otpSent && !isPhoneVerified && (
                    <div className="mt-4 p-5 border-2 theme-border rounded-lg bg-gray-50 animate-fadeIn">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-gray-800 text-sm font-bold uppercase tracking-wider">
                          Enter 4-Digit OTP
                        </label>
                        {countdown === 0 && (
                          <span className="text-red-500 text-xs font-bold uppercase">OTP Expired</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-5 py-3 focus:ring-2 theme-ring outline-none tracking-[0.5em] text-center text-xl font-bold text-gray-800"
                          placeholder="----"
                          maxLength="4"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otp.length < 4 || countdown === 0}
                          className={`px-8 rounded font-bold transition-all text-sm shadow-md ${
                            verifyingOtp || otp.length < 4 || countdown === 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "theme-bg text-white hover-theme-accent-bg"
                          }`}
                        >
                          {verifyingOtp ? "Checking..." : "Verify"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaUser className="theme-accent" /> Name{" "}
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
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-black disabled:opacity-50"
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaHome className="theme-accent" /> Address{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    disabled={!isPhoneSubmitted || !isPhoneVerified}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your Full Address"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-black disabled:opacity-50"
                    required
                  />
                </div>

                {/* Guest Number */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaUsers className="theme-accent" /> Number of Guests{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="guest_number"
                    value={formData.guest_number}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    disabled={!formData.time || !isPhoneVerified}
                    min="1"
                    placeholder="E.g., 4"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-black disabled:opacity-50"
                    required
                  />
                </div>

                {/* Date */}
                <div className="relative">
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaCalendarAlt className="theme-accent" /> Date{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    disabled={!formData.branch_id || !isPhoneSubmitted || !isPhoneVerified}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-gray-700 disabled:opacity-50"
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
                    <FaClock className="theme-accent" /> Time{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={!formData.date}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-gray-700 disabled:opacity-50"
                    required
                  />
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaGlassCheers className="theme-accent" /> Occasion
                  </label>
                  <select
                    name="event_name"
                    value={formData.event_name}
                    disabled={!isPhoneSubmitted || !isPhoneVerified}
                    onChange={handleChange}
                    className="w-full text-black bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all font-['Arial'] disabled:opacity-50"
                  >
                    <option className="text-black bg-white" value="Anniversary">Anniversary</option>
                    <option className="text-black bg-white" value="Birthday">Birthday</option>
                    <option className="text-black bg-white" value="Charity Event">Charity Event</option>
                    <option className="text-black bg-white" value="Family Gathering">Family Gathering</option>
                    <option className="text-black bg-white" value="Business Meeting">Official Meeting</option>
                    <option className="text-black bg-white" value="Reunion">Reunion</option>
                    <option className="text-black bg-white" value="Others..">Others...</option>
                  </select>
                </div>

                {/* Advance Payment */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
                    <FaMoneyBillWave className="theme-accent" /> Amount Paid
                    in Advanced
                  </label>
                  <input
                    type="number"
                    name="advance_payment"
                    value={formData.advance_payment}
                    disabled={!isPhoneSubmitted || !isPhoneVerified}
                    onChange={handleChange}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g. 500 (Optional)"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all text-gray-800 disabled:opacity-50"
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
                            <FaUtensils className="theme-accent" /> Select
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
                                      <span className="theme-bg theme-accent font-bold px-2 py-1 text-sm">
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
                                    ? "theme-border theme-accent-bg bg-opacity-10 shadow-md transform scale-105 cursor-pointer"
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
                                      ? "theme-accent-bg text-white"
                                      : "bg-gray-200 text-gray-600"
                                  }
                                `}
                              >
                                <div className="absolute inset-0 opacity-10 bg-black"></div>
                                <span className="font-['Barlow_Condensed'] font-bold text-lg relative z-10">
                                  Table no.{t.table_no}
                                </span>
                                <span className={`text-[10px] uppercase font-bold relative z-10 ${isSelected ? "text-white" : "text-black"}`}>
                                  {totalChairs} Seats
                                </span>
                              </div>

                              <div className="flex gap-1 mt-1">
                                {renderChairs(bottomRow, "bottom")}
                              </div>

                              {t.bookingMessage && t.isAvailable && (
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] theme-accent font-bold text-center w-full">
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
                  <FaPen className="theme-accent" /> Special Note
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={!isPhoneSubmitted || !isPhoneVerified}
                  placeholder="Any special requests?"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 theme-ring outline-none transition-all h-24 text-gray-800 disabled:opacity-50"
                ></textarea>
              </div>
              
              {/* Conditional Google reCAPTCHA */}
              {isCaptchaEnabled && (
                <div className="flex justify-center my-6">
                  <div
                    className={`transition-all duration-300 ${
                      isTableStepCompleted
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-40 pointer-events-none"
                    }`}
                  >
                    <ReCAPTCHA
                      sitekey="6LdKm6csAAAAAGNjH1Wu2XcIg2_Ll6c3ScyCOUtz"
                      onChange={(token) => setCaptchaToken(token)}
                      theme="light"
                    />
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !isPhoneSubmitted || (isCaptchaEnabled && !captchaToken)}
                className={`w-full theme-accent-bg text-white font-bold py-4 rounded-lg uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-md ${
                  loading || !isPhoneSubmitted || (isCaptchaEnabled && !captchaToken)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
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