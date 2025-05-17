# Advanced Filter Panel Guide

This guide explains how to use the new `AdvancedFilterPanel` component which provides enhanced filtering capabilities with proper URL state synchronization and persistence.

## Features

- Accordion-based filter UI with multiple filter sections
- URL state synchronization for shareable filter URLs
- LocalStorage persistence to maintain filter state between page reloads
- Support for conditional rendering of filter sections
- Price range slider with dual handles
- Client-side detection to prevent hydration errors
- Support for various filter types:
  - Category filters (checkboxes)
  - Brand filters (checkboxes)
  - Device model filters (checkboxes)
  - Condition filters (radio buttons)
  - Variation filters (radio buttons)
  - In-stock filters (checkbox)
  - Price range filters (slider and inputs)

## Installation

The component is already available in the project. You can import it from:

```tsx
import { AdvancedFilterPanel } from "@/components";
// or
import AdvancedFilterPanel from "@/components/advanced-filter-panel";
```

## Basic Usage

Here's a minimal example of using the filter panel:

```tsx
"use client";

import { useState } from "react";
import { AdvancedFilterPanel } from "@/components";

export default function ProductsPage() {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("1000");
  
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const handleBrandToggle = (brandId: number) => {
    setSelectedBrands(prev => 
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };
  
  const handleApplyFilters = () => {
    // Fetch products with the selected filters
    fetchProducts({
      categories: selectedCategories,
      brands: selectedBrands,
      minPrice,
      maxPrice
    });
  };
  
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinPrice("0");
    setMaxPrice("1000");
  };
  
  return (
    <div>
      <AdvancedFilterPanel
        categories={categories}
        brands={brands}
        selectedCategories={selectedCategories}
        selectedBrands={selectedBrands}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onCategoryToggle={handleCategoryToggle}
        onBrandToggle={handleBrandToggle}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
      
      {/* Your product grid here */}
    </div>
  );
}
```

## Full Configuration

Here's an example with all available options:

```tsx
<AdvancedFilterPanel
  // Data for filter options
  categories={categories}
  brands={brands}
  deviceModels={deviceModels}
  
  // Selected filter values
  selectedCategories={selectedCategories}
  selectedBrands={selectedBrands}
  selectedModels={selectedModels}
  minPrice={minPrice}
  maxPrice={maxPrice}
  condition={condition}
  hasVariations={hasVariations}
  inStockOnly={inStockOnly}
  
  // Event handlers
  onCategoryToggle={handleCategoryToggle}
  onBrandToggle={handleBrandToggle}
  onModelToggle={handleModelToggle}
  onMinPriceChange={setMinPrice}
  onMaxPriceChange={setMaxPrice}
  onConditionChange={handleConditionChange}
  onHasVariationsChange={handleHasVariationsChange}
  onInStockChange={handleInStockChange}
  onApplyFilters={handleApplyFilters}
  onResetFilters={handleResetFilters}
/>
```

## URL Synchronization

The component automatically syncs the filter state with the URL, making filter states shareable. For example, a URL might look like:

```
https://example.com/products?categories=1,2&brands=3&minPrice=100&maxPrice=500&condition=excellent&inStock=true
```

## LocalStorage Persistence

The component also saves the filter state to localStorage, ensuring that the filters persist between page reloads or navigation.

## Handling Additional Filter Types

You can extend the component to handle additional filter types by:

1. Adding new properties to the `AdvancedFilterPanelProps` interface
2. Adding new state variables to track these filter values
3. Creating new handler functions for the filter changes
4. Adding new AccordionItems to render the filter UI

## Integration with Existing Code

The `AdvancedFilterPanel` is designed to work seamlessly with the existing codebase. It incorporates best practices from both the original `FilterPanel` and the `RefurbishedFilterPanel` components, with added features for proper URL state management and persistence.

## Example Implementation

A complete example implementation can be found at:
`/src/app/[locale]/example-filter-page/page.tsx`

This example shows how to:
- Initialize state from URL parameters
- Handle filter changes
- Apply filters
- Reset filters
- Display products based on filtered criteria 