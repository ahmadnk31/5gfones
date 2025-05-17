import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ProductsGrid from "@/components/products-grid";
import Image from "next/image";

interface CategoryPageProps {
  params: {
    id: string;
    locale: string;
  };
  searchParams: {
    page?: string;
    sort?: string;
    brand?: string;
    brands?: string;
    category?: string;
    categories?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const t = await getTranslations();
  const supabase = createClient();  
  const {id}=await params
  
  console.log("Category page searchParams:", searchParams);
    const pageNumber = searchParams.page ? parseInt(searchParams.page) : 1;
  const sortBy = searchParams.sort || "name-asc";
  
  // Extract brand filter from URL params - this should be a single brand ID when using the filter
  const selectedBrands = searchParams.brand
    ? searchParams.brand.split(",").map(Number)
    : [];
    
  // Convert to boolean correctly
  const inStockOnly = searchParams.inStock === "true";
  
  // Extract price range filter values
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;
  
  // For selected categories, we always include the current category + any additional selections
  // Note: When filtering within a category page, we should use 'categories' param, not 'category'
  const additionalCategories = searchParams.categories 
    ? searchParams.categories.split(",").map(Number).filter(catId => catId !== Number(id))
    : [];

  const productsPerPage = 16;
  const offset = (pageNumber - 1) * productsPerPage;
  // Fetch category details
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .eq("id", id)
    .single();

  if (!category) notFound();

  // Determine sort order
  let sortColumn = "name";
  let sortOrder: "asc" | "desc" = "asc";

  switch (sortBy) {
    case "name-asc":
      sortColumn = "name";
      sortOrder = "asc";
      break;
    case "name-desc":
      sortColumn = "name";
      sortOrder = "desc";
      break;
    case "price-asc":
      sortColumn = "base_price";
      sortOrder = "asc";
      break;
    case "price-desc":
      sortColumn = "base_price";
      sortOrder = "desc";
      break;
    case "newest":
      sortColumn = "created_at";
      sortOrder = "desc";
      break;
  }  // Build query for products in this category
  let query = supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      base_price,
      image_url,
      in_stock,
      brands:brand_id (name),
      variant_count:product_variants(count)
    `,
      { count: "exact" }
    )
    .eq("category_id", id)
    .order(sortColumn, { ascending: sortOrder === "asc" });
    // Apply brand filter if selected
  if (selectedBrands.length > 0) {
    query = query.in("brand_id", selectedBrands);
    console.log("Applying brand filter with IDs:", selectedBrands);
  }

  // Apply in-stock filter if selected
  if (inStockOnly) {
    query = query.gt("in_stock", 0);
    console.log("Applying in-stock filter");
  }
  
  // Apply price range filter if provided
  if (minPrice !== undefined) {
    query = query.gte("base_price", minPrice);
    console.log("Applying minimum price filter:", minPrice);
  }
  
  if (maxPrice !== undefined) {
    query = query.lte("base_price", maxPrice);
    console.log("Applying maximum price filter:", maxPrice);
  }

  // Apply pagination
  const {
    data: products,
    error,
    count,
  } = await query.range(offset, offset + productsPerPage - 1);

  if (error) {
    console.error("Error fetching products:", error);
    notFound();
  }

  const totalProducts = count || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Fetch all categories and brands for filtering
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });
    console.log("brands", brands);
  // Check if categories and brands were fetched successfully
  if (!categories || !brands) {
    console.error("Error fetching categories or brands");
    notFound();
  }
  return (
    <div>
      {/* Hero section with category image and overlay text */}
      <div className='relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-r from-blue-600 to-violet-700 mb-8'>
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className='object-cover mix-blend-overlay opacity-60'
            priority
          />
        )}
        <div className='absolute inset-0 flex flex-col justify-center items-center text-white p-4 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg'>
            {category.name}
          </h1>

          <p className='mt-4 text-lg'>
            {totalProducts} {t("categories.availableProducts") || "Products"}
          </p>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>        <div className='mb-8'>
          <h2 className='text-2xl font-bold'>
            {category.name} {t("categories.productCount")}
          </h2>
        </div>          
        <ProductsGrid
            products={products || []}
            categories={categories || []}
            brands={brands || []}
            currentPage={pageNumber}
            totalPages={totalPages}
            totalProducts={totalProducts}
            perPage={productsPerPage}
            currentCategoryId={Number(id)}
            selectedCategories={[Number(id), ...additionalCategories]} 
            currentBrandId={selectedBrands.length > 0 ? selectedBrands[0] : undefined}
            selectedBrands={selectedBrands}
            currentSortBy={sortBy}
            currentMinPrice={minPrice}
            currentMaxPrice={maxPrice}
            currentInStockOnly={inStockOnly}
          />
      </div>
    </div>
  );
}
