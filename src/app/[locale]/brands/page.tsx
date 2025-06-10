import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSEOMetadata({
    pageType: "category" as any,
    locale: params.locale,
    customTitle: await (await getTranslations({ locale: params.locale, namespace: "seo" }))("brands.title"),
    customDescription: await (await getTranslations({ locale: params.locale, namespace: "seo" }))("brands.description"),
    customKeywords: [await (await getTranslations({ locale: params.locale, namespace: "seo" }))("brands.keywords")],
  });
}

export default async function BrandsPage({
  params,
}: {
  params: { locale: string };
}) {  const t = await getTranslations();
  
  
  const supabase = await createClient();
  // Define brand and count types
  type Brand = {
    id: number;
    name: string;
    image_url: string | null;
  };

  type BrandCount = {
    id: number;
    name: string;
    product_count: number;
  };
    // Fetch all brands, making sure to only get regular brands, not device_brands
  const { data: rawBrands } = await supabase
    .from("brands")
    .select("id, name, image_url")
    .order("name", { ascending: true });
    
  // Safely type and filter the brands data
  const brands: Brand[] = (rawBrands || [])
    .filter((item): item is Brand => {
      return (
        typeof item === "object" &&
        item !== null &&
        !("error" in item) &&
        "id" in item &&
        typeof item.id === "number" &&
        "name" in item &&
        typeof item.name === "string"
      );
    });
      // Fetch product counts by brand, excluding repair parts
  const { data: rawBrandCounts } = await supabase.from("brands")
  .select(`
    id,
    name,
    image_url,
    products!inner(id).eq(is_repair_part, false)
  `);
  console.log("Brand counts:", rawBrandCounts);
    // Process brand counts
  const brandCounts: BrandCount[] = (rawBrandCounts || [])
    .filter((item): item is any =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "name" in item &&
      "products" in item
    )
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name),
      product_count: item.products ? item.products.length : 0,
    }));

  const brandCountsMap: Record<number, number> = {};
  for (const brand of brandCounts) {
    brandCountsMap[brand.id] = brand.product_count;
  }

  // Get featured brands (those with most products)
  const featuredBrands = [...brandCounts]
    .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
    .slice(0, 4);

  return (
    <>
      {/* Hero section with theme-matching styling */}
      <div className='relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gradient-to-r from-emerald-600 to-primary/90'>
        <Image
          src={featuredBrands[0]?.id ? `/images/brands/${featuredBrands[0].id}.jpg` : "/images/brands-hero.jpg"}
          alt={t("navigation.brands")}
          fill
          className='object-cover mix-blend-overlay opacity-50'
          priority
        />
        <div className='absolute inset-0 bg-black/10' />
        <div className='absolute inset-0 flex flex-col justify-center items-center text-white p-4 text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg banner-text-shadow'>
            {t("navigation.brands")}
          </h1>
          <p className='text-xl md:text-2xl max-w-2xl drop-shadow-md'>
            {t("brands.description") || "Explore products from top brands"}
          </p>
        </div>
      </div>
      
      <div className='container mx-auto px-4 py-12'>
      {/* Featured Brands */}
      {featuredBrands && featuredBrands.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold mb-6'>{t("brands.featured")}</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {featuredBrands.map((brandData) => {
              const brand = brands.find((b) => b.id === brandData.id);
              if (!brand) return null;
                return (
                <Link
                  href={`/products?brand=${brand.id}`}
                  key={brand.id}
                  className='block group'
                >                  <Card className='h-full transition-all duration-300 hover:shadow-md hover:border-primary/50 hover:scale-[1.02] border-muted/60 shadow-sm'>
                    <CardHeader className='pb-2'>
                      <div className='flex justify-center mb-4 h-24'>
                        {brand.image_url ? (
                          <div className='relative w-full h-full'>
                            <Image
                              src={brand.image_url}
                              alt={brand.name}
                              fill
                              className='object-contain group-hover:scale-105 transition-transform duration-500'
                            />
                          </div>
                        ) : (
                          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold transition-transform group-hover:scale-110 group-hover:bg-primary/20 shadow-sm'>
                            {brand.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <CardTitle className='text-center'>
                        {brand.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='text-center pt-0'>
                      <CardDescription>
                        {brandCountsMap[brand.id] || 0}{" "}
                        {t("brands.productCount") || "Products"}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      
      {/* All Brands */}
      <h2 className='text-2xl font-bold mb-6'>{t("brands.all")}</h2>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>        
        {brands.map((brand) => (
          <Link
            href={`/products?brand=${brand.id}`}
            key={brand.id}
            className='block group'
          >            <Card className='h-full transition-all duration-300 hover:shadow-md hover:border-primary/50 hover:scale-[1.02] border-muted/60 shadow-sm'>
              <CardHeader className='pb-2'>
                <div className='flex justify-center mb-2 h-16'>
                  {brand.image_url ? (
                    <div className='relative w-full h-full'>
                      <Image
                        src={brand.image_url}
                        alt={brand.name}
                        fill
                        className='object-contain group-hover:scale-105 transition-transform duration-500'
                      />
                    </div>
                  ) : (
                    <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-lg font-bold transition-transform group-hover:scale-110'>
                      {brand.name.charAt(0)}
                    </div>
                  )}
                </div>
                <CardTitle className='text-center text-sm'>
                  {brand.name}
                </CardTitle>
              </CardHeader>
              <CardContent className='text-center py-0 px-2'>
                <CardDescription className='text-xs'>
                  {brandCountsMap[brand.id] || 0}{" "}
                  {t("brands.productCount") || "Products"}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </> 
  );
}
