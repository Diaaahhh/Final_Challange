import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Cart/CartContext'; 
import api from '../../api';
import { FaTimes, FaCalendarAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import "cally"; // Import Cally

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, setCartItems } = useCart(); 
    
  const SHIPPING_COST = 100; 

  const [formData, setFormData] = useState({
    cust_name: '',
    address: '',
    phone: '',
    payment_method: 'Cash',
    order_method: '' 
  });

  // --- Modal & Data State ---
  const [showModal, setShowModal] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  
  const [bookingData, setBookingData] = useState({
    table_no: '', 
    date: new Date(),
    time: '12:00'
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // --- Refs for Cally Calendar ---
  const calendarRef = useRef(null);

  // --- Toast State ---
  const [toast, setToast] = useState({ show: false, message: '' });

  const [loading, setLoading] = useState(false);

  // --- DYNAMIC CALCULATIONS ---
  const isHomeDelivery = formData.order_method === "Home delivery";
  const finalShippingCost = isHomeDelivery ? SHIPPING_COST : 0;
  const grandTotal = cartTotal + finalShippingCost;

  // --- NEW LOGIC: Fetch User Data by Phone Number ---
  const handlePhoneBlur = async (e) => {
    const phoneNumber = e.target.value;
    
    // Basic validation to avoid unnecessary calls for short/empty numbers
    if (phoneNumber && phoneNumber.length > 3) {
        try {
            const res = await api.get(`/get-user-by-phone/${phoneNumber}`);
            
            if (res.data) {
                // Auto-fill form with fetched data
                setFormData(prev => ({
                    ...prev,
                    cust_name: res.data.name || prev.cust_name,
                    address: res.data.address || prev.address,
                }));
            }
        } catch (err) {
            // It's okay if not found, user can fill manually
            console.log("User not found by phone, proceeding with manual entry.");
        }
    }
  };

  // --- Cally Calendar Logic ---
  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const handleDateChange = (e) => {
        // Cally returns YYYY-MM-DD string
        const selectedDate = new Date(e.target.value);
        setBookingData((prev) => ({ ...prev, date: selectedDate }));
        setShowCalendar(false);
      };
      calendar.addEventListener("change", handleDateChange);
      return () => calendar.removeEventListener("change", handleDateChange);
    }
  }, [showCalendar]);

  // 2. Fetch Tables Logic
  const fetchTables = async () => {
     if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        const companyId = firstItem.m_company_id || firstItem.company_id;
        const branchId = firstItem.branchId || firstItem.m_branch_id || firstItem.branch_id;

        if (companyId && branchId) {
          try {
            const res = await api.get(`/get-tables/${companyId}/${branchId}`);
            setAvailableTables(res.data);
          } catch (err) {
            console.error("Error fetching tables:", err);
          }
        } else {
            console.warn("Missing Company ID or Branch ID in cart items.");
        }
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'order_method') {
        if (value === 'Dine-in') {
            fetchTables();
            setShowModal(true);
        } else if (value === 'Parcel') {
            setBookingData(prev => ({ ...prev, table_no: '' })); 
            fetchTables(); 
            setShowModal(true);
        } else {
            setBookingData({ table_no: '', date: new Date(), time: '12:00' });
            setAvailableTables([]);
        }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingDataChange = (e) => {
      const { name, value } = e.target;
      setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleTableSelect = (tableNo) => {
      setBookingData(prev => ({ ...prev, table_no: tableNo }));
  };

  // --- Helper to Trigger Toast ---
  const showToastWarning = (msg) => {
      setToast({ show: true, message: msg });
      setTimeout(() => setToast({ show: false, message: '' }), 3000); 
  };

  const saveDetails = () => {
      if (!bookingData.table_no) {
          alert(formData.order_method === 'Dine-in' ? "Please select a table." : "Please enter a number.");
          return;
      }

      if (formData.order_method === 'Parcel') {
          const isValid = availableTables.some(
              t => String(t.table_no).trim() === String(bookingData.table_no).trim()
          );

          if (!isValid) {
              showToastWarning(`Warning: Table "${bookingData.table_no}" does not exist!`);
              return; 
          }
      }

      setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.cust_name || !formData.address || !formData.phone) {
        alert("Please fill in all billing details.");
        return;
    }

    if(!formData.order_method) {
        alert("Please select an Order Method.");
        return;
    }

    const needsDetails = ['Dine-in', 'Parcel'].includes(formData.order_method);
    if(needsDetails && !bookingData.table_no) {
        alert(`Please provide details for ${formData.order_method}.`);
        fetchTables(); 
        setShowModal(true);
        return;
    }
    
    setLoading(true);

    const formattedDate = bookingData.date.toISOString().split('T')[0];
    
    let finalInfoString = formData.order_method;
    if(formData.order_method === 'Dine-in') {
        finalInfoString = `Table ${bookingData.table_no} | ${formattedDate} ${bookingData.time}`;
    } else if (formData.order_method === 'Parcel') {
        finalInfoString = `Parcel ${bookingData.table_no} | ${formattedDate} ${bookingData.time}`;
    }

    // --- NEW LOGIC: EXTRACT USER DATA FROM LOCAL STORAGE ---
    let userEmail = null;
    let isLoggedIn = false;
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id) {
                isLoggedIn = true; // Set flag to 1 (true)
                userEmail = parsedUser.email || null;
            }
        }
    } catch (err) {
        console.error("Error parsing user data:", err);
    }
    // -------------------------------------------------------

    const orderPayload = {
        phone: String(formData.phone),
        cust_name: formData.cust_name,
        address: formData.address,
        waiter: "65", 
        table_no: finalInfoString, 
        discount: 0, 
        payment_method: "cash", 
        branch_id: cartItems.length > 0 ? (cartItems[0].branchId || 1) : 1, 
        total: grandTotal, 
        payment_details: { total: grandTotal },
        
        // --- PASS NEW FIELDS TO BACKEND ---
        email: userEmail,
        is_logged_in: isLoggedIn, 
        // ----------------------------------

        items: cartItems.map(item => ({
            id: item.id,
            menu_id: item.id, 
            name: item.m_menu_name,
            qty: item.quantity,
            price: item.m_price
        }))
    };

    try {
        const response = await api.post("/save-customer-data", orderPayload);
        
        // Check if order was successful (handles both success and local_order flags)
        if(response.data.success || response.data.status === 200 || response.data.customer_id || response.data.local_order) {
            alert("Order placed successfully!");
            // Clear the cart using setCartItems from context
            if (setCartItems && typeof setCartItems === 'function') {
                setCartItems([]);
            } else {
                console.error("setCartItems is not a function", setCartItems);
                // Fallback: try to clear localStorage directly
                localStorage.removeItem('cart');
            }
            navigate('/'); 
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

  // --- Helper: Render Chairs ---
  const renderChairs = (count, position) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={`${position}-${index}`} className="flex flex-col items-center">
        {position === 'top' && (
            <>
                <div className="w-3 h-1 bg-gray-800 rounded-full mb-[1px]"></div>
                <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
            </>
        )}
        {position === 'bottom' && (
            <>
                <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded-sm shadow-sm"></div>
                <div className="w-3 h-1 bg-gray-800 rounded-full mt-[1px]"></div>
            </>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white min-h-screen font-['Inter'] relative">
      <div className="container mx-auto px-4 py-16 md:py-24">
        
        {/* --- TOAST MESSAGE --- */}
        {toast.show && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 font-bold text-sm">
                    <FaExclamationCircle size={20} />
                    {toast.message}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Billing Details */}
          <div>
            <h3 className="text-2xl md:text-3xl font-['Barlow_Condensed'] font-bold uppercase italic text-[#0E1014] mb-8 border-l-4 border-[#C59D5F] pl-4">
              Billing Details
            </h3>
            <div className="space-y-6">
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Phone Number</label>
                <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    onBlur={handlePhoneBlur} 
                    placeholder="Phone Number" 
                    className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" 
                    required 
                />
              </div>
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Full Name</label>
                <input type="text" name="cust_name" value={formData.cust_name} onChange={handleChange} placeholder="Your Name" className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" required />
              </div>
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House number and street name" className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" required />
              </div>
            </div>
          </div>

          {/* Your Order */}
          <div>
             <h3 className="text-2xl md:text-3xl font-['Barlow_Condensed'] font-bold uppercase italic text-[#0E1014] mb-8 border-l-4 border-[#C59D5F] pl-4">
              Your Order
            </h3>
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-8">
              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left font-['Barlow_Condensed'] uppercase text-[#0E1014] pb-4 text-lg">Product</th>
                    <th className="text-right font-['Barlow_Condensed'] uppercase text-[#0E1014] pb-4 text-lg">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {cartItems.map((item) => (
                      <tr className="border-b border-gray-100" key={item.id}>
                        <td className="py-4">{item.m_menu_name} <strong className="text-[#0E1014] ml-2">× {item.quantity}</strong></td>
                        <td className="py-4 text-right">Tk {(Number(item.m_price) * item.quantity).toLocaleString()}</td>
                      </tr>
                  ))}
                </tbody>
                <tfoot className="font-bold text-[#0E1014]">
                  <tr className="border-b border-gray-100">
                    <td className="py-4">Cart Subtotal</td>
                    <td className="py-4 text-right text-[#C59D5F]">Tk {cartTotal.toLocaleString()}</td>
                  </tr>

                  {/* --- ORDER METHOD DROPDOWN --- */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 align-middle">
                        Order Method <span className="text-red-500">*</span>
                    </td>
                    <td className="py-4 text-right">
                        <select 
                            name="order_method" 
                            value={formData.order_method} 
                            onChange={handleChange}
                            className="bg-[#F3F4F7] border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#C59D5F] focus:border-[#C59D5F] block w-full p-2.5 outline-none"
                            required
                        >
                            <option value="">Select Method</option>
                            <option value="Home delivery">Home delivery</option>
                            <option value="Take a way">Take a way</option>
                            <option value="Parcel">Parcel</option>
                            <option value="Dine-in">Dine-in</option>
                        </select>
                        
                        {/* Summary of Selection (Dine-in OR Parcel) */}
                        {['Dine-in', 'Parcel'].includes(formData.order_method) && bookingData.table_no && (
                            <div className="text-xs text-[#C59D5F] mt-2 font-normal">
                                {formData.order_method === 'Dine-in' ? 'Table' : 'Table'}: {bookingData.table_no} <br/>
                                {bookingData.date.toLocaleDateString()} at {bookingData.time}
                                <button type="button" onClick={() => setShowModal(true)} className="ml-2 underline text-gray-500 hover:text-black">Edit</button>
                            </div>
                        )}
                    </td>
                  </tr>

                  {isHomeDelivery && (
                    <tr className="border-b border-gray-100">
                        <td className="py-4">Shipping</td>
                        <td className="py-4 text-right">Tk {SHIPPING_COST}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-5 text-xl font-['Barlow_Condensed'] uppercase">Order Total</td>
                    <td className="py-5 text-right text-xl text-[#C59D5F]">Tk {grandTotal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              
              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full bg-[#0E1014] text-white font-['Barlow_Condensed'] font-bold uppercase italic tracking-wider py-4 rounded hover:bg-[#C59D5F] hover:text-white transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>

        {/* --- UNIVERSAL MODAL (Dine-in & Parcel) --- */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
                    
                    {/* Header */}
                    <div className="bg-[#0E1014] p-5 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">
                            Order Method: <span className="text-[#C59D5F]">{formData.order_method}</span>
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="p-6 space-y-6 overflow-y-auto">
                        
                        {/* --- CONDITIONAL FIELD: Visual Tables OR Text Input --- */}
                        {formData.order_method === 'Dine-in' ? (
                            // >>> VISUAL TABLE GRID <<<
                            <div>
                                <label className="block text-gray-600 text-sm font-bold mb-4 uppercase tracking-wide">
                                    Select a Table
                                </label>
                                
                                {availableTables.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {availableTables.map(t => {
                                            const totalChairs = t.person_no || t.capacity || 4; 
                                            const topRow = Math.ceil(totalChairs / 2);
                                            const bottomRow = Math.floor(totalChairs / 2);
                                            const isSelected = bookingData.table_no === t.table_no;

                                            return (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => handleTableSelect(t.table_no)}
                                                    className={`
                                                        group cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300
                                                        ${isSelected 
                                                            ? 'border-[#C59D5F] bg-amber-50 shadow-md transform scale-105' 
                                                            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex gap-1 mb-1">{renderChairs(topRow, 'top')}</div>
                                                    <div className={`
                                                        w-full h-16 rounded-md flex flex-col items-center justify-center shadow-inner relative overflow-hidden
                                                        ${isSelected ? 'bg-[#C59D5F] text-white' : 'bg-gray-200 text-gray-600'}
                                                    `}>
                                                        <div className="absolute inset-0 opacity-10 bg-black"></div>
                                                        <span className="font-['Barlow_Condensed'] font-bold text-lg relative z-10">
                                                            {t.table_no}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-black relative z-10">
                                                            {totalChairs} Seats
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 mt-1">{renderChairs(bottomRow, 'bottom')}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                                        No tables available for this branch.
                                    </div>
                                )}
                            </div>
                        ) : (
                            // >>> PARCEL DROPDOWN <<<
<div>
    <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">
        Table No.
    </label>
    <select 
        name="table_no" 
        value={bookingData.table_no}
        onChange={handleBookingDataChange}
        className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none text-gray-700 cursor-pointer"
    >
        <option value="">-- Select a Table --</option>
        {availableTables.length > 0 ? (
            availableTables.map(t => (
                <option key={t.id} value={t.table_no}>
                    Table {t.table_no} {t.capacity ? `(${t.capacity} Seats)` : ''}
                </option>
            ))
        ) : (
            <option value="" disabled>No tables available</option>
        )}
    </select>
    <p className="text-xs text-gray-400 mt-1">Please select a table for your parcel order.</p>
</div>
                        )}

                        {/* --- COMMON FIELDS: Date & Time --- */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Date</label>
                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="w-full flex items-center justify-between bg-[#F3F4F7] rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        <span>{bookingData.date.toDateString()}</span>
                                        <FaCalendarAlt className="text-[#C59D5F]" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">Time</label>
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        name="time"
                                        value={bookingData.time}
                                        onChange={handleBookingDataChange}
                                        className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none text-gray-700 text-sm"
                                    />
                                    <FaClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C59D5F] pointer-events-none" />
                                </div>
                            </div>
                        </div> */}

                        {/* Inline Cally Calendar Display */}
                        {showCalendar && (
                            <div className="flex justify-center border border-gray-100 rounded-lg p-4 bg-white shadow-sm animate-fade-in-up">
                                <calendar-date
                                    ref={calendarRef}
                                    className="cally text-gray-900 border-none shadow-none"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={bookingData.date.toISOString().split("T")[0]}
                                >
                                    <svg slot="previous" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    <svg slot="next" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                                    <calendar-month></calendar-month>
                                </calendar-date>
                            </div>
                        )}

                        {/* Save Button */}
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
  );
}