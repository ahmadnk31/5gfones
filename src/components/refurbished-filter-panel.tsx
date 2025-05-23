"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { debounce } from "lodash";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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

interface RefurbishedFilterPanelProps {
  categories: Category[];
  brands: Brand[];
  deviceModels: DeviceModel[];
  selectedCategories: number[];
  selectedBrands: number[];
  selectedModels: number[];
  minPrice: string;
  maxPrice: string;
  condition: string;
  hasVariations: boolean | null;
  onCategoryToggle: (categoryId: number) => void;
  onBrandToggle: (brandId: number) => void;
  onModelToggle: (modelId: number) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onHasVariationsChange: (value: boolean | null) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const RefurbishedFilterPanel = ({
  categories,
  brands,
  deviceModels,
  selectedCategories,
  selectedBrands,
  selectedModels,
  minPrice,
  maxPrice,
  condition,
  hasVariations,
  onCategoryToggle,
  onBrandToggle,
  onModelToggle,
  onMinPriceChange,
  onMaxPriceChange,
  onConditionChange,
  onHasVariationsChange,
  onApplyFilters,
  onResetFilters,
}: RefurbishedFilterPanelProps) => {  const t = useTranslations();
  const [localPriceRange, setLocalPriceRange] = useState<number[]>(() => {
    const initialMin = parseInt(minPrice) || 0;
    const initialMax = parseInt(maxPrice) || 2000;
    console.log("Initializing localPriceRange with:", [initialMin, initialMax]);
    return [initialMin, initialMax];
  });

  // Debounce filter application to prevent too many updates
  const debouncedApply = useCallback(
    debounce(() => {
      // This could trigger a parent update if needed
    }, 150),
    []
  );
  // Update local state when props change
  useEffect(() => {
    const newMin = parseInt(minPrice) || 0;
    const newMax = parseInt(maxPrice) || 2000;
    
    // Only update if values are different to prevent infinite loops
    if (localPriceRange[0] !== newMin || localPriceRange[1] !== newMax) {
      setLocalPriceRange([newMin, newMax]);
    }
  }, [minPrice, maxPrice]); // Removed localPriceRange from dependencies
  // Handle slider value changes
  const handlePriceRangeChange = (values: number[]) => {
    console.log("handlePriceRangeChange called with:", values);
    
    if (Array.isArray(values) && values.length === 2) {
      console.log("Price range slider changed to:", values);

      // Ensure values are rounded to multiples of the step (10)
      const roundedValues = values.map(value => Math.round(value / 10) * 10);
      console.log("Rounded values:", roundedValues);

      // Update the local state with rounded values
      setLocalPriceRange(roundedValues);

      // Update parent state immediately
      onMinPriceChange(roundedValues[0].toString());
      onMaxPriceChange(roundedValues[1].toString());
    } else {
      console.warn("Invalid values received in handlePriceRangeChange:", values);
    }
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
        defaultValue={[
          "condition",
          "variations",
          "categories",
          "brands",
          "models",
          "price",
        ]}
      >
        {/* Condition filter */}
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

        {/* Variations filter */}
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

        {/* Categories filter */}
        <AccordionItem value='categories'>          <AccordionTrigger className='text-sm font-medium'>
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
        <AccordionItem value='brands'>          <AccordionTrigger className='text-sm font-medium'>
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

        {/* Device Models filter */}
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

        {/* Price Range filter */}        <AccordionItem value='price'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("filters.priceRange")}
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-6'>              <div className="pt-6 pb-2">
                <Slider
                  key={`slider-${localPriceRange[0]}-${localPriceRange[1]}`}
                  value={localPriceRange.length === 2 ? localPriceRange : [0, 2000]}
                  min={0}
                  max={2000}
                  step={10}
                  onValueChange={handlePriceRangeChange}
                  className="mb-6"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>{new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(localPriceRange[0] || 0)}</span>
                  <span>{new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD", 
                    maximumFractionDigits: 0,
                  }).format(localPriceRange[1] || 2000)}</span>
                </div>
              </div>
              
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <label htmlFor='min-price' className='text-xs text-gray-500'>
                    {t("filters.minPrice")}
                  </label>
                  <Input
                    id='min-price'
                    type='number'
                    placeholder='0'
                    value={localPriceRange[0]}                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      console.log("Min price input changed to:", value);
                      
                      // Round to the nearest step of 10
                      const roundedValue = Math.round(value / 10) * 10;
                      // Ensure min doesn't exceed max
                      const newMin = Math.min(roundedValue, localPriceRange[1]);
                      const newRange = [newMin, localPriceRange[1]];
                      
                      setLocalPriceRange(newRange);
                      onMinPriceChange(newMin.toString());
                      onMaxPriceChange(newRange[1].toString());
                    }}
                    className='h-8'
                    min={0}
                    max={localPriceRange[1]}
                  />
                </div>
                <div className='space-y-1'>
                  <label htmlFor='max-price' className='text-xs text-gray-500'>
                    {t("filters.maxPrice")}
                  </label>
                  <Input
                    id='max-price'
                    type='number'
                    placeholder='2000'
                    value={localPriceRange[1]}                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      console.log("Max price input changed to:", value);
                      
                      // Round to the nearest step of 10
                      const roundedValue = Math.round(value / 10) * 10;
                      // Ensure max isn't less than min
                      const newMax = Math.max(roundedValue, localPriceRange[0]);
                      const newRange = [localPriceRange[0], newMax];
                      
                      setLocalPriceRange(newRange);
                      onMinPriceChange(newRange[0].toString());
                      onMaxPriceChange(newMax.toString());
                    }}
                    className='h-8'
                    min={localPriceRange[0]}
                    max={2000}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>      <Button onClick={onApplyFilters} className='w-full'>
        {t("filters.apply")}
      </Button>
    </div>
  );
};

export default RefurbishedFilterPanel;
