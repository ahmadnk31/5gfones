"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FilterX } from "lucide-react";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface DeviceModel {
  id: number;
  name: string;
}

interface AdvancedFilterPanelProps {
  categories: Category[];
  brands: Brand[];
  deviceModels?: DeviceModel[];
  selectedCategories: number[];
  selectedBrands: number[];
  selectedModels?: number[];
  minPrice: string;
  maxPrice: string;
  condition?: string;
  hasVariations?: boolean | null;
  inStockOnly?: boolean;
  onCategoryToggle: (categoryId: number) => void;
  onBrandToggle: (brandId: number) => void;
  onModelToggle?: (modelId: number) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onConditionChange?: (value: string) => void;
  onHasVariationsChange?: (value: boolean | null) => void;
  onInStockChange?: (value: boolean) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const AdvancedFilterPanel = ({
  categories,
  brands,
  deviceModels = [],
  selectedCategories,
  selectedBrands,
  selectedModels = [],
  minPrice,
  maxPrice,
  condition = "all",
  hasVariations = null,
  inStockOnly = false,
  onCategoryToggle,
  onBrandToggle,
  onModelToggle = () => {},
  onMinPriceChange,
  onMaxPriceChange,
  onConditionChange = () => {},
  onHasVariationsChange = () => {},
  onInStockChange = () => {},
  onApplyFilters,
  onResetFilters,
}: AdvancedFilterPanelProps) => {
  const t = useTranslations();
  
  // Client-side detection to prevent hydration errors
  const [isClient, setIsClient] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  
  // Initialize client state after component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Try to load saved filter state from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('advancedFilters');
        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          console.log("Loaded saved filters from localStorage:", parsedFilters);
          
          // You could use these filters to initialize your state if needed
          // This is optional as the parent component may already handle this
        }
      } catch (err) {
        console.error("Error loading saved filters:", err);
      }
    }
  }, []);
  
  // Update local state when props change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);
  
  // Save filter state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const filterState = {
        selectedCategories,
        selectedBrands,
        selectedModels,
        minPrice,
        maxPrice,
        condition,
        hasVariations,
        inStockOnly
      };
      
      localStorage.setItem('advancedFilters', JSON.stringify(filterState));
      console.log("Saved filter state to localStorage");
    } catch (err) {
      console.error("Error saving filter state:", err);
    }
  }, [
    isClient,
    selectedCategories,
    selectedBrands,
    selectedModels,
    minPrice,
    maxPrice,
    condition,
    hasVariations,
    inStockOnly
  ]);
  
  // Update URL with current filter state
  const updateUrl = useCallback(() => {
    if (!isClient) return;
    
    try {
      const url = new URL(window.location.href);
      
      // Set category parameters
      if (selectedCategories.length > 0) {
        url.searchParams.set("categories", selectedCategories.join(","));
      } else {
        url.searchParams.delete("categories");
      }
      
      // Set brand parameters
      if (selectedBrands.length > 0) {
        url.searchParams.set("brands", selectedBrands.join(","));
      } else {
        url.searchParams.delete("brands");
      }
      
      // Set model parameters
      if (selectedModels.length > 0) {
        url.searchParams.set("models", selectedModels.join(","));
      } else {
        url.searchParams.delete("models");
      }
      
      // Set price parameters
      if (minPrice) {
        url.searchParams.set("minPrice", minPrice);
      } else {
        url.searchParams.delete("minPrice");
      }
      
      if (maxPrice) {
        url.searchParams.set("maxPrice", maxPrice);
      } else {
        url.searchParams.delete("maxPrice");
      }
      
      // Set condition parameter
      if (condition && condition !== "all") {
        url.searchParams.set("condition", condition);
      } else {
        url.searchParams.delete("condition");
      }
      
      // Set variations parameter
      if (hasVariations !== null) {
        url.searchParams.set("hasVariations", hasVariations ? "true" : "false");
      } else {
        url.searchParams.delete("hasVariations");
      }
      
      // Set in-stock parameter
      if (inStockOnly) {
        url.searchParams.set("inStock", "true");
      } else {
        url.searchParams.delete("inStock");
      }
      
      // Update URL without page reload
      window.history.pushState({}, "", url.toString());
      console.log("URL updated with filters:", url.toString());
    } catch (err) {
      console.error("Error updating URL with filters:", err);
    }
  }, [
    isClient,
    selectedCategories,
    selectedBrands,
    selectedModels,
    minPrice,
    maxPrice,
    condition,
    hasVariations,
    inStockOnly
  ]);
  
  // Handle local price change with debounce
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMinPrice(e.target.value);
    onMinPriceChange(e.target.value);
  };
  
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMaxPrice(e.target.value);
    onMaxPriceChange(e.target.value);
  };
  
  // Apply filters and update URL
  const handleApplyFilters = () => {
    if (isClient) {
      updateUrl();
    }
    onApplyFilters();
  };

  // Generate default open accordion values based on which filters are active
  const getDefaultAccordionValues = () => {
    const values = ["categories", "brands", "price"];
    
    if (deviceModels.length > 0) values.push("models");
    if (condition !== "all") values.push("condition");
    if (hasVariations !== null) values.push("variations");
    
    return values;
  };

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-background'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium'>{t("filters.title")}</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={onResetFilters}
          className='flex items-center gap-1 text-sm'
        >
          <FilterX className='h-4 w-4' />
          {t("filters.reset")}
        </Button>
      </div>

      <Accordion
        type='multiple'
        defaultValue={getDefaultAccordionValues()}
      >
        {/* Condition filter - only show if onConditionChange handler is provided */}
        {onConditionChange !== undefined && (
          <AccordionItem value='condition'>
            <AccordionTrigger className='text-sm font-medium'>
              {t("filters.condition")}
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={condition}
                onValueChange={onConditionChange}
                className='space-y-2'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='all' id='condition-all' />
                  <Label htmlFor='condition-all'>{t("filters.allConditions")}</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='excellent' id='condition-excellent' />
                  <Label htmlFor='condition-excellent'>{t("filters.excellent")}</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='good' id='condition-good' />
                  <Label htmlFor='condition-good'>{t("filters.good")}</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='fair' id='condition-fair' />
                  <Label htmlFor='condition-fair'>{t("filters.fair")}</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Variations filter - only show if onHasVariationsChange handler is provided */}
        {onHasVariationsChange !== undefined && (
          <AccordionItem value='variations'>
            <AccordionTrigger className='text-sm font-medium'>
              {t("filters.variants")}
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={
                  hasVariations === null ? "all" : hasVariations ? "yes" : "no"
                }
                onValueChange={(value) => {
                  if (value === "all") onHasVariationsChange(null);
                  else if (value === "yes") onHasVariationsChange(true);
                  else onHasVariationsChange(false);
                }}
                className='space-y-2'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='all' id='variations-all' />
                  <Label htmlFor='variations-all'>{t("filters.allProducts")}</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='yes' id='variations-yes' />
                  <Label htmlFor='variations-yes'>{t("filters.withVariants")}</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='no' id='variations-no' />
                  <Label htmlFor='variations-no'>{t("filters.withoutVariants")}</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* In Stock filter - only show if onInStockChange handler is provided */}
        {onInStockChange !== undefined && (
          <AccordionItem value='inStock'>
            <AccordionTrigger className='text-sm font-medium'>
              {t("filters.availability")}
            </AccordionTrigger>
            <AccordionContent>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='in-stock'
                  checked={inStockOnly}
                  onCheckedChange={() => onInStockChange(!inStockOnly)}
                />
                <label
                  htmlFor='in-stock'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  {t("filters.inStockOnly")}
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Categories filter */}
        <AccordionItem value='categories'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("filters.category")}
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-2'>
              {categories.map((category) => (
                <div key={category.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => onCategoryToggle(category.id)}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brands filter */}
        <AccordionItem value='brands'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("filters.brand")}
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-2'>
              {brands.map((brand) => (
                <div key={brand.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => onBrandToggle(brand.id)}
                  />
                  <label
                    htmlFor={`brand-${brand.id}`}
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    {brand.name}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Device Models filter - only show if deviceModels is provided */}
        {deviceModels.length > 0 && (
          <AccordionItem value='models'>
            <AccordionTrigger className='text-sm font-medium'>
              {t("filters.compatibleModels")}
            </AccordionTrigger>
            <AccordionContent>
              <div className='space-y-2'>
                {deviceModels.map((model) => (
                  <div key={model.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={() => onModelToggle(model.id)}
                    />
                    <label
                      htmlFor={`model-${model.id}`}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {model.name}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price Range filter */}
        <AccordionItem value='price'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("filters.priceRange")}
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-6'>
              {isClient && (
                <div className="pt-6 pb-2">
                  <DualRangeSlider
                    value={[parseInt(minPrice) || 0, parseInt(maxPrice) || 2000]}
                    min={0}
                    max={parseInt(maxPrice) || 2000}
                    step={10}
                    onValueChange={(values) => {
                      if (Array.isArray(values) && values.length === 2) {
                        const [min, max] = values;
                        setLocalMinPrice(min.toString());
                        setLocalMaxPrice(max.toString());
                        onMinPriceChange(min.toString());
                        onMaxPriceChange(max.toString());
                      }
                    }}
                    label={(value) => value !== undefined ? 
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(value) : ''
                    }
                  />
                </div>
              )}
              
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <label htmlFor='min-price' className='text-xs text-gray-500'>
                    {t("filters.minPrice")}
                  </label>
                  <Input
                    id='min-price'
                    type='number'
                    placeholder='0'
                    value={localMinPrice}
                    onChange={handleMinPriceChange}
                    className='h-8'
                    min={0}
                    max={parseInt(localMaxPrice) || 2000}
                  />
                </div>
                <div className='space-y-1'>
                  <label htmlFor='max-price' className='text-xs text-gray-500'>
                    {t("filters.maxPrice")}
                  </label>
                  <Input
                    id='max-price'
                    type='number'
                    placeholder='1000'
                    value={localMaxPrice}
                    onChange={handleMaxPriceChange}
                    className='h-8'
                    min={parseInt(localMinPrice) || 0}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Button onClick={handleApplyFilters} className='w-full'>
        {t("filters.apply")}
      </Button>
    </div>
  );
};

export default AdvancedFilterPanel; 