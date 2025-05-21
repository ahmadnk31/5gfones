import { getCategoryDiscount } from "@/lib/discount-service";
import { calculateDiscountedPrice, getEffectiveDiscountPercentage } from "@/lib/discount";

/**
 * Middleware for enhancing products with category discount information
 * This function adds category discounts to product data for display and pricing
 * 
 * @param product A single product object
 * @returns The product with added categoryDiscount field
 */
export async function withCategoryDiscount<T extends { category_id: number }>(product: T): Promise<T & { categoryDiscount: number }> {
  // Get category discount if a category_id exists
  const categoryDiscount = product.category_id 
    ? await getCategoryDiscount(product.category_id)
    : 0;
    
  return {
    ...product,
    categoryDiscount
  };
}

/**
 * Process multiple products to add category discount information
 * 
 * @param products Array of product objects
 * @returns Array of products with added categoryDiscount field
 */
export async function withCategoryDiscounts<T extends { category_id: number }>(products: T[]): Promise<(T & { categoryDiscount: number })[]> {
  // Get unique category IDs
  const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
  
  // If there are no valid category IDs, return products with 0 discounts
  if (categoryIds.length === 0) {
    return products.map(p => ({ ...p, categoryDiscount: 0 }));
  }
  
  // Get discounts for all categories at once
  const { getCategoryDiscounts } = await import('@/lib/discount-service');
  const discountMap = await getCategoryDiscounts(categoryIds);
  
  // Apply discounts to products
  return products.map(product => ({
    ...product,
    categoryDiscount: product.category_id ? discountMap[product.category_id] || 0 : 0
  }));
}
