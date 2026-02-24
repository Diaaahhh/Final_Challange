import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Cart/CartContext'; 
import api from '../../api';
import { FaTimes, FaCalendarAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import "cally"; 

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart(); 
    
  const SHIPPING_COST = 100; 

  const [formData, setFormData] = useState({
    cust_name: '',
    address: '',
    phone: '',
    payment_method: 'Cash',
    order_method: '' 
  });

  const [showModal, setShowModal] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  
  // Changed table_no to an Array to handle multiple tables
  const [bookingData, setBookingData] = useState({
    table_no: [], 
    date: new Date(),
    time: '12:00'
  });
  
  // New state for Number of Persons (UI ONLY, not sent to backend)
  const [personCount, setPersonCount] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [loading, setLoading] = useState(false);

  const isHomeDelivery = formData.order_method === "Home delivery";
  const finalShippingCost = isHomeDelivery ? SHIPPING_COST : 0;
  const grandTotal = cartTotal + finalShippingCost;

  const handlePhoneBlur = async (e) => {
    const phoneNumber = e.target.value;
    if (phoneNumber && phoneNumber.length > 3) {
        try {
            const res = await api.get(`/get-user-by-phone/${phoneNumber}`);
            if (res.data) {
                setFormData(prev => ({
                    ...prev,
                    cust_name: res.data.name || prev.cust_name,
                    address: res.data.address || prev.address,
                }));
            }
        } catch (err) {
            console.log("User not found by phone, proceeding with manual entry.");
        }
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
        const branchId = firstItem.branchId || firstItem.m_branch_id || firstItem.branch_id;

        if (companyId && branchId) {
          try {
            const tablesRes = await api.get(`/get-tables/${companyId}/${branchId}`);
            const allTables = tablesRes.data || [];

            const occupiedRes = await api.get(`/get-occupied-tables/${companyId}/${branchId}`);
            const occupiedTables = occupiedRes.data || []; 

            const finalTables = allTables.map(t => ({
                ...t,
                is_occupied: occupiedTables.includes(String(t.table_no).trim())
            }));

            setAvailableTables(finalTables);
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
            setBookingData(prev => ({ ...prev, table_no: [] })); 
            fetchTables(); 
            setShowModal(true);
        } else {
            setBookingData({ table_no: [], date: new Date(), time: '12:00' });
            setAvailableTables([]);
        }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggles the table in the array for multi-select
  const handleTableSelect = (tableNo) => {
      setBookingData(prev => {
          const currentTables = Array.isArray(prev.table_no) ? prev.table_no : [];
          if (currentTables.includes(tableNo)) {
              // Remove table if already selected
              return { ...prev, table_no: currentTables.filter(t => t !== tableNo) };
          } else {
              // Add table to selection
              return { ...prev, table_no: [...currentTables, tableNo] };
          }
      });
  };

  const showToastWarning = (msg) => {
      setToast({ show: true, message: msg });
      setTimeout(() => setToast({ show: false, message: '' }), 3000); 
  };

  const saveDetails = () => {
      if (!bookingData.table_no || bookingData.table_no.length === 0) {
          alert(formData.order_method === 'Dine-in' ? "Please select at least one table." : "Please select a table.");
          return;
      }

      if (formData.order_method === 'Parcel') {
          const isValid = availableTables.some(
              t => String(t.table_no).trim() === String(bookingData.table_no[0]).trim()
          );

          if (!isValid) {
              showToastWarning(`Warning: Table "${bookingData.table_no[0]}" does not exist!`);
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
    if(needsDetails && (!bookingData.table_no || bookingData.table_no.length === 0)) {
        alert(`Please provide details for ${formData.order_method}.`);
        fetchTables(); 
        setShowModal(true);
        return;
    }
    
    setLoading(true);

    // If Dine-in or Parcel, send the array of tables directly. Backend will join them!
    let finalTableData = formData.order_method; 
    if (formData.order_method === 'Dine-in' || formData.order_method === 'Parcel') {
        finalTableData = bookingData.table_no; // This is an array, e.g., ["1", "5"]
    }

    let userEmail = null;
    let isLoggedIn = false;
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id) {
                isLoggedIn = true; 
                userEmail = parsedUser.email || null;
            }
        }
    } catch (err) {
        console.error("Error parsing user data:", err);
    }

    const orderPayload = {
        phone: String(formData.phone),
        cust_name: formData.cust_name,
        address: formData.address,
        waiter: "65", 
        table_no: finalTableData, // Passed to backend
        discount: 0, 
        payment_method: "cash", 
        branch_id: cartItems.length > 0 ? (cartItems[0].branchId || 1) : 1, 
        total: grandTotal, 
        payment_details: { total: grandTotal },
        email: userEmail,
        is_logged_in: isLoggedIn, 
        items: cartItems.map(item => ({
            id: item.id,
            m_menu_id: item.m_menu_id || item.id,  
            m_menu_name: item.m_menu_name,
            quantity: item.quantity,                    
            m_price: item.m_price                       
        }))
    };

    try {
        const response = await api.post("/save-customer-data", orderPayload);
        
        if(response.data.success || response.data.status === 200 || response.data.customer_id || response.data.local_order) {
            alert("Order placed successfully!");
            if (clearCart && typeof clearCart === 'function') {
                clearCart();
            } else {
                localStorage.removeItem('siteCart');
            }
            navigate('/'); 
        } else {
             console.error("API Response:", response.data);
             alert("Order failed: " + (response.data.message || "Unknown error"));
        }

    } catch (error) {
        console.error("❌ Submission Error:", error);
        const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        alert(`Failed to place order: ${serverMessage}`);
    } finally {
        setLoading(false);
    }
  };

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
        
        {toast.show && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 font-bold text-sm">
                    <FaExclamationCircle size={20} />
                    {toast.message}
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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

                  <tr className="border-b border-gray-100">
                    <td className="py-4 align-middle">
                        Order Method <span className="text-red-500">*</span>
                    </td>
                    <td className="py-4 text-right">
                        <select 
                            name="order_method" 
                            value={formData.order_method} 
                            onChange={handleChange}
                            className="bg-[#F3F4F7] border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#C59D5F] focus:border-[#C59D5F] block w-full p-2.5 outline-none font-['Arial']"
                            required
                        >
                            <option value="">Select Method</option>
                            <option value="Home delivery">Home delivery</option>
                            <option value="Take a way">Take a way</option>
                            <option value="Parcel">Parcel</option>
                            <option value="Dine-in">Dine-in</option>
                        </select>
                        
                        {['Dine-in', 'Parcel'].includes(formData.order_method) && bookingData.table_no && bookingData.table_no.length > 0 && (
                            <div className="text-xs text-[#C59D5F] mt-2 font-normal">
                                {formData.order_method === 'Dine-in' ? 'Table(s)' : 'Table'}: {bookingData.table_no.join(', ')} <br/>
                                {bookingData.date.toLocaleDateString()} at {bookingData.time}
                                
                                {/* Show Number of Persons in summary if Dine-in */}
                                {formData.order_method === 'Dine-in' && personCount && (
                                    <span><br/>Guests: {personCount}</span>
                                )}

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

        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
                    
                    <div className="bg-[#0E1014] p-5 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-['Barlow_Condensed'] font-bold text-white uppercase tracking-wider">
                            Order Method: <span className="text-[#C59D5F]">{formData.order_method}</span>
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        
                        {formData.order_method === 'Dine-in' ? (
                            <div>
                                {/* UI ONLY: Number of Persons */}
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

                                <label className="block text-gray-600 text-sm font-bold mb-4 uppercase tracking-wide">
                                    Select Table(s)
                                </label>
                                
                                {availableTables.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {availableTables.map(t => {
                                            const totalChairs = t.person_no || t.capacity || 4; 
                                            const topRow = Math.ceil(totalChairs / 2);
                                            const bottomRow = Math.floor(totalChairs / 2);
                                            
                                            // Check if this table is inside the selected array
                                            const isSelected = bookingData.table_no.includes(t.table_no);
                                            const isOccupied = t.is_occupied;

                                            return (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => {
                                                        if (!isOccupied) handleTableSelect(t.table_no);
                                                    }}
                                                    className={`
                                                        group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 relative
                                                        ${isOccupied 
                                                            ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-70' 
                                                            : isSelected 
                                                                ? 'border-[#C59D5F] bg-amber-50 shadow-md transform scale-105 cursor-pointer' 
                                                                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                                                        }
                                                    `}
                                                >
                                                    {isOccupied && (
                                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
                                                            BUSY
                                                        </div>
                                                    )}

                                                    <div className="flex gap-1 mb-1">{renderChairs(topRow, 'top')}</div>
                                                    <div className={`
                                                        w-full h-16 rounded-md flex flex-col items-center justify-center shadow-inner relative overflow-hidden
                                                        ${isOccupied 
                                                            ? 'bg-red-200 text-red-800' 
                                                            : isSelected 
                                                                ? 'bg-[#C59D5F] text-white' 
                                                                : 'bg-gray-200 text-gray-600'
                                                        }
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
                        <div>
                            <label className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">
                                Table No.
                            </label>
                            <select 
                                name="table_no" 
                                // Parcel only allows selecting one table
                                value={bookingData.table_no.length > 0 ? bookingData.table_no[0] : ''}
                                onChange={(e) => setBookingData(prev => ({ ...prev, table_no: [e.target.value] }))}
                                className="w-full bg-[#F3F4F7] border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#C59D5F] outline-none text-gray-700 cursor-pointer"
                            >
                                <option value="">-- Select a Table --</option>
                                {availableTables.length > 0 ? (
                                    availableTables.map(t => (
                                        <option key={t.id} value={t.table_no} disabled={t.is_occupied}>
                                            Table {t.table_no} {t.capacity ? `(${t.capacity} Seats)` : ''} {t.is_occupied ? '(Occupied)' : ''}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No tables available</option>
                                )}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Please select a table for your parcel order.</p>
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
                                    <svg slot="previous" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                                    <svg slot="next" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
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
  );
}