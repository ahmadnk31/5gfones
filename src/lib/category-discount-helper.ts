import { getCategoryDiscount, getCategoryDiscounts } from "@/lib/discount-service";
import { calculateDiscountedPrice, getEffectiveDiscountPercentage } from "@/lib/discount";

/**
 * Type for objects that can have category discounts applied
 */
interface WithCategoryId {
  category_id: number | null;
}

/**
 * Middleware for enhancing products with category discount information
 * This function adds category discounts to product data for display and pricing
 * 
 * @param product A single product object
 * @returns The product with added categoryDiscount field
 */
export async function withCategoryDiscount<T extends WithCategoryId>(
  product: T
): Promise<T & { categoryDiscount: number }> {
  // Get category discount if a category_id exists
  const categoryDiscount = product.category_id != null 
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
export async function withCategoryDiscounts<T extends WithCategoryId>(
  products: T[]
): Promise<(T & { categoryDiscount: number })[]> {
  // Get unique category IDs, filtering out null/undefined values
  const categoryIds = [...new Set(
    products
      .map(p => p.category_id)
      .filter((id): id is number => id != null)
  )];
  
  // If there are no valid category IDs, return products with 0 discounts
  if (categoryIds.length === 0) {
    return products.map(p => ({ ...p, categoryDiscount: 0 }));
  }
  
  // Get discounts for all categories at once
  const discountMap = await getCategoryDiscounts(categoryIds);
  
  // Apply discounts to products
  return products.map(product => ({
    ...product,
    categoryDiscount: product.category_id != null ? discountMap[product.category_id] || 0 : 0
  }));
}
