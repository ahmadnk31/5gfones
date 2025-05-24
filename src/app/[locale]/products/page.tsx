import React from "react";
import { createClient } from "@/lib/supabase/server";
import ProductsGrid from "@/components/products-grid";
import { getTranslations } from "next-intl/server";

// Product type definition
interface ProductVariant {
  id: string | number;
}

interface Brand {
  name: string;
}

type Product = {
  id: string | number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: number;
  brand_id: number;
  brands: Brand[];
  product_variants: ProductVariant[];
  variant_count: number;
};

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { [key: string]: string | undefined };
}) {
  const t = await getTranslations("products");
  const { locale } = await params;
  
  // Create Supabase client
  const supabase = await createClient();
  // Parse query parameters
  const page = parseInt(searchParams?.page || "1");
  const perPage = parseInt(searchParams?.perPage || "12");
  const categoryId = searchParams?.category
    ? parseInt(searchParams.category)
    : undefined;
  const brandId = searchParams?.brand
    ? parseInt(searchParams.brand)
    : undefined;
  const sortBy = searchParams?.sort || "newest";
  const minPrice = searchParams?.minPrice
    ? parseFloat(searchParams.minPrice)
    : undefined;
  const maxPrice = searchParams?.maxPrice
    ? parseFloat(searchParams.maxPrice)
    : undefined;
  const inStockOnly = searchParams?.inStock === "true";
    
  // Start building the query
  let query = supabase.from("products").select(
    `
      id, 
      name, 
      base_price,
      image_url,
      in_stock,
      brand_id,
      brands (id, name),
      product_variants (id)
    `,
    { count: "exact" }
  ).eq('is_repair_part', false);

  console.log("Processing filter with brandId:", brandId);

  // Apply filters
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (brandId) {
    console.log("Applying brand filter with ID:", brandId);
    query = query.eq("brand_id", brandId);
  }

  if (minPrice !== undefined) {
    query = query.gte("base_price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("base_price", maxPrice);
  }
  
  // Apply in-stock filter if requested
  if (inStockOnly) {
    query = query.gt("in_stock", 0);
    console.log("Applying in-stock filter");
  }

  // Apply sorting
  switch (sortBy) {
    case "price-asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  // Execute the query
  const { data: products, error, count } = await query;

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  // Fetch brands for filter
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");
    
  // Number of pages
  const totalPages = count ? Math.ceil(count / perPage) : 0;

  // Process the products to include the correct variant count based on product_variants
  const processedProducts = products?.map(product => ({
    ...product,
    variant_count: product.product_variants ? product.product_variants.length : 0,
    // Ensure brands is always an array for consistency
    brands: product.brands ? (Array.isArray(product.brands) ? product.brands : [product.brands]) : []
  }));
  
  console.log('Products with processed variant counts:', processedProducts);
  
  return (
    <ProductsGrid
      products={processedProducts || []}
      categories={categories || []}
      brands={brands || []}
      currentPage={page}
      totalPages={totalPages}
      totalProducts={count || 0}
      perPage={perPage}
      currentCategoryId={categoryId}
      currentBrandId={brandId}      currentSortBy={sortBy}
      currentMinPrice={minPrice}
      currentMaxPrice={maxPrice}
      currentInStockOnly={inStockOnly}
    />
  );
}
