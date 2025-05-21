import { createClient } from "@/lib/supabase/client";

// Active discount cache by category ID with expiration mechanism
interface DiscountCache {
  discounts: Record<number, number>;
  lastFetched: number;
}

// Cache will expire after 5 minutes
const CACHE_EXPIRY_MS = 5 * 60 * 1000;
let discountCache: DiscountCache = {
  discounts: {},
  lastFetched: 0,
};

/**
 * Check if the cache is valid or needs refreshing
 */
const isCacheValid = (): boolean => {
  const now = Date.now();
  return (
    discountCache.lastFetched > 0 &&
    now - discountCache.lastFetched < CACHE_EXPIRY_MS
  );
};

/**
 * Get active discount percentage for a specific category
 * Returns 0 if no active discount exists
 * 
 * @param categoryId The category ID to check for discounts
 * @returns A number representing percentage discount (0-100)
 */
export async function getCategoryDiscount(categoryId: number): Promise<number> {
  if (!categoryId) return 0;
  
  // Check if we need to refresh the cache
  if (!isCacheValid()) {
    await refreshDiscountCache();
  }
  
  // Return the cached discount or 0 if none exists
  return discountCache.discounts[categoryId] || 0;
}

/**
 * Get active discount percentages for multiple categories
 * 
 * @param categoryIds Array of category IDs to check for discounts
 * @returns Record of category IDs to their discount percentages
 */
export async function getCategoryDiscounts(categoryIds: number[]): Promise<Record<number, number>> {
  if (!categoryIds.length) return {};
  
  // Check if we need to refresh the cache
  if (!isCacheValid()) {
    await refreshDiscountCache();
  }
  
  // Return only the requested category discounts
  const result: Record<number, number> = {};
  for (const categoryId of categoryIds) {
    result[categoryId] = discountCache.discounts[categoryId] || 0;
  }
  
  return result;
}

/**
 * Refresh the discount cache with fresh data from the database
 */
async function refreshDiscountCache(): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  try {
    // Query active discounts that are currently applicable
    const { data, error } = await supabase
      .from("category_discounts")
      .select("category_id, discount_percentage")
      .eq("is_active", true)
      .lte("start_date", now)
      .or(`end_date.gt.${now},end_date.is.null`);
    
    if (error) throw error;
    
    // Reset and rebuild the cache
    const newDiscounts: Record<number, number> = {};
    
    // Process the discounts, keeping only the highest discount per category
    data?.forEach(item => {
      const categoryId = item.category_id;
      const percentage = item.discount_percentage;
      
      // Only keep the highest discount for each category
      if (!newDiscounts[categoryId] || percentage > newDiscounts[categoryId]) {
        newDiscounts[categoryId] = percentage;
      }
    });
    
    // Update the cache
    discountCache = {
      discounts: newDiscounts,
      lastFetched: Date.now()
    };
    
  } catch (error) {
    console.error("Error refreshing discount cache:", error);
    // If there's an error, we'll keep using the old cache until it expires
  }
}

/**
 * Force refresh the discount cache immediately
 * Use this after creating/updating/deleting discounts to ensure fresh data
 */
export async function forceRefreshDiscountCache(): Promise<void> {
  await refreshDiscountCache();
}
