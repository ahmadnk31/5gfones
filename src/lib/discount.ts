/**
 * Utility functions for handling discounts in the application
 */

/**
 * Check if a discount is currently active based on start/end dates
 * 
 * @param startDate Optional start date for the discount
 * @param endDate Optional end date for the discount
 * @returns Boolean indicating if the discount is currently active
 */
export const isDiscountActive = (
  startDate?: string | null,
  endDate?: string | null
): boolean => {
  const now = new Date();
  
  // If there's a start date and it's in the future, discount is not active yet
  if (startDate && new Date(startDate) > now) {
    return false;
  }
  
  // If there's an end date and it's in the past, discount has expired
  if (endDate && new Date(endDate) < now) {
    return false;
  }
  
  // No date restrictions or within valid range
  return true;
};

/**
 * Calculate the discounted price for a product
 * 
 * @param basePrice The original price of the product
 * @param productDiscount Product-specific discount percentage (0-100)
 * @param categoryDiscount Category-specific discount percentage (0-100)
 * @param discountStartDate Optional start date for the product discount
 * @param discountEndDate Optional end date for the product discount
 * @returns The final price after applying the higher discount
 */
export const calculateDiscountedPrice = (
  basePrice: number,
  productDiscount: number = 0,
  categoryDiscount: number = 0,
  discountStartDate?: string | null,
  discountEndDate?: string | null
): number => {
  // Check if product discount is currently active
  const isProductDiscountActive = isDiscountActive(discountStartDate, discountEndDate);
  
  // If product discount is not active, use only category discount
  const effectiveProductDiscount = isProductDiscountActive ? productDiscount : 0;
  
  // Use the higher discount between product and category discount
  const effectiveDiscount = Math.max(effectiveProductDiscount, categoryDiscount);
  
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
 * @param discountStartDate Optional start date for the product discount
 * @param discountEndDate Optional end date for the product discount
 * @returns Boolean indicating if there's any discount available
 */
export const hasDiscount = (
  productDiscount: number = 0,
  categoryDiscount: number = 0,
  discountStartDate?: string | null,
  discountEndDate?: string | null
): boolean => {
  // Check if product discount is currently active
  const isProductDiscountActive = isDiscountActive(discountStartDate, discountEndDate);
  
  return (isProductDiscountActive && productDiscount > 0) || categoryDiscount > 0;
};

/**
 * Get the effective discount percentage (the higher of product or category discount)
 * 
 * @param productDiscount Product-specific discount percentage (0-100)
 * @param categoryDiscount Category-specific discount percentage (0-100)
 * @param discountStartDate Optional start date for the product discount
 * @param discountEndDate Optional end date for the product discount
 * @returns The effective discount percentage
 */
export const getEffectiveDiscountPercentage = (
  productDiscount: number = 0,
  categoryDiscount: number = 0,
  discountStartDate?: string | null,
  discountEndDate?: string | null
): number => {
  // Check if product discount is currently active
  const isProductDiscountActive = isDiscountActive(discountStartDate, discountEndDate);
  
  // If product discount is not active, use only category discount
  const effectiveProductDiscount = isProductDiscountActive ? productDiscount : 0;
  
  return Math.max(effectiveProductDiscount, categoryDiscount);
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
  currencyCode: string = 'EUR'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};
