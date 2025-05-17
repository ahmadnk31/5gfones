"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";
import ProductCard from "@/components/product-card";
import { AdvancedFilterPanel } from "@/components";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Product, searchProducts } from "@/lib/search/search-utils";
import {
  FilterOptions,
  SortOption,
  fetchBrands,
  fetchCategories,
  fetchPriceRange,
  FilterHelpers,
  syncFiltersWithUrl,
  getFiltersFromUrl,
  updateRouterWithFilters
} from "@/lib/search/filter-utils";
import { saveFilterState, getFilterState, fixUrlWithFilters, monitorFilterState } from "@/lib/search/filter-state-debug";
import { SortMenu } from "@/components/search/sort-menu";

export default function SearchPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "relevance",
  });
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000,
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [useRouterNavigation, setUseRouterNavigation] = useState(false);
  const productsPerPage = 16;
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchText: string) => {
      const url = new URL(window.location.href);
      if (searchText.trim()) {
        url.searchParams.set("q", searchText.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
      handleSearch(null, searchText, 1);
    }, 300),
    []
  );

  const handleSearch = useCallback(
    async (
      e: React.FormEvent | null,
      searchText?: string,
      page: number = 1
    ) => {      if (e) e.preventDefault();

      const textToSearch = searchText || searchQuery;
      if (!textToSearch.trim()) {
        setProducts([]);
        setTotalResults(0);
        setTotalPages(1);
        return;
      }

      // Save current filter state before search, but don't trigger more state updates
      if (typeof window !== 'undefined') {
        saveFilterState(filters);
      }

      setIsLoading(true);
      try {
        // Use the utility function for searching with filters
        const result = await searchProducts(
          textToSearch,
          page,
          productsPerPage,
          filters
        );

        setProducts(result.products);
        setTotalResults(result.count);
        setTotalPages(Math.ceil(result.count / productsPerPage));
        setCurrentPage(page);
      } catch (err) {
        console.error("Unexpected search error:", err);
        setProducts([]);
        setTotalResults(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, productsPerPage, filters]
  );
  // Parse URL parameters for filters - use our new utility
  const parseUrlFilters = useCallback(() => {
    return getFiltersFromUrl();
  }, []);

  // Load filter data (brands, categories, price range)
  useEffect(() => {
    async function loadFilterData() {
      setIsLoadingFilters(true);
      try {
        // Load price range
        const priceRangeData = await fetchPriceRange();
        setPriceRange(priceRangeData);

        // Load brands
        const brandsData = await fetchBrands();
        setBrands(brandsData);

        // Load categories
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);

        // Parse URL parameters for filters
        const urlFilters = parseUrlFilters();
        if (Object.keys(urlFilters).length > 1) {
          // More than just sortBy
          setFilters(urlFilters);
        }
      } catch (error) {
        console.error("Error loading filter data:", error);
      } finally {
        setIsLoadingFilters(false);
      }
    }

    loadFilterData();
  }, [parseUrlFilters]);

  // Handle initial search from URL params
  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      handleSearch(null, query, 1);
    }
  }, [query, handleSearch]);
  // Update URL params with current search and filters - use our new utility
  const updateUrlParams = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('updateUrlParams called in non-browser environment');
      return;
    }
    
    console.log('updateUrlParams: Starting URL update process');
    
    try {
      const url = new URL(window.location.href);
      console.log('updateUrlParams: Current URL:', url.toString());

      // Set search query
      if (searchQuery.trim()) {
        url.searchParams.set("q", searchQuery.trim());
        console.log(`updateUrlParams: Setting q=${searchQuery.trim()}`);
      } else {
        url.searchParams.delete("q");
        console.log('updateUrlParams: Removing q param');
      }

      // Set page number if not on first page
      if (currentPage > 1) {
        url.searchParams.set("page", currentPage.toString());
        console.log(`updateUrlParams: Setting page=${currentPage}`);
      } else {
        url.searchParams.delete("page");
        console.log('updateUrlParams: Removing page param');
      }

      // Use our utility for filter params - this will handle all the filter synchronization
      console.log('updateUrlParams: Calling syncFiltersWithUrl with filters:', filters);
      syncFiltersWithUrl(filters);

      // Update URL directly for search query and page
      console.log('updateUrlParams: Updating URL to:', url.toString());
      window.history.pushState({}, "", url.toString());
      console.log('updateUrlParams: URL update successful');
    } catch (error) {
      console.error('updateUrlParams: Error updating URL params:', error);
    }
  }, [searchQuery, currentPage, filters]);
  // Function to apply filters and update URL
  const applyFilters = useCallback(() => {
    console.log("applyFilters called with filters:", JSON.stringify(filters));
    
    if (typeof window === 'undefined') {
      console.warn('applyFilters called in non-browser environment');
      return;
    }
    
    try {
      // Store filter state to local storage to ensure persistence
      localStorage.setItem('searchFilters', JSON.stringify(filters));
      
      // Update URL directly with filter state
      console.log('applyFilters: Manually updating URL with filters');
      const url = new URL(window.location.href);
      
      // Set search query
      if (searchQuery.trim()) {
        url.searchParams.set("q", searchQuery.trim());
      } else {
        url.searchParams.delete("q");
      }
      
      // Set filter parameters
      if (filters.minPrice !== undefined) {
        url.searchParams.set("minPrice", filters.minPrice.toString());
      } else {
        url.searchParams.delete("minPrice");
      }
      
      if (filters.maxPrice !== undefined) {
        url.searchParams.set("maxPrice", filters.maxPrice.toString());
      } else {
        url.searchParams.delete("maxPrice");
      }
      
      if (filters.inStockOnly) {
        url.searchParams.set("inStock", "true");
      } else {
        url.searchParams.delete("inStock");
      }
      
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        url.searchParams.set("categories", filters.categoryIds.join(","));
      } else {
        url.searchParams.delete("categories");
      }
      
      if (filters.brandIds && filters.brandIds.length > 0) {
        url.searchParams.set("brands", filters.brandIds.join(","));
      } else {
        url.searchParams.delete("brands");
      }
      
      if (filters.sortBy && filters.sortBy !== "relevance") {
        url.searchParams.set("sort", filters.sortBy);
      } else {
        url.searchParams.delete("sort");
      }
      
      // Reset to page 1 when filters change
      url.searchParams.delete("page");
      
      // Update URL with combined params - using replaceState to avoid adding to history
      console.log('applyFilters: Updating URL to:', url.toString());
      window.history.replaceState({}, "", url.toString());
      
      // Perform the search with current filters
      handleSearch(null, searchQuery, 1);
    } catch (error) {
      console.error('applyFilters: Error updating URL or performing search:', error);
    }
  }, [handleSearch, searchQuery, filters]);

  // Reset all filters to default values
  const resetFilters = useCallback(() => {
    console.log("resetFilters called");
    
    // Reset to default filters with proper type
    const defaultFilters: FilterOptions = { sortBy: "relevance" };
    setFilters(defaultFilters);
    
    // Directly update URL to remove filter parameters
    try {
      const url = new URL(window.location.href);
      
      // Keep only the search query (q) parameter
      const searchQuery = url.searchParams.get("q");
      
      // Instead of using clear(), we'll manually remove each filter parameter
      url.searchParams.delete("minPrice");
      url.searchParams.delete("maxPrice");
      url.searchParams.delete("inStock");
      url.searchParams.delete("categories");
      url.searchParams.delete("brands");
      url.searchParams.delete("sort");
      url.searchParams.delete("page");
      
      // Make sure we still have the search query if it existed
      if (searchQuery) {
        url.searchParams.set("q", searchQuery);
      }
      
      window.history.pushState({}, "", url.toString());
      console.log("URL reset successful");
    } catch (err) {
      console.error("Error resetting URL parameters:", err);
    }
    
    // After state update, perform search
    setTimeout(() => {
      handleSearch(null, searchQuery, 1);
    }, 50);
  }, [handleSearch, searchQuery]);
  // Add useEffect to automatically update URL params when filters change
  useEffect(() => {
    // Skip empty filter sets or initial render
    if (Object.keys(filters).length === 0) return;
    
    console.log("Filters changed:", filters);
    
    // Store filters in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('searchFilters', JSON.stringify(filters));
        console.log("Saved filters to localStorage");
      } catch (err) {
        console.error("Error saving filters to localStorage:", err);
      }
    }
    
    // Don't update URL here to prevent loop - URL updates will be handled 
    // explicitly by user actions (applyFilters, handleSearch, etc.)
    
    // Cleanup function
    return () => {
      console.log("Filter effect cleanup");
    };
  }, [filters]); // Removed updateUrlParams from deps
  // Ensure first load fetches results and URL is synchronized
  useEffect(() => {
    // Only run this effect once on initial load for a specific query
    if (query && !isLoading && products.length === 0) {
      console.log("Initial search for query:", query);
      
      // First try to get filters from URL
      const urlFilters = getFiltersFromUrl();
      
      // Then check if we have stored filters in localStorage
      let filtersToUse = urlFilters;
      
      if (typeof window !== 'undefined') {
        try {
          const storedFilters = localStorage.getItem('searchFilters');
          if (storedFilters) {
            const parsedFilters = JSON.parse(storedFilters);
            console.log("Found stored filters:", parsedFilters);
            
            // Only use stored filters if they're more specific than URL filters
            if (Object.keys(parsedFilters).length > Object.keys(urlFilters).length) {
              filtersToUse = parsedFilters;
              console.log("Using stored filters instead of URL filters");
              
              // Skip URL restoration to prevent loops
              // We'll rely on the query and filters only
            }
          }
        } catch (err) {
          console.error("Error reading stored filters:", err);
        }
      }
      
      // Set filters in the component state - but make sure we don't create a loop
      const currentFilterKeys = Object.keys(filters);
      const newFilterKeys = Object.keys(filtersToUse);
      
      // Only update filters if they're actually different - to prevent loops
      if (newFilterKeys.length > 1 && 
          (currentFilterKeys.length !== newFilterKeys.length || 
           JSON.stringify(filters) !== JSON.stringify(filtersToUse))) {
        setFilters(filtersToUse);
        // Don't call handleSearch here - it will be triggered by the filter change
      } else {
        // If we don't update filters, we should still do the initial search
        handleSearch(null, query, 1);
      }
    }
  }, [query, isLoading, products.length]); // Removed handleSearch dependency
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Update URL directly with the search query parameter
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("q", searchQuery.trim());
        
        // Reset page to 1 for new searches
        url.searchParams.delete("page");
        
        // Use replaceState to avoid adding to history stack
        window.history.replaceState({}, "", url.toString());
      } catch (err) {
        console.error("Error updating search URL:", err);
      }
      
      // Perform the search
      handleSearch(null, searchQuery, 1);
    }
  };  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);

      // Update URL params with the page number
      try {
        const url = new URL(window.location.href);
        if (page > 1) {
          url.searchParams.set("page", page.toString());
        } else {
          url.searchParams.delete("page");
        }
        // Use replaceState to avoid adding to browser history
        window.history.replaceState({}, "", url.toString());
      } catch (err) {
        console.error("Error updating page URL:", err);
      }

      // Perform the search for the new page
      handleSearch(null, searchQuery, page);
      
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-bold mb-2'>
            {t("search.results")} {query && `"${query}"`}
          </h1>{" "}
          <p className='text-gray-600'>
            {isLoading
              ? t("common.loading")
              : totalResults === 0
              ? t("search.noResults")
              : totalResults === 1
              ? t("search.oneResult")
              : t("search.resultCount", { count: totalResults })}
          </p>
          {/* Active Filter Badges */}
          {!isLoading && Object.keys(filters).length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {filters.minPrice !== undefined &&
                filters.maxPrice !== undefined && (
                  <Badge variant='outline' className='flex items-center gap-1'>
                    {t("product.price")}: ${filters.minPrice}-$
                    {filters.maxPrice}
                    <X
                      className='h-3 w-3 ml-1 cursor-pointer'
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          minPrice: undefined,
                          maxPrice: undefined,
                        }));
                        handleSearch(null, searchQuery, 1);
                      }}
                    />
                  </Badge>
                )}
              {filters.inStockOnly && (
                <Badge variant='outline' className='flex items-center gap-1'>
                  {t("filters.inStock")}
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, inStockOnly: false }));
                      handleSearch(null, searchQuery, 1);
                    }}
                  />
                </Badge>
              )}
              {filters.categoryIds && filters.categoryIds.length > 0 && (
                <Badge variant='outline' className='flex items-center gap-1'>
                  {t("navigation.categories")}: {filters.categoryIds.length}
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, categoryIds: [] }));
                      handleSearch(null, searchQuery, 1);
                    }}
                  />
                </Badge>
              )}{" "}
              {filters.brandIds && filters.brandIds.length > 0 && (
                <Badge variant='outline' className='flex items-center gap-1'>
                  {t("navigation.brands")}: {filters.brandIds.length}
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, brandIds: [] }));
                      handleSearch(null, searchQuery, 1);
                    }}
                  />
                </Badge>
              )}
              {filters.sortBy && filters.sortBy !== "relevance" && (
                <Badge variant='outline' className='flex items-center gap-1'>
                  {t("sort.title")}: {t(`sort.${filters.sortBy}`)}
                  <X
                    className='h-3 w-3 ml-1 cursor-pointer'
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, sortBy: "relevance" }));
                      handleSearch(null, searchQuery, 1);
                    }}
                  />
                </Badge>
              )}
              <Badge
                variant='outline'
                className='flex items-center gap-1 cursor-pointer'
                onClick={() => {
                  setFilters({ sortBy: "relevance" });
                  handleSearch(null, searchQuery, 1);
                }}
              >
                {t("filters.reset")}
                <X className='h-3 w-3 ml-1' />
              </Badge>
            </div>
          )}
        </div>{" "}        <form
          onSubmit={handleSearchSubmit}
          className='w-full md:w-1/2 lg:w-1/3 flex'
        >
          <div className="relative flex-grow">
            <input
              type='text'
              value={searchQuery}              onChange={(e) => {
                const newValue = e.target.value;
                setSearchQuery(newValue);
                
                // If search query is empty, clear results immediately
                if (!newValue.trim()) {
                  setProducts([]);
                  setTotalResults(0);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("q");
                  window.history.replaceState({}, "", url.toString());
                }
                
                // Trigger debounced search for any input
                debouncedSearch(newValue);
              }}
              placeholder={t("search.placeholder")}
              className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mr-2'
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  const url = new URL(window.location.href);
                  url.searchParams.delete("q");
                  window.history.replaceState({}, "", url.toString());
                  setProducts([]);
                  setTotalResults(0);
                  setFilters({ sortBy: "relevance" }); // Reset filters when clearing search
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type='submit' disabled={isLoading} className='flex-shrink-0'>
            <Search className='h-4 w-4 mr-2' />
            {t("search.search")}
          </Button>
        </form>
      </div>

      {/* Mobile filter toggle */}
      <div className='md:hidden mb-4'>
        <Button
          variant='outline'
          className='w-full'
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className='h-4 w-4 mr-2' />
          {showFilters ? t("search.hideFilters") : t("search.showFilters")}
        </Button>
      </div>

      <div className='flex flex-col md:flex-row gap-6'>
        {/* Filters (can be expanded later) */}
        <div
          className={`w-full md:w-64 md:block ${
            showFilters ? "block" : "hidden"
          }`}
        >
          <div className='bg-white p-4 rounded-lg border shadow-sm mb-4'>
            {isLoadingFilters ? (
              <div className='py-6 flex justify-center'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800'></div>
              </div>
            ) : (
              <AdvancedFilterPanel
                categories={categories}
                brands={brands}
                selectedCategories={filters.categoryIds || []}                selectedBrands={filters.brandIds || []}
                minPrice={filters.minPrice?.toString() || "0"}
                maxPrice={filters.maxPrice?.toString() || priceRange.max.toString()}
                inStockOnly={filters.inStockOnly || false}
                condition={filters.condition}
                hasVariations={filters.hasVariations}
                onConditionChange={(condition) => {
                  setFilters(prev => ({
                    ...prev,
                    condition
                  }));
                }}
                onHasVariationsChange={(hasVariations) => {
                  setFilters(prev => ({
                    ...prev,
                    hasVariations
                  }));
                }}
                onCategoryToggle={(categoryId) => {
                  const currentCategoryIds = filters.categoryIds || [];
                  const newCategoryIds = currentCategoryIds.includes(categoryId)
                    ? currentCategoryIds.filter(id => id !== categoryId)
                    : [...currentCategoryIds, categoryId];
                  
                  setFilters(prev => ({
                    ...prev,
                    categoryIds: newCategoryIds
                  }));
                }}
                onBrandToggle={(brandId) => {
                  const currentBrandIds = filters.brandIds || [];
                  const newBrandIds = currentBrandIds.includes(brandId)
                    ? currentBrandIds.filter(id => id !== brandId)
                    : [...currentBrandIds, brandId];
                  
                  setFilters(prev => ({
                    ...prev,
                    brandIds: newBrandIds
                  }));
                }}
                onMinPriceChange={(value) => {
                  setFilters(prev => ({
                    ...prev,
                    minPrice: value ? parseInt(value) : undefined
                  }));
                }}
                onMaxPriceChange={(value) => {
                  setFilters(prev => ({
                    ...prev,
                    maxPrice: value ? parseInt(value) : undefined
                  }));
                }}
                onInStockChange={(value) => {
                  setFilters(prev => ({
                    ...prev,
                    inStockOnly: value
                  }));
                }}
                onApplyFilters={applyFilters}
                onResetFilters={resetFilters}
              />
            )}
          </div>
        </div>

        {/* Search results */}
        <div className='flex-grow'>
          {isLoading ? (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className='bg-gray-100 rounded-lg p-4 h-64 animate-pulse'
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              {" "}
              {/* Sort options */}
              <div className='mb-4 flex justify-end'>
                {" "}
                <SortMenu
                  selectedSort={filters.sortBy || "relevance"}
                  onSortChange={(sortOption: SortOption) => {
                    if (sortOption !== filters.sortBy) {
                      // Update filters state
                      const newFilters = { ...filters, sortBy: sortOption };
                      setFilters(newFilters);

                      // Update URL with new sort option
                      syncFiltersWithUrl(newFilters);

                      // Perform search with updated sort
                      handleSearch(null, searchQuery, 1);
                    }
                  }}
                />
              </div>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.base_price}
                    imageUrl={product.image_url || "/placeholder.svg"}
                    inStock={product.in_stock > 0}
                    hasVariants={product.variant_count > 0}
                    brandName={product.brands?.name}
                  />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className='mt-8'>
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious
                            href='#'
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                          />
                        </PaginationItem>
                      )}

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          // Create a sliding window of pages around the current page
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href='#'
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(pageNum);
                                }}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext
                            href='#'
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            !isLoading && (
              <div className='text-center py-16'>
                <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                  <Search className='h-10 w-10 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium mb-2'>
                  {t("search.noResults")}
                </h3>
                <p className='text-gray-500 mb-4 max-w-md mx-auto'>
                  {t("search.tryAnotherSearch")}
                </p>
                <Button variant='outline' onClick={() => setSearchQuery("")}>
                  {t("search.clearSearch")}
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
