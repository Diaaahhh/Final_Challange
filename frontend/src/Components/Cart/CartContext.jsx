import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('siteCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('siteCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- MODIFIED: Handle Branch Conflict ---
  const handleAddToCart = (product, delta, branchId) => {
    setCartItems(prev => {
      // 1. Check for Branch Conflict
      // If cart has items, check if the new item belongs to the same branch
      if (prev.length > 0) {
        const currentBranchId = prev[0].branchId; // Get branch from first item
        
        // If branch IDs don't match, user is switching branches.
        // Clear cart and start fresh with new item.
        if (String(currentBranchId) !== String(branchId)) {
          // If delta is positive (adding), we replace cart. 
          // If removing (-1) from a different branch, we likely shouldn't do anything or just return empty.
          // Assuming this function is mostly triggered by "Add" or "Plus" on the menu page:
          if (delta > 0) {
             // alert("Cart cleared because you switched branches."); // Optional UX feedback
             return [{ ...product, quantity: 1, branchId }];
          }
          return prev; // Should not happen often if UI is consistent
        }
      }

      // 2. Standard Cart Logic (Same Branch)
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.id !== product.id);
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        if (delta > 0) {
          // Ensure we store branchId with the item
          return [...prev, { ...product, quantity: 1, branchId }];
        }
        return prev;
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate Subtotal
  const cartTotal = cartItems.reduce((total, item) => {
    // Ensure price is treated as a number
    const price = parseFloat(item.m_price) || 0; 
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, handleAddToCart, removeFromCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};