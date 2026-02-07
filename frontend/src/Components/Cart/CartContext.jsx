import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // FIX: Initialize state directly from localStorage to prevent overwriting
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('siteCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Now we only need ONE useEffect: To save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('siteCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleAddToCart = (product, delta) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        // Calculate new quantity
        const newQty = existing.quantity + delta;
        
        // If quantity goes to 0 or less, remove item
        if (newQty <= 0) {
          return prev.filter(item => item.id !== product.id);
        }

        // Otherwise update quantity
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        // If adding (delta > 0) and item doesn't exist, push new item
        if (delta > 0) {
          return [...prev, { ...product, quantity: 1 }];
        }
        return prev;
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate Subtotal
  const cartTotal = cartItems.reduce((acc, item) => acc + (Number(item.m_price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, handleAddToCart, removeFromCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};