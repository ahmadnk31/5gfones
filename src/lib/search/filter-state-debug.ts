import { FilterOptions } from "./filter-utils";

/**
 * Helper functions to debug and fix filter state persistence issues
 */

// Store filter state with timestamp
export function saveFilterState(filters: FilterOptions): void {
  try {
    if (typeof window === 'undefined') return;
    
    const stateToSave = {
      filters,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    localStorage.setItem('debug_filter_state', JSON.stringify(stateToSave));
    console.log("Filter state saved:", stateToSave);
  } catch (err) {
    console.error("Error saving filter state:", err);
  }
}

// Get stored filter state
export function getFilterState(): FilterOptions | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const savedState = localStorage.getItem('debug_filter_state');
    if (!savedState) return null;
    
    const parsed = JSON.parse(savedState);
    console.log("Retrieved filter state:", parsed);
    
    return parsed.filters;
  } catch (err) {
    console.error("Error getting filter state:", err);
    return null;
  }
}

// Ensure the URL properly reflects filter state
export function fixUrlWithFilters(filters: FilterOptions): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const url = new URL(window.location.href);
    let changed = false;
    
    // Check and update minPrice
    if (filters.minPrice !== undefined) {
      const currentMinPrice = url.searchParams.get('minPrice');
      if (currentMinPrice !== filters.minPrice.toString()) {
        url.searchParams.set('minPrice', filters.minPrice.toString());
        changed = true;
      }
    }
    
    // Check and update maxPrice
    if (filters.maxPrice !== undefined) {
      const currentMaxPrice = url.searchParams.get('maxPrice');
      if (currentMaxPrice !== filters.maxPrice.toString()) {
        url.searchParams.set('maxPrice', filters.maxPrice.toString());
        changed = true;
      }
    }
    
    // Check and update inStock
    if (filters.inStockOnly) {
      const currentInStock = url.searchParams.get('inStock');
      if (currentInStock !== 'true') {
        url.searchParams.set('inStock', 'true');
        changed = true;
      }
    } else if (url.searchParams.has('inStock')) {
      url.searchParams.delete('inStock');
      changed = true;
    }
    
    // Check and update categories
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const categoriesStr = filters.categoryIds.join(',');
      const currentCategories = url.searchParams.get('categories');
      if (currentCategories !== categoriesStr) {
        url.searchParams.set('categories', categoriesStr);
        changed = true;
      }
    } else if (url.searchParams.has('categories')) {
      url.searchParams.delete('categories');
      changed = true;
    }
    
    // Check and update brands
    if (filters.brandIds && filters.brandIds.length > 0) {
      const brandsStr = filters.brandIds.join(',');
      const currentBrands = url.searchParams.get('brands');
      if (currentBrands !== brandsStr) {
        url.searchParams.set('brands', brandsStr);
        changed = true;
      }
    } else if (url.searchParams.has('brands')) {
      url.searchParams.delete('brands');
      changed = true;
    }
    
    // Check and update sort
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      const currentSort = url.searchParams.get('sort');
      if (currentSort !== filters.sortBy) {
        url.searchParams.set('sort', filters.sortBy);
        changed = true;
      }
    } else if (url.searchParams.has('sort')) {
      url.searchParams.delete('sort');
      changed = true;
    }
    
    // Update URL if changes were made
    if (changed) {
      console.log("URL updated to match filter state:", url.toString());
      window.history.pushState({}, "", url.toString());
      return true;
    }
    
    return false;
  } catch (err) {
    console.error("Error fixing URL with filters:", err);
    return false;
  }
}

// Track when filter parameters are removed unexpectedly
export function monitorFilterState(filters: FilterOptions): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Save current state for comparison
    const currentState = JSON.stringify(filters);
    const previousState = localStorage.getItem('filter_state_snapshot');
    
    if (previousState && previousState !== currentState) {
      // Filter state changed, check if parameters were lost
      const prevFilters = JSON.parse(previousState) as FilterOptions;
      const keysLost: string[] = [];
      
      // Check which parameters were lost
      if (prevFilters.minPrice !== undefined && filters.minPrice === undefined) {
        keysLost.push('minPrice');
      }
      
      if (prevFilters.maxPrice !== undefined && filters.maxPrice === undefined) {
        keysLost.push('maxPrice');
      }
      
      if (prevFilters.inStockOnly && !filters.inStockOnly) {
        keysLost.push('inStockOnly');
      }
      
      if (prevFilters.categoryIds?.length && (!filters.categoryIds || filters.categoryIds.length === 0)) {
        keysLost.push('categoryIds');
      }
      
      if (prevFilters.brandIds?.length && (!filters.brandIds || filters.brandIds.length === 0)) {
        keysLost.push('brandIds');
      }
      
      if (keysLost.length > 0) {
        console.warn("Filter parameters were lost:", keysLost);
        console.log("Previous filters:", prevFilters);
        console.log("Current filters:", filters);
        
        // Try to restore lost parameters
        const restoredFilters = { ...filters };
        
        keysLost.forEach(key => {
          // @ts-ignore - Dynamic property access
          restoredFilters[key] = prevFilters[key];
        });
        
        // Return the restored filters through localStorage
        localStorage.setItem('restored_filters', JSON.stringify(restoredFilters));
        console.log("Restored filters available in localStorage under 'restored_filters'");
      }
    }
    
    // Save current state for next comparison
    localStorage.setItem('filter_state_snapshot', currentState);
  } catch (err) {
    console.error("Error monitoring filter state:", err);
  }
} 