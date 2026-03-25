import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Cart/CartContext";
import api from "../../api";
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
// import "cally";
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

export default function Checkout() {
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [dineInTables, setDineInTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const navigate = useNavigate();
  const { cartItems, cartSubTotal, clearCart, cartDiscount, cartTotal } =
    useCart();

  // --- NEW DYNAMIC SHIPPING STATE ---
  const [shippingCost, setShippingCost] = useState(0);

  const [formData, setFormData] = useState({
    cust_name: "",
    address: "",
    phone: "",
    payment_method: "cash",
    order_method: "",
  });

  const fetchDineInTables = async (companyId, branchId) => {
    setLoadingTables(true);
    try {
      const res = await api.get(`get-dine-in-tables/${companyId}/${branchId}`);
      if (res.data.status) {
        setDineInTables(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching dine-in tables:", error);
    } finally {
      setLoadingTables(false);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);

  const [bookingData, setBookingData] = useState({
    table_no: [],
    date: new Date(),
    time: "12:00",
  });

  const [personCount, setPersonCount] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [loading, setLoading] = useState(false);

  const suggestedTables = useTableSuggestion(personCount, availableTables);

  // --- FETCH DELIVERY SETTING ON PAGE LOAD ---
  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        if (res.data && res.data.delivery_charge !== undefined) {
          setShippingCost(parseInt(res.data.delivery_charge, 10));
        }
      })
      .catch((err) => console.error("Error fetching delivery charge:", err));
  }, []);

  // Use the dynamic shipping cost!
  const isHomeDelivery = formData.order_method === "Home delivery";
  const finalShippingCost = isHomeDelivery ? shippingCost : 0;
  const grandTotal = cartTotal + finalShippingCost;

  const handlePhoneBlur = async (e) => {
    const phoneNumber = e.target.value;
    if (phoneNumber && phoneNumber.length > 3) {
      
      // --- Extract branch_id dynamically from cartItems ---
      let branchId = 1; // Default fallback
      if (cartItems && cartItems.length > 0) {
        const firstItem = cartItems[0];
        branchId = firstItem.branchId || firstItem.m_branch_id || firstItem.branch_id || 1;
      }

      try {
        const res = await api.get(`/get-user-by-phone/${phoneNumber}?branch_id=${branchId}`);
        
        // NEW: Check the 'success' flag we just added to the backend!
        if (res.data && res.data.success === true) {
          // User Found! Unlock the form.
          setIsPhoneSubmitted(true); 
          setFormData((prev) => ({
            ...prev,
            cust_name: res.data.name || prev.cust_name,
            address: res.data.address || prev.address,
          }));
        } else {
          // User NOT found. 
          // Keep form locked and show the customized message from the backend.
          setIsPhoneSubmitted(false); 
          alert(res.data.message);
          
          setFormData((prev) => ({
              ...prev,
              cust_name: "",
              address: "",
          }));
        }
      } catch (err) {
        // This catch block will only trigger now if the server actually crashes (Status 500)
        setIsPhoneSubmitted(false); 
        alert("Server error while verifying phone number.");
      }
    } else {
      // If they clear the phone number entirely, lock the form
      setIsPhoneSubmitted(false); 
    }
  };

  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value);
        setBookingData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  const fetchTables = async () => {
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      const companyId = firstItem.m_company_id || firstItem.company_id;
      const branchId =
        firstItem.branchId || firstItem.m_branch_id || firstItem.branch_id;

      if (companyId && branchId) {
        setLoadingTables(true);
        try {
          // FIX: Changed from /get-occupied-tables to /checkout/get-dine-in-tables
          const response = await api.get(
            `get-dine-in-tables/${companyId}/${branchId}`
          );

          if (response.data && response.data.status === true) {
            setAvailableTables(response.data.data || []);
          } else {
            setAvailableTables([]);
          }
        } catch (error) {
          console.error("Error fetching tables:", error);
          showToastWarning("Could not check table availability.");
          setAvailableTables([]);
        } finally {
          setLoadingTables(false);
        }
      } else {
        console.warn("Missing Company ID or Branch ID in cart items.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "order_method") {
      if (value === "Dine-in") {
        // Fetch tables using the new API
        if (cartItems.length > 0) {
          const firstItem = cartItems[0];
          const companyId = firstItem.m_company_id || firstItem.company_id;
          const branchId =
            firstItem.branchId || firstItem.m_branch_id || firstItem.branch_id;
          if (companyId && branchId) {
            fetchDineInTables(companyId, branchId);
          }
        }
        setShowModal(true);
      } else if (value === "Parcel") {
        setBookingData((prev) => ({ ...prev, table_no: [] }));
        fetchTables();
        setShowModal(true);
      } else {
        setBookingData({ table_no: [], date: new Date(), time: "12:00" });
        setAvailableTables([]);
        setDineInTables([]);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableSelect = (tableNo) => {
    setBookingData((prev) => {
      const currentTables = Array.isArray(prev.table_no) ? prev.table_no : [];
      if (currentTables.includes(tableNo)) {
        return {
          ...prev,
          table_no: currentTables.filter((t) => t !== tableNo),
        };
      } else {
        return { ...prev, table_no: [...currentTables, tableNo] };
      }
    });
  };

  const showToastWarning = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const saveDetails = () => {
    if (!bookingData.table_no || bookingData.table_no.length === 0) {
      alert(
        formData.order_method === "Dine-in"
          ? "Please select at least one table."
          : "Please select a table."
      );
      return;
    }

    if (formData.order_method === "Parcel") {
      const isValid = availableTables.some(
        (t) =>
          String(t.table_no).trim() === String(bookingData.table_no[0]).trim()
      );

      if (!isValid) {
        showToastWarning(
          `Warning: Table "${bookingData.table_no[0]}" does not exist!`
        );
        return;
      }
    }

    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cust_name || !formData.address || !formData.phone) {
      alert("Please fill in all billing details.");
      return;
    }

    if (!formData.order_method) {
      alert("Please select an Order Method.");
      return;
    }

    const needsDetails = ["Dine-in", "Parcel"].includes(formData.order_method);
    if (
      needsDetails &&
      (!bookingData.table_no || bookingData.table_no.length === 0)
    ) {
      alert(`Please provide details for ${formData.order_method}.`);
      fetchTables();
      setShowModal(true);
      return;
    }

    setLoading(true);

    let userEmail = null;
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          userEmail = parsedUser.email || null;
        }
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }

    const orderPayload = {
      branch_id:
        cartItems.length > 0
          ? cartItems[0].branchId || cartItems[0].m_branch_id || 1
          : 1,
      cust_name: formData.cust_name,
      phone: String(formData.phone),
      email: userEmail || "",
      address: formData.address,
      order_method: formData.order_method,
      sub_total: cartSubTotal,
      discount: cartDiscount,
      delivery: finalShippingCost,
      total: grandTotal,
      // order_method: formData.order_method,
      table_no:
        bookingData.table_no.length > 0
          ? bookingData.table_no.join(", ")
          : formData.order_method,
      pay_mtd: formData.payment_method.toLowerCase(),
      items: cartItems.map((item) => ({
        menu_id: item.m_menu_id || item.id,
        menu_name: item.m_menu_name,
        qty: item.quantity,
        price: Number(item.m_price),
      })),
    };

    try {
      const response = await api.post("/place-order", orderPayload);

      if (response.data.status === true) {
        alert("Order placed successfully!");
        if (clearCart && typeof clearCart === "function") {
          clearCart();
        } else {
          localStorage.removeItem("siteCart");
        }
        navigate("/");
      } else {
        console.error("API Response:", response.data);
        alert("Order failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Submission Error:", error);
      const serverMessage = error.response?.data?.message || error.message;
      alert(`Failed to place order: ${serverMessage}`);
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

  return (
    <>
      <style>{autofillFixStyles}</style>

      <div className="bg-white min-h-screen font-['Inter'] relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {toast.show && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
              <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 font-bold text-sm">
                <FaExclamationCircle size={20} />
                {toast.message}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div>
              <h3 className="text-2xl md:text-3xl font-['Barlow_Condensed'] font-bold uppercase italic text-[#0E1014] mb-8 border-l-4 border-[#C59D5F] pl-4">
                Billing Details
              </h3>
              <div className="space-y-6">
                <div className="form-group">
                  <label className="block text-gray-500 text-sm mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    // autoComplete="off"
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    placeholder="Phone Number"
                    className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 text-[23px] placeholder-gray-400"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-gray-500 text-sm mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="cust_name"
                    value={formData.cust_name}
                    // autoComplete="off"
                    onChange={handleChange}
                    disabled={!isPhoneSubmitted}
                    readOnly
                    placeholder="Your Name"
                    className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-gray-500 text-sm mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    // autoComplete="off"
                    onChange={handleChange}
                    disabled={!isPhoneSubmitted}
                    placeholder="House number and street name"
                    className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-['Barlow_Condensed'] font-bold uppercase italic text-[#0E1014] mb-8 border-l-4 border-[#C59D5F] pl-4">
                Your Order
              </h3>
              <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-8">
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left font-['Barlow_Condensed'] uppercase text-[#0E1014] pb-4 text-lg">
                        Product
                      </th>
                      <th className="text-right font-['Barlow_Condensed'] uppercase text-[#0E1014] pb-4 text-lg">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {cartItems.map((item) => (
                      <tr className="border-b border-gray-100" key={item.id}>
                        <td className="py-4">
                          {item.m_menu_name}{" "}
                          <strong className="text-[#0E1014] ml-2">
                            × {item.quantity}
                          </strong>
                        </td>
                        <td className="py-4 text-right">
                          Tk{" "}
                          {(
                            Number(item.m_price) * item.quantity
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold text-[#0E1014]">
                    <tr className="border-b border-gray-100">
                      <td className="py-4">Cart Subtotal</td>
                      <td className="py-4 text-right text-[#38260c]">
                        Tk {cartTotal.toLocaleString()}
                      </td>
                    </tr>

                    <tr className="border-b border-gray-100">
                      <td className="py-4 align-middle">
                        Order Method <span className="text-red-500">*</span>
                      </td>
                      <td className="py-4 text-right">
                        <select
                          name="order_method"
                          value={formData.order_method}
                          onChange={handleChange}
                          disabled={!isPhoneSubmitted}
                          className="bg-[#F3F4F7] border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#C59D5F] focus:border-[#C59D5F] block w-full p-2.5 outline-none font-['Arial']"
                          required
                        >
                          <option value="">Select Method</option>
                          <option value="Home delivery">Home delivery</option>
                          <option value="Take a way">Take a way</option>
                          <option value="Parcel">Parcel</option>
                          <option value="Dine-in">Dine-in</option>
                        </select>

                        {["Dine-in", "Parcel"].includes(
                          formData.order_method
                        ) &&
                          bookingData.table_no &&
                          bookingData.table_no.length > 0 && (
                            <div className="text-base text-[#38260c] mt-2 font-normal">
                              {formData.order_method === "Dine-in"
                                ? "Table(s)"
                                : "Table"}
                              :{" "}
                              {/* Create a copy of the array and sort it in ascending order numerically */}
                              {[...bookingData.table_no]
                                .sort((a, b) => Number(a) - Number(b))
                                .join(", ")}
                              {formData.order_method === "Dine-in" &&
                                personCount && (
                                  <span>
                                    <br />
                                    Guests: {personCount}
                                  </span>
                                )}
                              <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="ml-3 text-sm underline text-gray-500 hover:text-[#C59D5F] transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                      </td>
                    </tr>

                    {isHomeDelivery && (
                      <tr className="border-b border-gray-100">
                        <td className="py-4">Shipping</td>
                        <td className="py-4 text-right">Tk {shippingCost}</td>
                      </tr>
                    )}

                    <tr>
                      <td className="py-5 text-xl font-['Barlow_Condensed'] uppercase">
                        Order Total
                      </td>
                      <td className="py-5 text-right text-xl text-[#38260c]">
                        Tk {grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <button
                  type="submit"
                  disabled={loading || !isPhoneSubmitted}
                  className={`w-full bg-[#0E1014] text-white font-['Barlow_Condensed'] font-bold uppercase italic tracking-wider py-4 rounded transition-all duration-300 ${
                    loading || !isPhoneSubmitted
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#C59D5F] hover:text-white"
                  }`}
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </form>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
                <div className="bg-[#0E1014] p-5 flex justify-between items-center shrink-0 rounded-t-2xl">
                  <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">
                    Order Method:{" "}
                    <span className="text-[#C59D5F]">
                      {formData.order_method}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                  {formData.order_method === "Dine-in" ? (
                    <div>
                      <div className="mb-6">
                        <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">
                          Number of Persons
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={personCount}
                          onChange={(e) => setPersonCount(e.target.value)}
                          placeholder="Enter number of guests"
                          className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none text-gray-700"
                        />
                      </div>

                      {/* --- BEAUTIFUL DYNAMIC TABLE SUMMARY --- */}
                      {(() => {
                        // Determine which tables to use for summary
                        const tablesToUse =
                          dineInTables.length > 0
                            ? dineInTables
                            : availableTables;

                        // 1. Calculate Summary Data
                        const selectedTableObjects = tablesToUse
                          .filter((t) =>
                            bookingData.table_no.includes(t.table_no)
                          )
                          .sort(
                            (a, b) => Number(a.table_no) - Number(b.table_no)
                          ); // Sort ascending

                        const totalSelectedCapacity =
                          selectedTableObjects.reduce(
                            (sum, t) =>
                              sum + Number(t.person_no || t.capacity || 4),
                            0
                          );
                        const parsedGuestCount = Number(personCount) || 0;
                        const capacityMet =
                          totalSelectedCapacity >= parsedGuestCount;

                        return (
                          <>
                            <div className="flex justify-between items-end mb-3">
                              <label className="block text-gray-600 text-sm font-bold uppercase tracking-wide">
                                Select Table(s)
                              </label>
                            </div>

                            {/* 2. Show Summary Card IF tables are selected */}
                            {selectedTableObjects.length > 0 && (
                              <div className="mb-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                {/* Status Indicator Line (Left Edge) */}
                                <div
                                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                    capacityMet
                                      ? "bg-green-500"
                                      : "bg-amber-500"
                                  }`}
                                ></div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                  {/* Left Side: Selected Tables Badges */}
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
                                            {t.person_no || t.capacity || 4}{" "}
                                            Seats
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right Side: Capacity vs Guests Stats */}
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
                                        Table Capacity
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

                                {/* Warning Message if Capacity is low */}
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

                      {/* NEW DINE-IN TABLES RENDERING */}
                      {loadingTables ? (
                        <div className="flex justify-center items-center py-10">
                          <div className="w-10 h-10 border-4 border-[#C59D5F] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : dineInTables.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                          {dineInTables.map((table) => {
                            const isSelected = bookingData.table_no.includes(
                              table.table_no
                            );
                            // Calculate if table is suggested based on person count
                            const isSuggested =
                              personCount &&
                              table.person_no &&
                              Math.abs(
                                table.person_no - parseInt(personCount)
                              ) <= 2;

                            return (
                              <button
                                key={table.id}
                                type="button"
                                disabled={!table.isAvailable}
                                onClick={() =>
                                  handleTableSelect(table.table_no)
                                }
                                className={`
                                  relative pt-7 pb-4 px-2 rounded-xl border-2 transition-all duration-300 
                                  flex flex-col items-center justify-center min-h-[100px] overflow-hidden
                                  ${
                                    table.isAvailable
                                      ? isSelected
                                        ? "border-[#C59D5F] bg-[#C59D5F]/20 shadow-md scale-105"
                                        : "border-[#C59D5F] bg-[#C59D5F]/10 hover:bg-[#C59D5F]/20 cursor-pointer shadow-md"
                                      : "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                                  }
                                `}
                              >
                                {/* PERFECTLY POSITIONED BOOKING MESSAGE */}
                                {table.isAvailable && table.bookingMessage && (
                                  <div className="absolute top-0 left-0 w-full bg-[#007BFF] text-white text-[10px] md:text-xs font-bold py-1 px-1 text-center tracking-wide z-10 shadow-sm truncate">
                                    {table.bookingMessage}
                                  </div>
                                )}

                                {/* BEST FIT SUGGESTION */}
                                {isSuggested &&
                                  table.isAvailable &&
                                  !isSelected && (
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm whitespace-nowrap">
                                      ⭐ BEST FIT
                                    </div>
                                  )}

                                <span className="text-gray-800 font-extrabold text-xl font-['Barlow_Condensed'] tracking-wider">
                                  Table {table.table_no}
                                </span>

                                <span className="text-xs text-gray-600 mt-1">
                                  {table.person_no || table.capacity || "?"}{" "}
                                  seats
                                </span>

                                <span
                                  className={`text-[11px] mt-2 font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full ${
                                    table.isAvailable
                                      ? "bg-green-500/20 text-green-600"
                                      : "bg-red-500/20 text-red-600"
                                  }`}
                                >
                                  {table.isAvailable
                                    ? "Available"
                                    : "Unavailable"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : /* FALLBACK TO ORIGINAL TABLE RENDERING IF NO DINE-IN TABLES */
                      availableTables.length > 0 ? (
                        <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {availableTables.map((t) => {
                              const totalChairs =
                                t.person_no || t.capacity || 4;
                              const topRow = Math.ceil(totalChairs / 2);
                              const bottomRow = Math.floor(totalChairs / 2);

                              const isSelected = bookingData.table_no.includes(
                                t.table_no
                              );
                              const isOccupied = t.is_occupied;
                              const isSuggested = suggestedTables.includes(
                                t.table_no
                              );

                              return (
                                <div
                                  key={t.id}
                                  onClick={() => {
                                    if (!isOccupied)
                                      handleTableSelect(t.table_no);
                                  }}
                                  className={`
                                      group flex flex-col items-center justify-center p-3 mt-4 rounded-xl border-2 transition-all duration-300 relative
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
                                  {isSuggested &&
                                    !isOccupied &&
                                    !isSelected && (
                                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm whitespace-nowrap">
                                        ⭐ BEST FIT
                                      </div>
                                    )}

                                  {isOccupied && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
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
                                      Table No.{t.table_no}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-black relative z-10">
                                      {totalChairs} Seats
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {renderChairs(bottomRow, "bottom")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                          No tables available for this branch.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">
                        Table No.
                      </label>
                      <select
                        name="table_no"
                        value={
                          bookingData.table_no.length > 0
                            ? bookingData.table_no[0]
                            : ""
                        }
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            table_no: [e.target.value],
                          }))
                        }
                        className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none text-gray-700 cursor-pointer"
                      >
                        <option value="">-- Select a Table --</option>
                        {availableTables.length > 0 ? (
                          availableTables.map((t) => (
                            <option
                              key={t.id}
                              value={t.table_no}
                              disabled={t.is_occupied}
                            >
                              Table {t.table_no}{" "}
                              {t.capacity ? `(${t.capacity} Seats)` : ""}{" "}
                              {t.is_occupied ? "(Occupied)" : ""}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No tables available
                          </option>
                        )}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Please select a table for your parcel order.
                      </p>
                    </div>
                  )}

                  {showCalendar && (
                    <div className="flex justify-center border border-gray-100 rounded-lg p-4 bg-white shadow-sm animate-fade-in-up">
                      <calendar-date
                        ref={calendarRef}
                        className="cally text-gray-900 border-none shadow-none"
                        min={new Date().toISOString().split("T")[0]}
                        value={bookingData.date.toISOString().split("T")[0]}
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

                  <button
                    type="button"
                    onClick={saveDetails}
                    className="w-full bg-[#C59D5F] text-white font-bold py-3 rounded-lg uppercase tracking-widest hover:bg-[#0E1014] transition-all duration-300 shadow-md mt-4"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
