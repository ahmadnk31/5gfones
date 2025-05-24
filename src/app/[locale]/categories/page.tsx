import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Tablet, Laptop, Headphones, Tv, Watch, Package } from "lucide-react";

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

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSEOMetadata({
    pageType: "category" as any,
    locale: params.locale,
    customTitle: await (await getTranslations({ locale: params.locale, namespace: "seo" }))("categories.title"),
    customDescription: await (await getTranslations({ locale: params.locale, namespace: "seo" }))("categories.description"),
    customKeywords: [await (await getTranslations({ locale: params.locale, namespace: "seo" }))("categories.keywords")],
  });
}

export default async function CategoriesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  // Define types needed for the page
  type Category = {
    id: number;
    name: string;
    image_url: string | null;
    description?: string;
    parent_id?: number | null;
  };

  type FeaturedProduct = {
    id: number;
    name: string;
    base_price: number;
    image_url: string | null;
    in_stock: boolean;
    description?: string;
    category_id: number;
    brands: { name: string } | null;
    variant_count: number;
  };
  // Fetch all categories with enhanced data
const { data: rawCategories, error: categoriesError } = await supabase
  .from("categories")
  .select(`
    id,
    name,
    image_url,
    parent_id,
    products (count)
  `)
  .order("name", { ascending: true });

if (categoriesError) {
  console.error('Error fetching categories:', categoriesError);
  throw new Error('Failed to fetch categories');
}
  // Process and type-cast categories with enhanced data
  console.log('Raw categories from Supabase:', rawCategories);
  
  const categories: (Category & { product_count: number })[] = 
    (rawCategories || [])
      .filter((item): item is any => 
        typeof item === "object" && 
        item !== null && 
        "id" in item
      )      .map(item => ({
        id: Number(item.id),
        name: String(item.name || ""),
        image_url: item.image_url ? String(item.image_url) : null,
        product_count: Number(item.products?.[0]?.count || 0),
        description: undefined, // categories don't have descriptions in the schema
        parent_id: item.parent_id ? Number(item.parent_id) : null
      }));
  
  console.log('Processed categories:', categories);
  // Group categories by parent for hierarchical display
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const subCategories = categories.filter(cat => cat.parent_id);
  
  console.log('Top level categories:', topLevelCategories);
  console.log('Sub categories:', subCategories);

  // Get featured products
  const { data: rawFeaturedProducts } = await supabase
    .from("products")
    .select(`
      id, 
      name, 
      base_price,
      image_url,
      in_stock,
      short_description,
      brands (name),
      category_id,
      (select count(*) from product_variants where product_id = products.id) as variant_count
    `)
    .order("created_at", { ascending: false })
    .limit(4);

  // Process featured products
  const validFeaturedProducts = (rawFeaturedProducts || [])
    .filter((item): item is any => 
      typeof item === "object" && 
      item !== null && 
      "id" in item
    )
    .map(item => ({
      id: Number(item.id),
      name: String(item.name || ""),
      description: item.short_description ? String(item.short_description) : "",
      base_price: Number(item.base_price || 0),
      image_url: item.image_url ? String(item.image_url) : null,
      in_stock: Boolean(item.in_stock),
      category_id: Number(item.category_id),
      brands: item.brands ? { name: String(item.brands.name || "") } : null,
      variant_count: Number(item.variant_count || 0)
    }));

  return (
    <>
      {/* Hero section with improved styling */}
      <div className='relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-r from-blue-600 to-violet-700'>
        <Image
          src={topLevelCategories[0]?.image_url || "/images/categories-hero.jpg"}
          alt='Product Categories'
          fill
          className='object-cover mix-blend-overlay opacity-60'
          priority
        />
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
        {/* Categories Grid with improved card design */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12'>
          {topLevelCategories.map((category) => (
            <Link
              href={`/categories/${category.id}`}
              key={category.id}
              className='block group'
            >
              <Card className='h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden'>
                <CardHeader className='pb-4'>
                  <div className='flex justify-center mb-4 relative h-40'>
                    {category.image_url ? (
                      <div className='absolute inset-0 group-hover:scale-110 transition-transform duration-500'>
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className='object-cover rounded-t-lg'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                      </div>
                    ) : (
                      <div className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110'>
                        {categoryIcons[category.name] || <Package className="w-12 h-12" />}
                      </div>
                    )}
                  </div>
                  <CardTitle className='text-center text-xl mb-2'>{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className='text-center text-sm line-clamp-2'>
                      {category.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className='text-center pb-4'>
                  <div className='flex items-center justify-center gap-2 text-sm font-medium text-blue-600'>
                    <span className='text-2xl font-bold'>{category.product_count}</span>
                    <span className='text-gray-600'>{t("categories.productCount")}</span>
                  </div>
                  {/* Sub-categories if any */}
                  {subCategories.filter(sub => sub.parent_id === category.id).length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1 justify-center'>
                      {subCategories
                        .filter(sub => sub.parent_id === category.id)
                        .slice(0, 3)
                        .map(sub => (
                          <span key={sub.id} className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                            {sub.name}
                          </span>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Featured Products Section with improved card design */}
        {validFeaturedProducts.length > 0 && (
          <div className='mt-12'>
            <h2 className='text-2xl font-bold mb-6'>
              {t("categories.featuredProducts")}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {validFeaturedProducts.map((product) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className='block group'
                >
                  <Card className='h-full hover:shadow-lg transition-all duration-300 overflow-hidden'>
                    <div className='aspect-square relative overflow-hidden'>
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-110'
                      />
                      {!product.in_stock && (
                        <div className='absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded'>
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <CardContent className='p-4'>
                      <h3 className='font-medium text-lg mb-1 line-clamp-1'>{product.name}</h3>
                      {product.description && (
                        <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                          {product.description}
                        </p>
                      )}
                      <div className='flex items-center justify-between mt-2'>
                        <p className='font-bold text-blue-700'>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(product.base_price)}
                        </p>
                        {product.variant_count > 0 && (
                          <span className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full'>
                            {product.variant_count} variants
                          </span>
                        )}
                      </div>
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
