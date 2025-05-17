import { createClient } from "@/lib/supabase/client";

/**
 * Filter options interface
 */
export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  categoryIds?: number[];
  brandIds?: number[];
  inStockOnly?: boolean;
  sortBy?: SortOption;
  condition?: string;
  hasVariations?: boolean | null;
}

/**
 * Sort option for product results
 */
export type SortOption =
  | "newest" // newest first
  | "oldest" // oldest first
  | "priceAsc" // price low to high
  | "priceDesc" // price high to low
  | "nameAsc" // alphabetical A to Z
  | "nameDesc" // alphabetical Z to A
  | "relevance"; // most relevant (default for search)

/**
 * Brand data for filters
 */
export interface Brand {
  id: number;
  name: string;
  image_url?: string | null;
}

/**
 * Category data for filters
 */
export interface Category {
  id: number;
  name: string;
  image_url?: string | null;
  parent_id?: number | null;
}

/**
 * Safe filter helpers for manipulating filter arrays
 */
export const FilterHelpers = {
  /**
   * Toggle an item in a filter array
   */
  toggleItem: (array: number[] | undefined, itemId: number, isChecked: boolean): number[] => {
    const currentArray = array || [];
    
    if (isChecked) {
      // Add the item if it's not already in the list
      return currentArray.includes(itemId) 
        ? currentArray 
        : [...currentArray, itemId];
    } else {
      // Remove the item from the list
      return currentArray.filter(id => id !== itemId);
    }
  },
  
  /**
   * Add an item to a filter array if it doesn't exist
   */
  addItem: (array: number[] | undefined, itemId: number): number[] => {
    const currentArray = array || [];
    return currentArray.includes(itemId) 
      ? currentArray 
      : [...currentArray, itemId];
  },
  
  /**
   * Remove an item from a filter array
   */
  removeItem: (array: number[] | undefined, itemId: number): number[] => {
    const currentArray = array || [];
    return currentArray.filter(id => id !== itemId);
  },
  
  /**
   * Check if an item is in a filter array
   */
  isItemSelected: (array: number[] | undefined, itemId: number): boolean => {
    return Array.isArray(array) && array.includes(itemId);
  },
  
  /**
   * Reset all filters except for the sort option
   */
  resetFilters: (filters: FilterOptions): FilterOptions => {
    const sortBy = filters.sortBy || "relevance";
    return { sortBy };
  }
};

/**
 * Fetch all available brands for filtering
 */
export async function fetchBrands(): Promise<Brand[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, image_url")
    .order("name");

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all available categories for filtering
 */
export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, image_url, parent_id")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
}

/**
 * Get price range (min and max) for all products
 */
export async function fetchPriceRange(): Promise<{ min: number; max: number }> {
  const supabase = createClient();

  // Get minimum price
  const { data: minData, error: minError } = await supabase
    .from("products")
    .select("base_price")
    .order("base_price", { ascending: true })
    .limit(1)
    .single();

  // Get maximum price
  const { data: maxData, error: maxError } = await supabase
    .from("products")
    .select("base_price")
    .order("base_price", { ascending: false })
    .limit(1)
    .single();

  if (minError || maxError) {
    console.error("Error fetching price range:", minError || maxError);
    return { min: 0, max: 1000 }; // Default range
  }

  return {
    min: minData?.base_price || 0,
    max: maxData?.base_price || 1000,
  };
}

/**
 * Apply sorting to a Supabase query
 */
export function applySorting(query: any, sortOption?: SortOption) {
  if (!sortOption || sortOption === "relevance") {
    // Default sorting will be handled by vector search or text search
    return query;
  }

  switch (sortOption) {
    case "newest":
      return query.order("created_at", { ascending: false });
    case "oldest":
      return query.order("created_at", { ascending: true });
    case "priceAsc":
      return query.order("base_price", { ascending: true });
    case "priceDesc":
      return query.order("base_price", { ascending: false });
    case "nameAsc":
      return query.order("name", { ascending: true });
    case "nameDesc":
      return query.order("name", { ascending: false });
    default:
      return query;
  }
}

/**
 * Apply filters and sorting to a Supabase query
 */
export function applyFiltersToQuery(query: any, filters: FilterOptions) {
  if (!filters) return query;

  // Price filter
  if (filters.minPrice !== undefined) {
    query = query.gte("base_price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("base_price", filters.maxPrice);
  }

  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query = query.in("category_id", filters.categoryIds);
  }

  // Brand filter
  if (filters.brandIds && filters.brandIds.length > 0) {
    query = query.in("brand_id", filters.brandIds);
  }

  // Stock filter
  if (filters.inStockOnly) {
    query = query.gt("in_stock", 0);
  }

  // Apply sorting if provided
  query = applySorting(query, filters.sortBy);

  return query;
}

/**
 * Synchronize filters with URL parameters
 */
