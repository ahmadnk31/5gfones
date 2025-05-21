"use client";

import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/product-card';
import { withCategoryDiscounts } from '@/lib/category-discount-helper';

interface Product {
  id: string | number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: boolean;
  brand_id: number;
  category_id?: number;
  brands: { id: number, name: string } | null;
  variant_count: number;
  product_variants: {
    id: string | number;
    variant_name: string;
    price_adjustment: number;
    image_url: string | null;
  }[];
  discount_percentage?: number;
  categoryDiscount?: number;
}

interface ProductsWithDiscountsProps {
  products: Product[];
  t: any; // Translation function
}

export default function ProductsWithDiscounts({ products, t }: ProductsWithDiscountsProps) {
  const [productsWithDiscounts, setProductsWithDiscounts] = useState<(Product & { categoryDiscount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch category discounts when component mounts
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const enhancedProducts = await withCategoryDiscounts(products);
        setProductsWithDiscounts(enhancedProducts);
      } catch (error) {
        console.error("Error fetching category discounts:", error);
        // Fallback to products without category discounts
        setProductsWithDiscounts(products.map(p => ({
          ...p,
          categoryDiscount: 0
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [products]);

  if (loading) {
    return (
      <div className="w-full text-center py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {productsWithDiscounts.map((product) => {
        // Determine if product has variants
        const hasVariants = product.variant_count > 0;
        
        // Try to get brand name from the product - ensure proper null checks
        const brandName = product.brands && typeof product.brands === 'object' ? product.brands.name : undefined;

        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.base_price}
            imageUrl={product.image_url || "/placeholder.svg"}
            inStock={product.in_stock}
            hasVariants={hasVariants}
            brandName={brandName}
            productDiscount={product.discount_percentage || 0}
            categoryDiscount={product.categoryDiscount || 0}
          />
        );
      })}
    </div>
  );
}
