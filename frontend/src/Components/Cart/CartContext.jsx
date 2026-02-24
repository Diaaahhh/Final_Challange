import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('siteCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sidebar Visibility State
  const [isCartOpen, setIsCartOpen] = useState(false);
 
  const toggleCart = () => setIsCartOpen(prev => !prev);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  useEffect(() => {
    localStorage.setItem('siteCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- MODIFIED: Handle Branch Conflict & Store Branch Name ---
  // Added 'branchName' parameter to store it for display
  const handleAddToCart = (product, delta, branchId, branchName) => {
    
    setCartItems(prev => {
      // 1. Check for Branch Conflict
      if (prev.length > 0) {
        const currentBranchId = prev[0].branchId; 
        
        if (String(currentBranchId) !== String(branchId)) {
          // If branch differs, clear cart and start fresh
          if (delta > 0) {
             return [{ ...product, menu_id: product.m_menu_sl, quantity: delta, branchId, branchName }];
          }
          return prev; 
        }
      }

      // 2. Standard Cart Logic
      const existing = prev.find(item => item.m_menu_sl === product.m_menu_sl);
      
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.m_menu_sl !== product.m_menu_sl);
        }
        return prev.map(item => 
          item.m_menu_sl === product.m_menu_sl ? { ...item, quantity: newQty, branchName } : item
        );
      } else {
        if (delta > 0) {
          return [...prev, { ...product, menu_id: product.m_menu_sl, quantity: delta, branchId, branchName }];
        }
        return prev;
      }
    });
  };

  const removeFromCart = (menuSl) => {
    setCartItems(prev => prev.filter(item => item.m_menu_sl !== menuSl));
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.m_price) || 0; 
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
        cartItems, 
        handleAddToCart, 
        removeFromCart, 
        cartTotal,
        isCartOpen,
        toggleCart,
        closeCart,
        openCart,
        setIsCartOpen // Export setter if needed directly
    }}>
      {children}
    </CartContext.Provider>
  );
};