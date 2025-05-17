"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, FilterX } from "lucide-react";
import { FilterPanel } from "@/components/search/filter-panel";

interface Product {
  id: string | number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: boolean;
  brand_id: number;
  category_id?: number;
  brands: { id: number, name: string } | null;
  variant_count: number;
  product_variants: {
    id: string | number;
    variant_name: string;
    price_adjustment: number;
    image_url: string | null;
  }[];
}

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductsGridProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  perPage: number;
  currentCategoryId?: number;
  selectedCategories?: number[];
  currentBrandId?: number;
  selectedBrands?: number[];
  currentSortBy?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentInStockOnly?: boolean;
}

export default function ProductsGrid({
  products,
  categories,
  brands,
  currentPage,
  totalPages,
  totalProducts,
  perPage,
  currentCategoryId,
  selectedCategories: propSelectedCategories,
  currentBrandId,
  selectedBrands: propSelectedBrands,
  currentSortBy = "newest",
  currentMinPrice,
  currentMaxPrice,
  currentInStockOnly = false,
}: ProductsGridProps) {  
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  
  console.log("ProductsGrid props:", {
    currentCategoryId,
    propSelectedCategories,
    currentBrandId,
    propSelectedBrands,
    pathname
  });
  
  // Initialize state based on props with proper fallbacks
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    propSelectedCategories || (currentCategoryId ? [currentCategoryId] : [])
  );  const [selectedBrands, setSelectedBrands] = useState<number[]>(
    propSelectedBrands || (currentBrandId ? [currentBrandId] : [])
  );
  
  const [minPrice, setMinPrice] = useState<string>(
    currentMinPrice?.toString() || ""
  );
  
  const [maxPrice, setMaxPrice] = useState<string>(
    currentMaxPrice?.toString() || ""
  );
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [inStockOnly, setInStockOnly] = useState<boolean>(currentInStockOnly || false);
  
  // Create a dedicated function for handling filter changes
  const handleFiltersChange = (newFilters: any) => {
    console.log("Filter change received:", newFilters);
    const filters = newFilters as {
      categoryIds?: number[];
      brandIds?: number[];
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
    };

    console.log("Processing filter changes:", filters);

    // Update all state values directly and synchronously
    if (filters.categoryIds !== undefined) {
      setSelectedCategories(filters.categoryIds || []);
      console.log("Updated categories to:", filters.categoryIds);
    }
    
    if (filters.brandIds !== undefined) {
      setSelectedBrands(filters.brandIds || []);
      console.log("Updated brands to:", filters.brandIds);
    }
    
    if (filters.minPrice !== undefined) {
      const minPriceStr = filters.minPrice.toString();
      setMinPrice(minPriceStr);
      console.log("Updated minPrice to:", minPriceStr);
    }
      if (filters.maxPrice !== undefined) {
      const maxPriceStr = filters.maxPrice.toString();
      setMaxPrice(maxPriceStr);
      console.log("Updated maxPrice to:", maxPriceStr);
    }
    
    if (filters.inStockOnly !== undefined) {
      setInStockOnly(filters.inStockOnly);
      console.log("Updated inStockOnly to:", filters.inStockOnly);
    }
  };

  // Apply filters
  const applyFilters = () => {
    console.log("ApplyFilters called with:", {
      categories: selectedCategories,
      brands: selectedBrands,
      minPrice,
      maxPrice,
      sortBy,
      inStockOnly,
      pathname
    });
      try {
      // Save current scroll position
      const scrollPos = window.scrollY;
      
      // Use React useTransition to prevent immediate UI updates
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Update only changed parameters
        if (selectedCategories.length === 0) {
          params.delete("category");
          params.delete("categories");
          console.log("Removing category params");
        } else if (selectedCategories.length === 1) {
          // Use 'category' for products page and 'categories' for category detail page
          // This handles both contexts properly
          const isOnCategoryDetailPage = pathname.includes('/categories/');
          
          if (isOnCategoryDetailPage) {
            params.set("categories", selectedCategories.join(","));
            console.log("Setting categories param:", selectedCategories.join(","));
          } else {
            params.set("category", selectedCategories[0].toString());
            console.log("Setting category param:", selectedCategories[0]);
          }
        } else if (selectedCategories.length > 1) {          // For multiple categories, always use the plural form
          params.set("categories", selectedCategories.join(","));
          console.log("Setting multiple categories:", selectedCategories.join(","));
        }
        
        if (selectedBrands.length === 0) {
          params.delete("brand");
          console.log("Removing brand param - no brands selected");
        } else if (selectedBrands.length === 1) {
          params.set("brand", selectedBrands[0].toString());
          console.log("Setting brand param:", selectedBrands[0]);
        } else if (selectedBrands.length > 1) {
          // For multiple brands, use comma-separated list
          params.set("brand", selectedBrands.join(","));
          console.log("Setting multiple brands:", selectedBrands.join(","));
        }

        // Process price filters - ensure we use valid numbers
        if (minPrice && !isNaN(parseFloat(minPrice))) {
          params.set("minPrice", minPrice);
          console.log("Setting minPrice param:", minPrice);
        } else {
          params.delete("minPrice");
          console.log("Removing minPrice param");
        }

        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
          params.set("maxPrice", maxPrice);
          console.log("Setting maxPrice param:", maxPrice);
        } else {
          params.delete("maxPrice");
          console.log("Removing maxPrice param");
        }

        if (sortBy !== "newest") {
          params.set("sort", sortBy);
          console.log("Setting sort param:", sortBy);
        } else {
          params.delete("sort");
          console.log("Removing sort param (using default newest)");
        }
        
        // Handle inStockOnly filter
        if (inStockOnly) {
          params.set("inStock", "true");
          console.log("Setting inStock param: true");
        } else {
          params.delete("inStock");
          console.log("Removing inStock param");
        }
        
        // Reset to page 1 when filters change
        params.delete("page");

        // Navigate to new URL with filters
        const queryString = params.toString();
        const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
        console.log("Navigating to:", newUrl);
        
        // Use shallow routing to prevent full page refresh
        router.push(newUrl, { scroll: false });
        
        // Restore scroll position after navigation
        setTimeout(() => {
          window.scrollTo(0, scrollPos);
        }, 0);
      });
    } catch (error) {      console.error("Error applying filters:", error);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    console.log("Resetting all filters");
    
    // Save current scroll position
    const scrollPos = window.scrollY;
    
    // Reset all filter state variables using React Transition
    startTransition(() => {
      setSelectedCategories([]);
      setSelectedBrands([]);
      setMinPrice("");
      setMaxPrice("");
      setSortBy("newest");
      setInStockOnly(false);
      
      // Navigate to the base URL without any query parameters while preserving scroll position
      router.push(pathname, { scroll: false });
      
      // Restore scroll position after navigation
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 0);
    });
  };
  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) => {
      return prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId];
    });
  };

  // Handle brand toggle
  const toggleBrand = (brandId: number) => {
    setSelectedBrands((prev) => {      return prev.includes(brandId) 
        ? prev.filter(id => id !== brandId) 
        : [...prev, brandId];
    });
  };
  
  // Handle pagination
  const goToPage = (page: number) => {
    // Save current scroll position
    const scrollPos = window.scrollY;
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      
      // After navigation, scroll to the top for pagination (this is actually expected behavior)      window.scrollTo(0, 0);
    });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    // Only update if value actually changed
    if (value === sortBy) return;
    
    // Save current scroll position
    const scrollPos = window.scrollY;

    startTransition(() => {
      setSortBy(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === "newest") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      // Reset to page 1 when sort changes
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 0);
    });
  };
  // JSX rendering
  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <h1 className='text-2xl md:text-3xl font-bold mb-6'>Products</h1>

      {/* Mobile Filters Toggle */}
      <div className='md:hidden mb-4'>
        {" "}
        <Button
          variant='outline'
          className='w-full'
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className='w-4 h-4 mr-2' />
          {showFilters ? t("products.search.hideFilters") : t("products.search.showFilters")}
        </Button>
      </div>

      <div className='flex flex-col md:flex-row gap-6'>
        {/* Filters - Desktop always visible, mobile collapsible */}
        <div
          className={`${
            showFilters ? "block" : "hidden"
          } md:block w-full md:w-64 flex-shrink-0`}
        >
          <div className='bg-white p-4 rounded-lg border shadow-sm'>            
            <FilterPanel
              filters={{
                categoryIds: selectedCategories,
                brandIds: selectedBrands,
                
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                inStockOnly: inStockOnly,
                sortBy: sortBy as any,
              }}
              setFilters={handleFiltersChange}              priceRange={{
                min: 0,
                max: 2000, // Reduced from 10000 to a more reasonable range for most products
              }}
              brands={brands}
              categories={categories}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>
        </div>

        {/* Products grid */}
        <div className='flex-1'>
          {/* Results count and sort */}          <div className='flex flex-col sm:flex-row justify-between items-center mb-6'>
            {" "}
            <p className='text-gray-600 mb-2 sm:mb-0'>
              {t("products.pagination.showing")} {products.length} {t("products.pagination.of")}{" "}
              {totalProducts} {t("products.pagination.products")}
              {isPending && (
                <span className="ml-2 text-sm text-blue-600 animate-pulse">
                  Updating...
                </span>
              )}
            </p>
            <div className='flex items-center space-x-2'>              <span className='text-gray-600 text-sm'>{t("products.sort.title")}:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder={t("products.sort.title")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='newest'>{t("products.sort.newest")}</SelectItem>
                  <SelectItem value='oldest'>{t("products.sort.oldest")}</SelectItem>
                  <SelectItem value='price-asc'>
                    {t("products.sort.priceAsc")}
                  </SelectItem>
                  <SelectItem value='price-desc'>
                    {t("products.sort.priceDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>{" "}
          {/* Products */}
          {products.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {products.map((product) => {                // Debug logging to see the variant details
                console.log(
                  `Product ${product.id} - ${product.name} - variant_count:`,
                  product.variant_count,
                  "product_variants:",
                  product.product_variants,
                  "brand:",
                  product.brands
                );

                // Determine if product has variants
                const hasVariants = product.variant_count > 0;
                
                // Try to get brand name from the product - ensure proper null checks
                const brandName = product.brands && typeof product.brands === 'object' ? product.brands.name : undefined;

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.base_price}
                    imageUrl={product.image_url || "/placeholder.svg"}
                    inStock={product.in_stock}
                    hasVariants={hasVariants}
                    brandName={brandName}
                  />
                );
              })}
            </div>
          ) : (
            <div className='text-center py-16 bg-gray-50 rounded-lg'>
              <p className='text-xl font-medium mb-2'>
                {t("products.search.noResults")}
              </p>{" "}
              <p className='text-gray-500 mb-6'>
                {t("products.search.tryAnotherSearch")}
              </p>
              <Button variant='outline' onClick={resetFilters}>
                {t("products.search.clearAll")}
              </Button>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center mt-8'>
              <div className='flex space-x-1'>
                {" "}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t("products.pagination.previous")}
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Only show 5 pages: first, last, and 3 around current
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!shouldShow) {
                      // Add ellipsis but avoid duplicates
                      if (
                        (page === 2 && currentPage > 3) ||
                        (page === totalPages - 1 &&
                          currentPage < totalPages - 2)
                      ) {
                        return (
                          <span key={page} className='px-3 py-1'>
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size='sm'
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                )}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t("products.pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
