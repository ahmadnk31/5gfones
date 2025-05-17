"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  variant_name?: string;
  variant_value?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number, variantId?: number) => void;
  updateQuantity: (id: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart data:", error);
        setItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("cart", JSON.stringify(items));
    } else {
      localStorage.removeItem("cart");
    }

    // Dispatch custom event for components like navbar to update
    const event = new Event("cartUpdated");
    window.dispatchEvent(event);
  }, [items]);

  // Calculate total number of items in cart
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  // Calculate cart subtotal
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Add item to cart
  const addItem = (newItem: CartItem) => {
    setItems((currentItems) => {
      // Check if the item already exists in the cart
      const existingItemIndex = currentItems.findIndex(
        (item) =>
          item.product_id === newItem.product_id &&
          ((!item.variant_id && !newItem.variant_id) ||
            item.variant_id === newItem.variant_id)
      );

      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        // Add new item to cart
        return [...currentItems, newItem];
      }
    });
  };

  // Remove item from cart
  const removeItem = (id: number, variantId?: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => {
        if (variantId) {
          return !(item.product_id === id && item.variant_id === variantId);
        } else {
          return item.product_id !== id;
        }
      })
    );
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      removeItem(id, variantId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (
          item.product_id === id &&
          ((!variantId && !item.variant_id) || variantId === item.variant_id)
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
