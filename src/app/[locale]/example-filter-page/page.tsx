"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import AdvancedFilterPanel from "@/components/advanced-filter-panel";

// Example data for demonstration
const SAMPLE_CATEGORIES = [
  { id: 1, name: "Smartphones" },
  { id: 2, name: "Tablets" },
  { id: 3, name: "Accessories" },
  { id: 4, name: "Wearables" },
];

const SAMPLE_BRANDS = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Samsung" },
  { id: 3, name: "Google" },
  { id: 4, name: "Xiaomi" },
];

const SAMPLE_MODELS = [
  { id: 1, name: "iPhone 13" },
  { id: 2, name: "Galaxy S22" },
  { id: 3, name: "Pixel 6" },
  { id: 4, name: "Mi 11" },
];

export default function ExampleFilterPage() {
  const t = useTranslations();
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("2000");
  const [condition, setCondition] = useState<string>("all");
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    
    // Load filters from URL params on initial load
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Parse categories
      const categoriesParam = url.searchParams.get('categories');
      if (categoriesParam) {
        const categoryIds = categoriesParam.split(',').map(id => parseInt(id));
        setSelectedCategories(categoryIds);
      }
      
      // Parse brands
      const brandsParam = url.searchParams.get('brands');
      if (brandsParam) {
        const brandIds = brandsParam.split(',').map(id => parseInt(id));
        setSelectedBrands(brandIds);
      }
      
      // Parse models
      const modelsParam = url.searchParams.get('models');
      if (modelsParam) {
        const modelIds = modelsParam.split(',').map(id => parseInt(id));
        setSelectedModels(modelIds);
      }
      
      // Parse price range
      const minPriceParam = url.searchParams.get('minPrice');
      if (minPriceParam) {
        setMinPrice(minPriceParam);
      }
      
      const maxPriceParam = url.searchParams.get('maxPrice');
      if (maxPriceParam) {
        setMaxPrice(maxPriceParam);
      }
      
      // Parse condition
      const conditionParam = url.searchParams.get('condition');
      if (conditionParam) {
        setCondition(conditionParam);
      }
      
      // Parse hasVariations
      const hasVariationsParam = url.searchParams.get('hasVariations');
      if (hasVariationsParam !== null) {
        setHasVariations(hasVariationsParam === 'true');
      }
      
      // Parse inStock
      const inStockParam = url.searchParams.get('inStock');
      if (inStockParam) {
        setInStockOnly(inStockParam === 'true');
      }
    }
  }, []);
  
  // Filter handlers
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
  
  const handleModelToggle = (modelId: number) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };
  
  const handleConditionChange = (value: string) => {
    setCondition(value);
  };
  
  const handleHasVariationsChange = (value: boolean | null) => {
    setHasVariations(value);
  };
  
  const handleInStockChange = (value: boolean) => {
    setInStockOnly(value);
  };
  
  const handleApplyFilters = () => {
    console.log("Filters applied:", {
      categories: selectedCategories,
      brands: selectedBrands,
      models: selectedModels,
      minPrice,
      maxPrice,
      condition,
      hasVariations,
      inStockOnly
    });
    
    // Here you would typically fetch data based on the filters
    // For example: fetchProductData(filters);
  };
  
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedModels([]);
    setMinPrice("0");
    setMaxPrice("2000");
    setCondition("all");
    setHasVariations(null);
    setInStockOnly(false);
  };
  
  // Mock products (this would normally come from a data fetch)
  const filteredProducts = [
    { id: 1, name: "iPhone 13 Pro", brand: "Apple", price: 999 },
    { id: 2, name: "Samsung Galaxy S22", brand: "Samsung", price: 799 },
    { id: 3, name: "Google Pixel 6", brand: "Google", price: 599 }
  ];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Example Filter Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Panel */}
        <div className="md:col-span-1">
          <AdvancedFilterPanel 
            categories={SAMPLE_CATEGORIES}
            brands={SAMPLE_BRANDS}
            deviceModels={SAMPLE_MODELS}
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            selectedModels={selectedModels}
            minPrice={minPrice}
            maxPrice={maxPrice}
            condition={condition}
            hasVariations={hasVariations}
            inStockOnly={inStockOnly}
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
        </div>
        
        {/* Product Grid */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          
          {isClient ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="border rounded-lg p-4 shadow">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-gray-500">{product.brand}</p>
                  <p className="font-bold mt-2">${product.price}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p>Loading...</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Current Filter State:</h2>
        <pre className="text-xs overflow-auto p-2 bg-white border rounded">
          {JSON.stringify({
            categories: selectedCategories,
            brands: selectedBrands,
            models: selectedModels,
            priceRange: [minPrice, maxPrice],
            condition,
            hasVariations,
            inStockOnly
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 