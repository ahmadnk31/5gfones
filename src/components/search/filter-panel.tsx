// Filter components for search page
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FilterOptions, Brand, Category } from "@/lib/search/filter-utils";
import { debounce } from "lodash";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

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
  // Initialize with filters or default price range and ensure values are updated when filters prop changes
  const [localPriceRange, setLocalPriceRange] = useState<number[]>([
    filters.minPrice !== undefined ? filters.minPrice : priceRange.min,
    filters.maxPrice !== undefined ? filters.maxPrice : priceRange.max,
  ]);
  // Debounce filter application to prevent too many updates
  const debouncedApply = useCallback(
    debounce(() => {
      onApply();
    }, 150), // Reduced debounce time for more responsive UI
    [onApply]
  );
  // Update localPriceRange when filters prop changes
  useEffect(() => {
    const minPrice = filters.minPrice !== undefined ? filters.minPrice : priceRange.min;
    const maxPrice = filters.maxPrice !== undefined ? filters.maxPrice : priceRange.max;

    // Only update if values are different to prevent infinite loops
    if (localPriceRange[0] !== minPrice || localPriceRange[1] !== maxPrice) {
      console.log("Filter props changed, updating localPriceRange:", [minPrice, maxPrice]);
      setLocalPriceRange([minPrice, maxPrice]);
    }
  }, [filters.minPrice, filters.maxPrice, priceRange.min, priceRange.max]);  // Update slider when input values change
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    console.log("Min price changed to:", value);
    console.log("Current localPriceRange:",e.target.value);
    // Only update if it's a valid number
    if (!isNaN(value)) {
      // Round to the nearest step of 10
      const roundedValue = Math.round(value / 10) * 10;
      
      // Make sure min doesn't exceed max
      const validValue = Math.min(roundedValue, localPriceRange[1]);
      
      // Update local state
      setLocalPriceRange([validValue, localPriceRange[1]]);
      
      // Update filter state
      setFilters({
        ...filters,
        minPrice: validValue
      });
      
      // Apply changes with a slight delay for better typing experience
      debounce(() => onApply(), 400)();
    }
  };
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    console.log("Max price changed to:", value);
    
    // Only update if it's a valid number
    if (!isNaN(value)) {
      // Round to the nearest step of 10
      const roundedValue = Math.round(value / 10) * 10;
      
      // Make sure max isn't less than min
      const validValue = Math.max(roundedValue, localPriceRange[0]);
      
      // Update local state
      setLocalPriceRange([localPriceRange[0], validValue]);
      
      // Update filter state
      setFilters({
        ...filters,
        maxPrice: validValue
      });
      
      // Apply changes with a slight delay for better typing experience
      debounce(() => onApply(), 400)();
    }
  };  // Handle slider value changes
  const handlePriceRangeChange = (values: number[]) => {
    console.log("Price range slider changed to:", values);

    // Ensure values are rounded to multiples of the step (10)
    const roundedValues = values.map(value => Math.round(value / 10) * 10);
    console.log("Rounded values:", roundedValues);

    // Update the local state with rounded values
    setLocalPriceRange(roundedValues);

    // Update the filter state immediately
    setFilters({
      ...filters,
      minPrice: roundedValues[0],
      maxPrice: roundedValues[1],
    });

    // Apply the filter changes to update URL
    // Use a very short delay to prevent too many URL updates during active sliding
    debounce(() => onApply(), 50)();
  };

  // Apply price range filter
  const applyPriceRange = () => {
    console.log("Applying price range:", localPriceRange);

    // Always update filters and apply when user explicitly commits a value
    setFilters({
      ...filters,
      minPrice: localPriceRange[0],
      maxPrice: localPriceRange[1],
    });

    // Apply immediately instead of debouncing when explicitly applying
    onApply();
  };
  // Toggle brand selection
  const toggleBrand = (brandId: number) => {
    console.log("ToggleBrand called with ID:", brandId);

    // Get current brandIds
    const brandIds = filters.brandIds || [];

    // Create new array based on toggle action
    // If the brand is already selected, remove it; otherwise add it
    const newBrandIds = brandIds.includes(brandId)
      ? brandIds.filter((id) => id !== brandId)
      : [...brandIds, brandId];

    console.log("Previous brandIds:", brandIds, "New brandIds:", newBrandIds);

    // Set the new state with all filters preserved
    setFilters({
      ...filters,
      brandIds: newBrandIds,
    });

    // Apply with debounce for better performance
    debouncedApply();
  };
  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    console.log("ToggleCategory called with ID:", categoryId);

    // Get current categoryIds
    const categoryIds = filters.categoryIds || [];

    // Create new array based on toggle action
    // If the category is already selected, remove it; otherwise add it
    const newCategoryIds = categoryIds.includes(categoryId)
      ? categoryIds.filter((id) => id !== categoryId)
      : [...categoryIds, categoryId];

    console.log("Previous categoryIds:", categoryIds, "New categoryIds:", newCategoryIds);

    // Set the new state with all filters preserved
    setFilters({
      ...filters,
      categoryIds: newCategoryIds,
    });

    // Apply with debounce for better performance
    debouncedApply();
  };
  // Toggle in-stock only filter
  const toggleInStock = (checked: boolean) => {
    console.log("Toggle in-stock only:", checked);

    // Update filters with direct state assignment
    setFilters({
      ...filters,
      inStockOnly: checked,
    });

    // Apply with debounce for better performance
    debouncedApply();
  };
  return (
    <div className="space-y-6 min-w-[250px] p-4 bg-white border rounded-lg shadow-sm">
      {/* Price Range Filter */}      <div className="border-t pt-3">
        <h3 className="text-sm font-medium mb-4">{t("filters.priceRange")}</h3>
        <div className="px-2">
          <DualRangeSlider
            value={localPriceRange}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            onValueChange={handlePriceRangeChange}
            className="mb-10" // Extra margin to accommodate labels
            label={(value) => `${value}`} // Display the actual values
            labelPosition="bottom"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="min-price">{t("filters.minPrice")}</Label>              <Input
                id="min-price"
                type="number"
                min={priceRange.min}
                max={localPriceRange[1]}
                value={localPriceRange[0]}
                onChange={handleMinPriceChange}
                onBlur={applyPriceRange}
                className="mt-1"
                step="10"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="max-price">{t("filters.maxPrice")}</Label>              <Input
                id="max-price"
                type="number"
                min={localPriceRange[0]}
                max={priceRange.max}
                value={localPriceRange[1]}
                onChange={handleMaxPriceChange}
                onBlur={applyPriceRange}
                className="mt-1"
                step="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* In Stock Filter */}
      <div className="border-t pt-3">
        <h3 className="text-sm font-medium mb-2">{t("filters.availability")}</h3>
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="in-stock-filter"
            checked={filters.inStockOnly || false}
            onCheckedChange={(checked) => toggleInStock(!!checked)}
          />
          <Label htmlFor="in-stock-filter">{t("filters.inStock")}</Label>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="border-t pt-3">
        <h3 className="text-sm font-medium mb-2">{t("navigation.categories")}</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={(filters.categoryIds || []).includes(category.id)}
                  onCheckedChange={(checked) => {
                    console.log("Category checkbox changed:", category.id, checked);
                    toggleCategory(category.id);
                  }}
                />
                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">{t("categories.empty")}</div>
          )}
        </div>
      </div>

      {/* Brands Filter */}
      <div className="border-t pt-3">
        <h3 className="text-sm font-medium mb-2">{t("navigation.brands")}</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {brands.length > 0 ? (
            brands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={(filters.brandIds || []).includes(brand.id)}
                  onCheckedChange={(checked) => {
                    console.log("Brand checkbox changed:", brand.id, checked);
                    // Direct call to toggle with event stop to prevent bubbling issues
                    toggleBrand(brand.id);
                  }}
                />
                <Label htmlFor={`brand-${brand.id}`}>{brand.name}</Label>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">{t("navigation.brandsEmpty")}</div>
          )}
        </div>
      </div>

      {/* Filter Actions */}
      <div className="border-t pt-4 flex justify-between">
        <Button size="sm" variant="outline" onClick={onReset}>
          {t("filters.reset")}
        </Button>
        <Button size="sm" onClick={onApply}>
          {t("filters.apply")}
        </Button>
      </div>
    </div>
  );
}
