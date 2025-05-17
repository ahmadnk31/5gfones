"use client";

import React from "react";
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

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface FilterPanelProps {
  categories: Category[];
  brands: Brand[];
  selectedCategories: number[];
  selectedBrands: number[];
  minPrice: string;
  maxPrice: string;
  onCategoryToggle: (categoryId: number) => void;
  onBrandToggle: (brandId: number) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const FilterPanel = ({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  minPrice,
  maxPrice,
  onCategoryToggle,
  onBrandToggle,
  onMinPriceChange,
  onMaxPriceChange,
  onApplyFilters,
  onResetFilters,
}: FilterPanelProps) => {
  const t = useTranslations();

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium'>{t("products.filters")}</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={onResetFilters}
          className='flex items-center gap-1 text-sm'
        >
          <FilterX className='h-4 w-4' />
          {t("products.resetFilters")}
        </Button>
      </div>

      {/* Categories filter */}
      <Accordion
        type='multiple'
        defaultValue={["categories", "brands", "price"]}
      >
        <AccordionItem value='categories'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("products.categories")}
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
            {t("products.brands")}
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

        {/* Price Range filter */}
        <AccordionItem value='price'>
          <AccordionTrigger className='text-sm font-medium'>
            {t("products.priceRange")}
          </AccordionTrigger>
          <AccordionContent>
            <div className='space-y-3'>
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <label htmlFor='min-price' className='text-xs text-gray-500'>
                    {t("products.minPrice")}
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
                    {t("products.maxPrice")}
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
      </Accordion>

      <Button onClick={onApplyFilters} className='w-full'>
        {t("products.applyFilters")}
      </Button>
    </div>
  );
};

export default FilterPanel;
