import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { FaTimes, FaTrashAlt, FaPlus, FaMinus, FaShoppingCart, FaStore } from 'react-icons/fa';
import { IMAGE_BASE_URL } from '../../config'; 

export default function CartSidebar() {
  // Grab our new separated math values from context
  const { cartItems, isCartOpen, closeCart, handleAddToCart, removeFromCart, cartSubTotal, cartDiscount, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart(); 
    navigate('/checkout'); 
  };

  const currentBranch = cartItems.length > 0 ? cartItems[0].branchName : "Branch";

  return (
    <>
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-[#0E1014] text-white p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <FaShoppingCart className="text-[#C59D5F] text-xl" />
              <h2 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-widest m-0">Your Cart</h2>
            </div>
            <button onClick={closeCart} className="text-gray-400 hover:text-white transition-colors p-1">
              <FaTimes size={20} />
            </button>
          </div>
          
          {/* Branch Info Ribbon */}
          {cartItems.length > 0 && (
             <div className="bg-[#C59D5F] text-black px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
                 <FaStore /> Order from: {currentBranch}
             </div>
          )}

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaShoppingCart className="text-6xl mb-4 opacity-20" />
                <p className="text-lg">Your cart is empty.</p>
                <button onClick={closeCart} className="mt-4 text-[#C59D5F] underline hover:text-black">Continue Browsing</button>
              </div>
            ) : (
              cartItems.map(item => {
                // --- JSON DISCOUNT CALCULATION ---
                const basePrice = Number(item.m_price) || 0;
                let discPerc = 0;
                try {
                    const d = item.discount ? JSON.parse(item.discount) : {};
                    discPerc = Number(d[item.branchId]) || 0;
                } catch(e) { 
                    discPerc = 0; 
                }
                const effectivePrice = basePrice - (basePrice * (discPerc / 100));

                return (
                  <div key={item.m_menu_sl} className="flex gap-4 mb-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.m_image ? (
                        <img src={`${IMAGE_BASE_URL}${item.m_image}`} alt={item.m_menu_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">Img</div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[#0E1014] leading-tight mb-1">{item.m_menu_name}</h4>
                        <div className="flex items-center gap-2">
                           <p className="text-[#C59D5F] font-bold">Tk {effectivePrice.toLocaleString()}</p>
                           {/* SHOW DISCOUNT BADGE ON INDIVIDUAL CART ITEM */}
                           {discPerc > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">-{discPerc}%</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                          <button onClick={() => handleAddToCart(item, -1, item.branchId, item.branchName)} className="p-1 text-black hover:text-[#C59D5F] transition-colors"><FaMinus size={10} /></button>
                          <span className="px-3 text-sm font-bold text-gray-800">{item.quantity}</span>
                          <button onClick={() => handleAddToCart(item, 1, item.branchId, item.branchName)} className="p-1 text-black hover:text-[#C59D5F] transition-colors"><FaPlus size={10} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.m_menu_sl)} className="text-red-400 hover:text-red-600"><FaTrashAlt size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Math */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t bg-gray-50">
              <div className="space-y-2 mb-4 text-sm font-semibold text-gray-600">
                  <div className="flex justify-between">
                      <span>Base Subtotal</span>
                      <span>Tk {cartSubTotal.toLocaleString()}</span>
                  </div>
                  
                  {/* DYNAMIC DISCOUNT DISPLAY */}
                  {cartDiscount > 0 && (
                      <div className="flex justify-between text-red-500">
                          <span>Discount Applied</span>
                          <span>- Tk {cartDiscount.toLocaleString()}</span>
                      </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t text-lg font-bold text-[#0E1014]">
                      <span>Final Total:</span>
                      <span className="text-[#C59D5F]">Tk {cartTotal.toLocaleString()}</span>
                  </div>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#C59D5F] text-white font-bold py-3 rounded-lg uppercase tracking-widest hover:bg-[#0E1014] transition-all duration-300"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}