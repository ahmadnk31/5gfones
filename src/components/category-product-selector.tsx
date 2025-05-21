"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ProductSelector from './product-selector';

interface Category {
  id: number;
  name: string;
}

interface CategoryProductSelectorProps {
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
  categoryLabel?: string;
  productLabel?: string;
  productPlaceholder?: string;
}

export default function CategoryProductSelector({
  selectedProducts,
  onProductsChange,
  categoryLabel = "Category",
  productLabel = "Products",
  productPlaceholder = "Select products..."
}: CategoryProductSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');
      
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  const handleCategoryChange = (value: string) => {
    const categoryId = parseInt(value, 10);
    setSelectedCategory(categoryId);
    // Reset selected products when category changes
    onProductsChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-selector">{categoryLabel}</Label>
        <Select onValueChange={handleCategoryChange} disabled={loading}>
          <SelectTrigger id="category-selector" className="w-full">
            <SelectValue placeholder={loading ? "Loading categories..." : "Select a category..."} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && <p className="text-sm text-muted-foreground">Loading categories...</p>}
      </div>

      {selectedCategory && (
        <ProductSelector
          categoryId={selectedCategory}
          selectedProducts={selectedProducts}
          onProductsChange={onProductsChange}
          label={productLabel}
          placeholder={productPlaceholder}
        />
      )}
    </div>
  );
}
