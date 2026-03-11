import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../../api'; 

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  
  // --- USER-SPECIFIC CART SOLUTION ---
  // Helper function to get the correct storage key for the current user
  const getCartKey = () => {
      try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
              const userObj = JSON.parse(userStr);
              if (userObj && userObj.id) {
                  return `cart_user_${userObj.id}`;
              }
          }
      } catch(e) {}
      return 'cart_guest';
  };

  // Initialize cart based on the current user
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem(getCartKey());
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
 
  const toggleCart = () => setIsCartOpen(prev => !prev);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  // --- CART AUTO-SYNC SOLUTION ---
  const syncCart = async () => {
    try {
      const res = await api.get('/menu_user/list');
      const liveMenu = Array.isArray(res.data) ? res.data : [];
      if (liveMenu.length === 0) return;

      setCartItems(prevItems => {
        if (prevItems.length === 0) return prevItems;
        
        return prevItems.map(item => {
          const liveItem = liveMenu.find(m => String(m.m_menu_sl) === String(item.m_menu_sl));
          if (liveItem) {
            // Force update the cart item with the absolute latest DB pricing/discounts
            return {
              ...item,
              m_price: liveItem.m_price,
              discount: liveItem.discount,
              m_status: liveItem.m_status
            };
          }
          return item; 
        });
      });
    } catch (error) {
      console.error("Cart Sync Error:", error);
    }
  };

  // Sync when sidebar opens
  useEffect(() => {
    if (isCartOpen) {
      syncCart();
    }
  }, [isCartOpen]);

  // --- LISTEN FOR LOGIN/LOGOUT TO SWITCH CARTS ---
  useEffect(() => {
      const handleStorageChange = () => {
          // When user logs in/out, the key changes. We load the new cart.
          const newKey = getCartKey();
          const newCartStr = localStorage.getItem(newKey);
          setCartItems(newCartStr ? JSON.parse(newCartStr) : []);
      };

      // Listen to storage events (useful across multiple tabs)
      window.addEventListener('storage', handleStorageChange);
      
      // Listen to our custom event (triggered by Login.jsx and Navbar.jsx)
      window.addEventListener('userAuthStateChanged', handleStorageChange);

      return () => {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('userAuthStateChanged', handleStorageChange);
      };
  }, []);

  // Save the cart items to the *specific user's* key whenever they change
  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cartItems));
  }, [cartItems]);

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(getCartKey());
  };

  const handleAddToCart = (product, delta, branchId, branchName) => {
    setCartItems(prev => {
      if (prev.length > 0) {
        const currentBranchId = prev[0].branchId; 
        if (String(currentBranchId) !== String(branchId)) {
          if (delta > 0) {
             return [{ ...product, menu_id: product.m_menu_sl, quantity: delta, branchId, branchName }];
          }
          return prev; 
        }
      }

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

  // --- THE MATH ENGINE ---
  const cartSubTotal = cartItems.reduce((total, item) => {
      return total + ((parseFloat(item.m_price) || 0) * item.quantity);
  }, 0);

  const cartDiscount = cartItems.reduce((total, item) => {
      const price = parseFloat(item.m_price) || 0;
      let discPerc = 0;
      try {
          const d = item.discount ? JSON.parse(item.discount) : {};
          discPerc = Number(d[item.branchId]) || 0;
      } catch(e) { 
          discPerc = 0; 
      }
      return total + (price * (discPerc / 100) * item.quantity);
  }, 0);

  const cartTotal = cartSubTotal - cartDiscount;

  return (
    <CartContext.Provider value={{ 
        cartItems, 
        handleAddToCart, 
        removeFromCart, 
        clearCart,
        syncCart,      // EXPORT THE SYNC FUNCTION
        cartSubTotal,  
        cartDiscount,  
        cartTotal,     
        isCartOpen,
        setIsCartOpen,
        toggleCart,
        closeCart,
        openCart
    }}>
      {children}
    </CartContext.Provider>
  );
};