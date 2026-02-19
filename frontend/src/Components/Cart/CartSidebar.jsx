import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { FaTimes, FaTrashAlt, FaPlus, FaMinus, FaShoppingCart, FaStore } from 'react-icons/fa';
import { IMAGE_BASE_URL } from '../../config'; 

export default function CartSidebar() {
  const { cartItems, isCartOpen, closeCart, handleAddToCart, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart(); 
    navigate('/checkout'); 
  };

  // Get Branch Name from the first item (since all items must be from same branch)
  const currentBranch = cartItems.length > 0 ? cartItems[0].branchName : "Branch";

  return (
    <>
      {/* 1. NO BACKDROP OVERLAY 
         By removing the overlay div, users can interact with the rest of the page 
         while the sidebar is open. 
      */}

      {/* 2. Sidebar Container (RIGHT Side) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        // Changed border-right to border-left for visual separation from the left side content
        style={{ borderLeft: '1px solid #e5e7eb' }}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-5 border-b bg-[#0E1014] text-white">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-['Barlow_Condensed'] font-bold uppercase tracking-wide">
                Your Cart <span className="text-[#C59D5F]">({cartItems.length})</span>
                </h2>
                <button onClick={closeCart} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes size={24} />
                </button>
            </div>
            {/* Show Branch Name if items exist */}
            {cartItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FaStore className="text-[#C59D5F]" />
                    <span className="uppercase tracking-wider">Ordering from: {currentBranch}</span>
                </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FaShoppingCart size={48} className="mb-4 opacity-20" />
                <p>Your cart is empty.</p>
                <button onClick={closeCart} className="mt-4 text-[#C59D5F] underline">Start Ordering</button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {/* Image */}
                  <img 
                    src={item.m_image ? `${IMAGE_BASE_URL}/${item.m_image}` : "https://via.placeholder.com/80"} 
                    alt={item.m_menu_name} 
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  
                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 line-clamp-1">{item.m_menu_name}</h4>
                      <p className="text-xs text-gray-500">Tk {Number(item.m_price).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      {/* Qty */}
                      <div className="flex items-center gap-2 bg-white border rounded px-1 py-1">
                        {/* Minus Button */}
                        <button 
                          onClick={() => handleAddToCart(item, -1, item.branchId, item.branchName)}
                          className="p-1 text-black hover:text-red-500 transition-colors"
                        >
                          <FaMinus size={10} />
                        </button>

                        {/* Quantity Span */}
                        <span className="text-sm text-black font-bold w-4 text-center">
                          {item.quantity}
                        </span>

                        {/* Plus Button */}
                        <button 
                          onClick={() => handleAddToCart(item, 1, item.branchId, item.branchName)}
                          className="p-1 text-black hover:text-[#C59D5F] transition-colors"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-800">
                <span>Subtotal:</span>
                <span className="text-[#C59D5F]">Tk {cartTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#C59D5F] text-white font-bold py-3 rounded-lg uppercase tracking-widest hover:bg-[#0E1014] transition-all duration-300"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}