/**
 * Utilities for handling shopping cart operations
 */

// Types for cart items
interface CartItem {
  id: string | number;
  type: "product" | "refurbished" | "accessory" | "part";
  name: string;
  price: number;
  quantity: number;
  image?: string;
  attributes?: Record<string, any>;
}

/**
 * Get the current cart from local storage
 */
export const getCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  const cartData = localStorage.getItem("cart");
  if (!cartData) return [];

  try {
    return JSON.parse(cartData);
  } catch (error) {
    console.error("Error parsing cart data:", error);
    return [];
  }
};

/**
 * Save the cart to local storage
 */
export const saveCart = (cart: CartItem[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    // Dispatch an event to notify components about cart updates
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Error saving cart data:", error);
  }
};

/**
 * Add item to cart
 */
export const addToCart = (item: CartItem): void => {
  const cart = getCart();

  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(
    (cartItem) => cartItem.id === item.id && cartItem.type === item.type
  );

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    cart.push(item);
  }

  saveCart(cart);
};

/**
 * Remove item from cart
 */
export const removeFromCart = (id: string | number, type: string): void => {
  const cart = getCart();
  const updatedCart = cart.filter(
    (item) => !(item.id === id && item.type === type)
  );
  saveCart(updatedCart);
};

/**
 * Update item quantity in cart
 */
export const updateCartItemQuantity = (
  id: string | number,
  type: string,
  quantity: number
): void => {
  const cart = getCart();

  const itemIndex = cart.findIndex(
    (item) => item.id === id && item.type === type
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart[itemIndex].quantity = quantity;
    }

    saveCart(cart);
  }
};

/**
 * Get the total price of items in cart
 */
export const getCartTotal = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

/**
 * Get the total number of items in cart
 */
export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Clear the entire cart
 */
export const clearCart = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("cartUpdated"));
};

/**
 * Add a refurbished product to cart
 */
export const addRefurbishedToCart = (
  id: number,
  name: string,
  price: number,
  quantity: number = 1,
  image?: string,
  condition?: string,
  variantId?: number,
  variantInfo?: Record<string, string>
): void => {
  const itemId = variantId ? `${id}-variant-${variantId}` : id;

  addToCart({
    id: itemId,
    type: "refurbished",
    name,
    price,
    quantity,
    image,
    attributes: {
      condition,
      refurbishedProductId: id,
      ...(variantId ? { variantId } : {}),
      ...(variantInfo || {}),
    },
  });
};
