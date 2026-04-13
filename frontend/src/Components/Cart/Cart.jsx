import React from "react";
import { useCart } from "./CartContext";
import { FaTrashAlt, FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import { IMAGE_BASE_URL } from "../../config";

// --- CRITICAL FIX: Must be 'export default' ---
export default function Cart() {
  const { cartItems, handleAddToCart, removeFromCart, cartTotal } = useCart();

  const SHIPPING_COST = 100;
  const grandTotal = cartTotal + SHIPPING_COST;

  return (
    <div 
      className="min-h-screen pt-24 pb-12 transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-body)' }}
    >
      <div className="container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 font-['Barlow_Condensed']  border-b border-gray-200 pb-2">Your Cart</h2>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xl flex flex-col items-center">
            <FaShoppingCart className="text-6xl mb-4 opacity-20" />
            Your cart is empty.
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* LEFT SIDE: Product Table */}
            <div className="w-full xl:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600  text-sm font-bold">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Quantity</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 flex items-center gap-4">
                          <img 
                            src={item.m_image ? `${IMAGE_BASE_URL}/${item.m_image}` : "https://via.placeholder.com/80"} 
                            alt={item.m_menu_name} 
                            className="w-16 h-16 object-cover rounded-md border border-gray-200"
                          />
                          <span className="font-bold text-gray-800">{item.m_menu_name}</span>
                        </td>
                        <td className="p-4 text-gray-600">Tk {Number(item.m_price).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                            <button 
                              onClick={() => handleAddToCart(item, -1, item.branchId)}
                              className="p-2 bg-white text-gray-800 rounded shadow-sm hover:text-red-500 transition-colors"
                            >
                              <FaMinus size={10} />
                            </button>
                            <span className="w-8 text-center text-gray-800 font-bold text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => handleAddToCart(item, 1, item.branchId)}
                              className="p-2 theme-accent-bg text-white rounded shadow-sm hover:opacity-90 transition-colors"
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 font-bold theme-accent">
                          Tk {(Number(item.m_price) * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT SIDE: Totals */}
            <div className="w-full xl:w-1/3 bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-4  text-gray-800 border-b border-gray-100 pb-2">Cart Totals</h3>
              <div className="flex justify-between py-3 text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold">Tk {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 text-gray-600 border-b border-gray-200">
                <span>Shipping</span>
                <span className="font-bold">Tk {SHIPPING_COST}</span>
              </div>
              <div className="flex justify-between py-4 text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="theme-accent">Tk {grandTotal.toLocaleString()}</span>
              </div>
              
              <a
                href="/checkout"
                className="block w-full theme-accent-bg text-white text-center py-4 rounded-lg font-bold  tracking-wider hover:opacity-90 transition-all shadow-md mt-4"
              >
                Proceed to Checkout
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}