"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";

interface Product {
  id: string | number;
  name: string;
}

interface ProductSelectorProps {
  categoryId?: number;
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function ProductSelector({
  categoryId,
  selectedProducts,
  onProductsChange,
  label = "Products",
  placeholder = "Select products..."
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const supabase = createClient();
      
      let query = supabase
        .from('products')
        .select('id, name');
      
      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [categoryId]);

  const productOptions = products.map(product => ({
    value: product.id.toString(),
    label: product.name
  }));

  return (
    <div className="space-y-2">
      <Label htmlFor="product-selector">{label}</Label>
      <MultiSelector
        values={selectedProducts}
        onValuesChange={onProductsChange}
        className="w-full"
      >
        <MultiSelectorTrigger>
          <MultiSelectorInput 
            id="product-selector"
            placeholder={loading ? "Loading products..." : placeholder} 
          />
        </MultiSelectorTrigger>
        <MultiSelectorContent>
          <MultiSelectorList>
            {productOptions.map((option) => (
              <MultiSelectorItem key={option.value} value={option.value}>
                {option.label}
              </MultiSelectorItem>
            ))}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>
      {loading && <p className="text-sm text-muted-foreground">Loading products...</p>}
    </div>
  );
}
