import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Cart/CartContext'; 
import api from '../../api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, setCartItems } = useCart(); 
   
  const SHIPPING_COST = 100; 
  const grandTotal = cartTotal + SHIPPING_COST;

  const [formData, setFormData] = useState({
    cust_name: '',
    address: '',
    phone: '',
    payment_method: 'Cash' 
  });

  const [loading, setLoading] = useState(false);

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id) {
            const res = await api.get(`/user/${parsedUser.id}`);
            const userData = res.data;
            setFormData({
              cust_name: userData.name || '',
              address: userData.address || '',
              phone: userData.phone || '',
              payment_method: 'Cash'
            });
          }
        } catch (err) {
          console.error("Error loading user data:", err);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.cust_name || !formData.address || !formData.phone) {
        alert("Please fill in all details.");
        return;
    }
    
    setLoading(true);

    const orderPayload = {
        phone: String(formData.phone),
        cust_name: formData.cust_name,
        address: formData.address,
        waiter: "65",
        table_no: "home_delivery",
        discount: 0, // Number
        payment_method: "cash", 
        
        branch_id: 1, // Fixed ID
        
        total: grandTotal, 
        payment_details: {
            total: grandTotal
        },

        // Mapped items
        items: cartItems.map(item => ({
            id: item.id,
            menu_id: item.id, // Just in case backend expects menu_id
            name: item.m_menu_name,
            qty: item.quantity,
            price: item.m_price
        }))
    };

    try {
        const response = await api.post("/api/proxy/place-order", orderPayload);
        
        // Flexible success check
        if(response.data.success || response.data.status === 200 || response.data.customer_id) {
            alert("Order placed successfully!");
            setCartItems([]); 
            navigate('/'); 
        } else {
             console.error("API Response:", response.data);
             alert("Order failed: " + (response.data.message || "Unknown error"));
        }

    } catch (error) {
        console.error("❌ Submission Error:", error);
        const serverMessage = error.response?.data?.message || 
                              error.response?.data?.error || 
                              error.message;
        alert(`Failed to place order: ${serverMessage}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-['Inter']">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Billing Details */}
          <div>
            <h3 className="text-2xl md:text-3xl font-['Barlow_Condensed'] font-bold uppercase italic text-[#0E1014] mb-8 border-l-4 border-[#C59D5F] pl-4">
              Billing Details
            </h3>
            <div className="space-y-6">
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Full Name</label>
                <input type="text" name="cust_name" value={formData.cust_name} onChange={handleChange} placeholder="Your Name" className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" required />
              </div>
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House number and street name" className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" required />
              </div>
              <div className="form-group">
                <label className="block text-gray-500 text-sm mb-2">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full bg-[#F3F4F7] border-none rounded px-5 py-4 focus:ring-2 focus:ring-[#C59D5F] outline-none transition-all text-gray-700 placeholder-gray-400" required />
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
                  <tr className="border-b border-gray-100"><td className="py-4">Cart Subtotal</td><td className="py-4 text-right text-[#C59D5F]">Tk {cartTotal.toLocaleString()}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-4">Shipping</td><td className="py-4 text-right">Tk {SHIPPING_COST}</td></tr>
                  <tr><td className="py-5 text-xl font-['Barlow_Condensed'] uppercase">Order Total</td><td className="py-5 text-right text-xl text-[#C59D5F]">Tk {grandTotal.toLocaleString()}</td></tr>
                </tfoot>
              </table>
              <button type="submit" disabled={loading} className={`w-full bg-[#0E1014] text-white font-['Barlow_Condensed'] font-bold uppercase italic tracking-wider py-4 rounded hover:bg-[#C59D5F] hover:text-white transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}