export function syncFiltersWithUrl(filters: FilterOptions): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('syncFiltersWithUrl called in a non-browser environment');
    return;
  }
  
  try {
    console.log('syncFiltersWithUrl: Starting URL update with filters:', filters);
    
    // Get the current URL
    const url = new URL(window.location.href);
    console.log('syncFiltersWithUrl: Current URL:', url.toString());
    
    // Update URL parameters based on filter values
    if (filters.minPrice !== undefined) {
      url.searchParams.set("minPrice", filters.minPrice.toString());
      console.log(`syncFiltersWithUrl: Setting minPrice=${filters.minPrice}`);
    } else {
      url.searchParams.delete("minPrice");
      console.log('syncFiltersWithUrl: Removing minPrice param');
    }

    if (filters.maxPrice !== undefined) {
      url.searchParams.set("maxPrice", filters.maxPrice.toString());
      console.log(`syncFiltersWithUrl: Setting maxPrice=${filters.maxPrice}`);
    } else {
      url.searchParams.delete("maxPrice");
      console.log('syncFiltersWithUrl: Removing maxPrice param');
    }

    if (filters.inStockOnly) {
      url.searchParams.set("inStock", "true");
      console.log('syncFiltersWithUrl: Setting inStock=true');
    } else {
      url.searchParams.delete("inStock");
      console.log('syncFiltersWithUrl: Removing inStock param');
    }

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      url.searchParams.set("categories", filters.categoryIds.join(","));
      console.log(`syncFiltersWithUrl: Setting categories=${filters.categoryIds.join(",")}`);
    } else {
      url.searchParams.delete("categories");
      console.log('syncFiltersWithUrl: Removing categories param');
    }

    if (filters.brandIds && filters.brandIds.length > 0) {
      url.searchParams.set("brands", filters.brandIds.join(","));
      console.log(`syncFiltersWithUrl: Setting brands=${filters.brandIds.join(",")}`);
    } else {
      url.searchParams.delete("brands");
      console.log('syncFiltersWithUrl: Removing brands param');
    }

    if (filters.sortBy && filters.sortBy !== "relevance") {
      url.searchParams.set("sort", filters.sortBy);
      console.log(`syncFiltersWithUrl: Setting sort=${filters.sortBy}`);
    } else {
      url.searchParams.delete("sort");
      console.log('syncFiltersWithUrl: Removing sort param');
    }

    // Update URL without page reload - use try/catch to handle any browser issues
    try {
      console.log('syncFiltersWithUrl: Updating URL to:', url.toString());
      window.history.pushState({}, "", url.toString());
      console.log('syncFiltersWithUrl: URL update successful');
    } catch (err) {
      console.error('syncFiltersWithUrl: Error updating URL:', err);
    }
  } catch (error) {
    console.error('syncFiltersWithUrl: Unexpected error:', error);
  }
}

/**
 * Extract filters from URL parameters
 */
export function getFiltersFromUrl(): FilterOptions {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('getFiltersFromUrl called in a non-browser environment');
    return { sortBy: "relevance" };
  }
  
  try {
    console.log('getFiltersFromUrl: Starting to extract filters from URL');
    
    const url = new URL(window.location.href);
    console.log('getFiltersFromUrl: Current URL:', url.toString());
    
    const filters: FilterOptions = { sortBy: "relevance" };
    
    // Get min/max price from URL
    const minPrice = url.searchParams.get("minPrice");
    if (minPrice) {
      filters.minPrice = parseInt(minPrice, 10);
      console.log(`getFiltersFromUrl: Found minPrice=${filters.minPrice}`);
    }

    const maxPrice = url.searchParams.get("maxPrice");
    if (maxPrice) {
      filters.maxPrice = parseInt(maxPrice, 10);
      console.log(`getFiltersFromUrl: Found maxPrice=${filters.maxPrice}`);
    }

    // Get inStock filter
    const inStock = url.searchParams.get("inStock");
    if (inStock === "true") {
      filters.inStockOnly = true;
      console.log('getFiltersFromUrl: Found inStock=true');
    }

    // Get category IDs
    const categories = url.searchParams.get("categories");
    if (categories) {
      filters.categoryIds = categories.split(",").map(Number);
      console.log(`getFiltersFromUrl: Found categories=${filters.categoryIds}`);
    }

    // Get brand IDs
    const brands = url.searchParams.get("brands");
    if (brands) {
      filters.brandIds = brands.split(",").map(Number);
      console.log(`getFiltersFromUrl: Found brands=${filters.brandIds}`);
    }

    // Get sort option
    const sort = url.searchParams.get("sort");
    if (sort) {
      filters.sortBy = sort as SortOption;
      console.log(`getFiltersFromUrl: Found sort=${filters.sortBy}`);
    }
    
    console.log('getFiltersFromUrl: Extracted filters:', filters);
    return filters;
  } catch (error) {
    console.error('getFiltersFromUrl: Error extracting filters:', error);
    return { sortBy: "relevance" };
  }
}

/**
 * Alternative method to update URL with filters using Next.js router
 * This is a fallback in case window.history.pushState doesn't work properly
 */
export function updateRouterWithFilters(filters: FilterOptions, router: any, pathname: string): void {
  if (!router || !pathname) {
    console.error('updateRouterWithFilters: Missing router or pathname');
    return;
  }
  
  try {
    console.log('updateRouterWithFilters: Using Next.js router to update URL with filters');
    
    // Start with current query params
    const query: Record<string, string> = {};
    
    // Preserve existing 'q' parameter for search query if it exists
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const searchQuery = currentUrl.searchParams.get('q');
      if (searchQuery) {
        query.q = searchQuery;
      }
    }
    
    // Add filter parameters
    if (filters.minPrice !== undefined) {
      query.minPrice = filters.minPrice.toString();
    }
    
    if (filters.maxPrice !== undefined) {
      query.maxPrice = filters.maxPrice.toString();
    }
    
    if (filters.inStockOnly) {
      query.inStock = 'true';
    }
    
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query.categories = filters.categoryIds.join(',');
    }
    
    if (filters.brandIds && filters.brandIds.length > 0) {
      query.brands = filters.brandIds.join(',');
    }
    
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      query.sort = filters.sortBy;
    }
    
    // Use the router to navigate with the new query params
    // This will trigger a soft navigation without full page reload
    console.log('updateRouterWithFilters: Navigating to:', { pathname, query });
    router.push({ pathname, query }, undefined, { shallow: true });
    
  } catch (error) {
    console.error('updateRouterWithFilters: Error updating router:', error);
  }
}
