"use client";

import React, { useState } from "react";
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
}: RefurbishedFilterPanelProps) => {
  const t = useTranslations();

  return (
    <div className='space-y-4 p-4 border rounded-lg bg-background'>      <div className='flex items-center justify-between'>
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
            <div className='space-y-6'>
              <div className="pt-6 pb-2">
                <DualRangeSlider
                  defaultValue={[parseInt(minPrice) || 0, parseInt(maxPrice) || 2000]}
                  min={0}
                  max={parseInt(maxPrice) || 2000}
                  step={10}
                  onValueChange={(values) => {
                    if (Array.isArray(values) && values.length === 2) {
                      onMinPriceChange(values[0].toString());
                      onMaxPriceChange(values[1].toString());
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
              
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <label htmlFor='min-price' className='text-xs text-gray-500'>
                    {t("filters.minPrice")}
                  </label>
                  <Input
                    id='min-price'
                    type='number'
                    placeholder='0'
                    value={minPrice}
                    onChange={(e) => onMinPriceChange(e.target.value)}
                    className='h-8'
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
                    value={maxPrice}
                    onChange={(e) => onMaxPriceChange(e.target.value)}
                    className='h-8'
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
