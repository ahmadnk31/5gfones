import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Tablet, Laptop, Headphones, Tv, Watch } from "lucide-react";
import ProductsGrid from "@/components/products-grid";
import { Link } from "@/i18n/navigation";

// Define a mapping of category names to icons
const categoryIcons: Record<string, React.ReactNode> = {
  Phones: <Phone />,
  Tablets: <Tablet />,
  Laptops: <Laptop />,
  Headphones: <Headphones />,
  TVs: <Tv />,
  Smartwatches: <Watch />,
  // Add more mappings as needed
};

export default async function CategoriesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  // Define types needed for the page
  type Category = {
    id: number;
    name: string;
    image_url: string | null;
  };

  type CategoryCount = {
    id: number;
    name: string;
    product_count: number;
  };

  type FeaturedProduct = {
    id: number;
    name: string;
    base_price: number;
    image_url: string | null;
    in_stock: boolean;
    brands: { name: string } | null;
    variant_count: number;
  };

  // Fetch all categories
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .order("name", { ascending: true });

  // Process and type-cast categories
  const categories: Category[] = [];
  if (rawCategories) {
    // Use type assertion to get around TypeScript errors
    rawCategories.forEach((rawItem: any) => {
      if (rawItem && typeof rawItem === "object" && "id" in rawItem) {
        categories.push({
          id: Number(rawItem.id),
          name: String(rawItem.name || ""),
          image_url: rawItem.image_url ? String(rawItem.image_url) : null,
        });
      }
    });
  }

  // Fetch product counts by category
  const { data: rawCategoryCounts } = await supabase.from("categories").select(`
    id,
    name,
    (
      select count(*)
      from products
      where products.category_id = categories.id
    ) as product_count
  `);

  // Process and type-cast category counts
  const categoryCounts: CategoryCount[] = [];
  if (rawCategoryCounts) {
    // Use type assertion to get around TypeScript errors
    rawCategoryCounts.forEach((rawItem: any) => {
      if (rawItem && typeof rawItem === "object" && "id" in rawItem) {
        categoryCounts.push({
          id: Number(rawItem.id),
          name: String(rawItem.name || ""),
          product_count: Number(rawItem.product_count || 0),
        });
      }
    });
  }

  // Create a map for quick lookup of product counts by category ID
  const categoryCountsMap: Record<number, number> = {};
  for (const category of categoryCounts) {
    categoryCountsMap[category.id] = category.product_count;
  }

  // Get featured categories (those with most products)
  const featuredCategories = [...categoryCounts]
    .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
    .slice(0, 4);

  // Get featured products for the page
  const { data: rawFeaturedProducts } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      base_price,
      image_url,
      in_stock,
      brands (name),
      (select count(*) from product_variants where product_id = products.id) as variant_count
    `
    )
    .order("created_at", { ascending: false })
    .limit(4);

  // Process and type-cast featured products
  const validFeaturedProducts: FeaturedProduct[] = [];
  if (rawFeaturedProducts) {
    // Use type assertion to get around TypeScript errors
    rawFeaturedProducts.forEach((rawItem: any) => {
      if (rawItem && typeof rawItem === "object" && "id" in rawItem) {
        validFeaturedProducts.push({
          id: Number(rawItem.id),
          name: String(rawItem.name || ""),
          base_price: Number(rawItem.base_price || 0),
          image_url: rawItem.image_url ? String(rawItem.image_url) : null,
          in_stock: Boolean(rawItem.in_stock),
          brands: rawItem.brands
            ? { name: String(rawItem.brands.name || "") }
            : null,
          variant_count: Number(rawItem.variant_count || 0),
        });
      }
    });
  }

  return (
    <>
      {/* Hero section with overlay text */}
      <div className='relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-r from-blue-600 to-violet-700'>
        {featuredCategories && featuredCategories.length > 0 && categories && (
          <Image
            src={
              categories.find((c) => c.id === featuredCategories[0].id)
                ?.image_url || "/images/categories-hero.jpg"
            }
            alt='Product Categories'
            fill
            className='object-cover mix-blend-overlay opacity-60'
            priority
          />
        )}
        <div className='absolute inset-0 flex flex-col justify-center items-center text-white p-4 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg'>
            {t("navigation.categories") || "Product Categories"}
          </h1>
          <p className='text-xl md:text-2xl max-w-2xl drop-shadow-md'>
            {t("categories.description") || "Browse our products by category"}
          </p>
        </div>
      </div>

      <div className='container mx-auto px-4 py-12'>
        {/* Categories Grid */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12'>
          {categories?.map((category) => (
            <Link
              href={`/categories/${category.id}`}
              key={category.id}
              className='block'
            >
              <Card className='h-full hover:shadow-md transition-shadow'>
                <CardHeader className='pb-2'>
                  <div className='flex justify-center mb-4'>
                    <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600'>
                      {/* Use mapped icon or default */}
                      {categoryIcons[category.name] || (
                        <div className='w-12 h-12 relative'>
                          {category.image_url ? (
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              fill
                              className='object-contain'
                            />
                          ) : (
                            <div>📦</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className='text-center'>{category.name}</CardTitle>
                </CardHeader>
                <CardContent className='text-center pt-0'>
                  <CardDescription>
                    {categoryCountsMap[category.id] || 0}{" "}
                    {t("categories.productCount")}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Featured Products Section */}
        {validFeaturedProducts && validFeaturedProducts.length > 0 && (
          <div className='mt-12'>
            <h2 className='text-2xl font-bold mb-6'>
              {t("categories.featuredProducts")}
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {validFeaturedProducts.map((product) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className='block'
                >
                  <Card className='h-full hover:shadow-md transition-shadow overflow-hidden'>
                    <div className='aspect-square relative'>
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                    <CardContent className='p-4'>
                      <h3 className='font-medium truncate'>{product.name}</h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        {product.brands?.name}
                      </p>
                      <p className='font-bold text-blue-700'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.base_price)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
