/**
 * Utility functions for handling discounts in the application
 */

/**
 * Calculate the discounted price for a product
 * 
 * @param basePrice The original price of the product
 * @param productDiscount Product-specific discount percentage (0-100)
 * @param categoryDiscount Category-specific discount percentage (0-100)
 * @returns The final price after applying the higher discount
 */
export const calculateDiscountedPrice = (
  basePrice: number,
  productDiscount: number = 0,
  categoryDiscount: number = 0
): number => {
  // Use the higher discount between product and category discount
  const effectiveDiscount = Math.max(productDiscount, categoryDiscount);
  
  if (effectiveDiscount <= 0) {
    return basePrice;
  }
  
  // Calculate the discounted price
  const discountAmount = (basePrice * effectiveDiscount) / 100;
  return basePrice - discountAmount;
};

/**
 * Determine if a product has a discount (either product-specific or category-based)
 * 
 * @param productDiscount Product-specific discount percentage (0-100)
 * @param categoryDiscount Category-specific discount percentage (0-100)
 * @returns Boolean indicating if there's any discount available
 */
export const hasDiscount = (
  productDiscount: number = 0,
  categoryDiscount: number = 0
): boolean => {
  return productDiscount > 0 || categoryDiscount > 0;
};

/**
 * Get the effective discount percentage (the higher of product or category discount)
 * 
 * @param productDiscount Product-specific discount percentage (0-100)
 * @param categoryDiscount Category-specific discount percentage (0-100)
 * @returns The effective discount percentage
 */
export const getEffectiveDiscountPercentage = (
  productDiscount: number = 0,
  categoryDiscount: number = 0
): number => {
  return Math.max(productDiscount, categoryDiscount);
};

/**
 * Format a price as a currency string
 * 
 * @param amount The price amount
 * @param currencyCode The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'USD'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};
