import { useState, useCallback } from "react";
import { LaundryCartItem, LaundryCartSummary, ClothingItem, LaundryService } from "@shared/schema";
import { getTaxRate } from "@/lib/tax";

export function useLaundryCart() {
  const [cartItems, setCartItems] = useState<LaundryCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pay_later">("cash");

  const addToCart = useCallback((clothingItem: ClothingItem, service: LaundryService, quantity: number = 1) => {
    setCartItems(prev => {
      // Create unique ID combining clothing item and service
      const uniqueId = `${clothingItem.id}-${service.id}`;
      const existing = prev.find(item => item.id === uniqueId);
      
      if (existing) {
        return prev.map(item =>
          item.id === uniqueId
            ? { 
                ...item, 
                quantity: item.quantity + quantity, 
                total: (item.quantity + quantity) * parseFloat(service.price) 
              }
            : item
        );
      }
      
      const price = parseFloat(service.price);
      return [...prev, {
        id: uniqueId,
        clothingItem,
        service,
        quantity,
        total: quantity * price
      }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity, total: quantity * parseFloat(item.service.price) }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartSummary = useCallback((): LaundryCartSummary => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = getTaxRate();
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: cartItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount
    };
  }, [cartItems]);

  return {
    cartItems,
    paymentMethod,
    setPaymentMethod,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSummary
  };
}