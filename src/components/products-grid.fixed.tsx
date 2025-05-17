"use client";

import React, { useState, useEffect } from "react";
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
import { FilterPanel } from "@/components/search/filter-panel.fixed";

interface Product {
  id: string | number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: boolean;
  brand_id: number;
  brands: { id: number, name: string }[] | null;
  variant_count: number;
  product_variants: {
    id: string | number;
    name?: string;
    adjustment_price?: number;
    image_url?: string | null;
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
  currentBrandId?: number;
  currentSortBy?: string;
  currentMinPrice?: number;
  currentMaxPrice?: number;
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
  currentBrandId,
  currentSortBy = "newest",
  currentMinPrice,
  currentMaxPrice,
}: ProductsGridProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    currentCategoryId ? [currentCategoryId] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<number[]>(
    currentBrandId ? [currentBrandId] : []
  );
  const [minPrice, setMinPrice] = useState<string>(
    currentMinPrice?.toString() || ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    currentMaxPrice?.toString() || ""
  );
  const [sortBy, setSortBy] = useState(currentSortBy);

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

    if (filters.categoryIds !== undefined) {
      setSelectedCategories(filters.categoryIds);
    }
    if (filters.brandIds !== undefined) {
      setSelectedBrands(filters.brandIds);
      console.log("Setting selectedBrands to:", filters.brandIds);
    }
    if (filters.minPrice !== undefined) {
      setMinPrice(filters.minPrice.toString());
    }
    if (filters.maxPrice !== undefined) {
      setMaxPrice(filters.maxPrice.toString());
    }
    // No need for a useEffect dependency here since onApply is directly called in the filter panel
  };

  // Apply filters
  const applyFilters = () => {
    console.log("ApplyFilters called with:", {
      categories: selectedCategories,
      brands: selectedBrands,
      minPrice,
      maxPrice,
      sortBy
    });
    
    const params = new URLSearchParams(searchParams.toString());

    // Update only changed parameters
    if (selectedCategories.length === 1) {
      params.set("category", selectedCategories[0].toString());
    } else {
      params.delete("category");
    }

    if (selectedBrands.length === 1) {
      params.set("brand", selectedBrands[0].toString());
      console.log("Applying brand filter:", selectedBrands[0]);
    } else {
      params.delete("brand");
    }

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (sortBy !== "newest") {
      params.set("sort", sortBy);
    } else {
      params.delete("sort");
    }

    // Reset to page 1 when filters change
    params.delete("page");

    // Navigate to new URL with filters
    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    console.log("Navigating to:", newUrl);
    router.push(newUrl);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    router.push(pathname);
  };

  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId) ? [] : [categoryId];
      return newCategories;
    });
  };

  // Handle brand toggle
  const toggleBrand = (brandId: number) => {
    setSelectedBrands((prev) => {
      const newBrands = prev.includes(brandId) ? [] : [brandId];
      return newBrands;
    });
  };

  // Handle pagination
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    // Only update if value actually changed
    if (value === sortBy) return;

    setSortBy(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    // Reset to page 1 when sort changes
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

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
                sortBy: sortBy as any,
              }}
              setFilters={handleFiltersChange}
              priceRange={{
                min: 0,
                max: 10000,
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
          {/* Results count and sort */}
          <div className='flex flex-col sm:flex-row justify-between items-center mb-6'>
            {" "}
            <p className='text-gray-600 mb-2 sm:mb-0'>
              {t("products.pagination.showing")} {products.length} {t("products.pagination.of")}{" "}
              {totalProducts} {t("products.pagination.products")}
            </p>
            <div className='flex items-center space-x-2'>
              <span className='text-gray-600 text-sm'>{t("products.sort.title")}:</span>
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
              {products.map((product) => {
                // Debug logging to see the variant details
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
                // Try to get brand name from the product
                const brandName = product.brands && product.brands.length > 0 
                  ? product.brands[0].name 
                  : undefined;

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
