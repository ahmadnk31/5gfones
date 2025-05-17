// Filter components for search page
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FilterOptions, Brand, Category } from "@/lib/search/filter-utils";

interface PriceRange {
  min: number;
  max: number;
}

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  priceRange: PriceRange;
  brands: Brand[];
  categories: Category[];
  onApply: () => void;
  onReset: () => void;
}

export function FilterPanel({
  filters,
  setFilters,
  priceRange,
  brands,
  categories,
  onApply,
  onReset,
}: FilterPanelProps) {
  const t = useTranslations();

  const [localPriceRange, setLocalPriceRange] = useState<number[]>([
    filters.minPrice !== undefined ? filters.minPrice : priceRange.min,
    filters.maxPrice !== undefined ? filters.maxPrice : priceRange.max,
  ]);

  // Update slider when input values change
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalPriceRange([value, localPriceRange[1]]);
    setFilters((prev) => ({
      ...prev,
      minPrice: value,
      maxPrice: localPriceRange[1],
    }));
    // Call onApply directly
    onApply();
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLocalPriceRange([localPriceRange[0], value]);
    setFilters((prev) => ({
      ...prev,
      minPrice: localPriceRange[0],
      maxPrice: value,
    }));
    // Call onApply directly
    onApply();
  };

  // Handle slider value changes
  const handlePriceRangeChange = (values: number[]) => {
    setLocalPriceRange(values);
    setFilters((prev) => ({
      ...prev,
      minPrice: values[0],
      maxPrice: values[1],
    }));
    // Call onApply directly
    onApply();
  };

  // Apply price range filter
  const applyPriceRange = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: localPriceRange[0],
      maxPrice: localPriceRange[1],
    }));
    // Call onApply directly
    onApply();
  };

  // Toggle brand selection
  const toggleBrand = (brandId: number) => {
    console.log("ToggleBrand called with ID:", brandId);
    setFilters((prev) => {
      const brandIds = prev.brandIds || [];
      // If already selected, deselect it; if not selected, select only this one
      const newBrandIds = brandIds.includes(brandId) ? [] : [brandId];
      console.log("Previous brandIds:", brandIds, "New brandIds:", newBrandIds);
      return {
        ...prev,
        brandIds: newBrandIds,
      };
    });
    // Call onApply directly 
    onApply();
  };

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    setFilters((prev) => {
      const categoryIds = prev.categoryIds || [];
      const newCategoryIds = categoryIds.includes(categoryId) ? [] : [categoryId];
      return {
        ...prev,
        categoryIds: newCategoryIds,
      };
    });
    // Call onApply directly
    onApply();
  };

  // Toggle in-stock only filter
  const toggleInStock = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      inStockOnly: checked,
    }));
    // Call onApply directly
    onApply();
  };

  return (
    <div className='space-y-6 min-w-[250px] p-4 bg-white border rounded-lg shadow-md'>
      {/* Price Range Filter */}
      <div className='border-t pt-3'>
        <h3 className='text-sm font-medium mb-4'>{t("filters.priceRange")}</h3>
        <div className='px-2'>
          <Slider
            value={localPriceRange}
            min={priceRange.min}
            max={priceRange.max}
            step={1}
            onValueChange={handlePriceRangeChange}
            onValueCommit={applyPriceRange}
            className='mb-6'
          />
          <div className='flex items-center justify-between gap-4'>
            <div className='flex-1'>
              <Label htmlFor='min-price'>{t("filters.minPrice")}</Label>
              <Input
                id='min-price'
                type='number'
                min={priceRange.min}
                max={localPriceRange[1]}
                value={localPriceRange[0]}
                onChange={handleMinPriceChange}
                onBlur={applyPriceRange}
                className='mt-1'
              />
            </div>
            <div className='flex-1'>
              <Label htmlFor='max-price'>{t("filters.maxPrice")}</Label>
              <Input
                id='max-price'
                type='number'
                min={localPriceRange[0]}
                max={priceRange.max}
                value={localPriceRange[1]}
                onChange={handleMaxPriceChange}
                onBlur={applyPriceRange}
                className='mt-1'
              />
            </div>
          </div>
        </div>
      </div>

      {/* In Stock Filter */}
      <div className='border-t pt-3'>
        <h3 className='text-sm font-medium mb-2'>
          {t("filters.availability")}
        </h3>
        <div className='flex items-center space-x-2 mt-2'>
          <Checkbox
            id='in-stock-filter'
            checked={filters.inStockOnly || false}
            onCheckedChange={(checked) => toggleInStock(!!checked)}
          />
          <Label htmlFor='in-stock-filter'>{t("filters.inStock")}</Label>
        </div>
      </div>

      {/* Categories Filter */}
      <div className='border-t pt-3'>
        <h3 className='text-sm font-medium mb-2'>
          {t("navigation.categories")}
        </h3>
        <div className='space-y-2 max-h-40 overflow-y-auto pr-2'>
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`category-${category.id}`}
                  checked={(filters.categoryIds || []).includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label htmlFor={`category-${category.id}`}>
                  {category.name}
                </Label>
              </div>
            ))
          ) : (
            <div className='text-sm text-gray-500'>{t("categories.empty")}</div>
          )}
        </div>
      </div>

      {/* Brands Filter */}
      <div className='border-t pt-3'>
        <h3 className='text-sm font-medium mb-2'>{t("navigation.brands")}</h3>
        <div className='space-y-2 max-h-40 overflow-y-auto pr-2'>
          {brands.length > 0 ? (
            brands.map((brand) => (
              <div key={brand.id} className='flex items-center space-x-2'>
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={(filters.brandIds || []).includes(brand.id)}
                  onCheckedChange={() => toggleBrand(brand.id)}
                />
                <Label htmlFor={`brand-${brand.id}`}>{brand.name}</Label>
              </div>
            ))
          ) : (
            <div className='text-sm text-gray-500'>{t("brandsEmpty")}</div>
          )}
        </div>
      </div>

      {/* Filter Actions */}
      <div className='border-t pt-4 flex justify-between'>
        <Button size='sm' variant='outline' onClick={onReset}>
          {t("filters.reset")}
        </Button>
        <Button size='sm' onClick={onApply}>
          {t("filters.apply")}
        </Button>
      </div>
    </div>
  );
}
