import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BrandsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const locale = params.locale;
  
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

  // Fetch all brands
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
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      image_url: item.image_url
    }));
  // Fetch product counts by brand
  const { data: rawBrandCounts } = await supabase.from("brands")
  .select(`
    id,
    name,
    image_url,
    products (count).eq(is_repair_part, false)
  `)
  console.log("Brand counts:", rawBrandCounts);
  // Process brand counts with proper type checking for the new structure
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
      product_count: item.products && Array.isArray(item.products) ? item.products.length : 0
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
    <div className='container mx-auto px-4 py-12'>
      <h1 className='text-3xl md:text-4xl font-bold mb-6 text-center'>
        {t("navigation.brands") || "Top Device Brands"}
      </h1>
      {/* Featured Brands */}
      {featuredBrands && featuredBrands.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold mb-6'>{t("brands.featured")}</h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {" "}
            {featuredBrands.map((brandData) => {
              const brand = brands.find((b) => b.id === brandData.id);
              if (!brand) return null;              return (
                <Link
                  href={`/products?brand=${brand.id}`}
                  key={brand.id}
                  className='block'
                >
                  <Card className='h-full hover:shadow-md transition-shadow'>
                    <CardHeader className='pb-2'>
                      <div className='flex justify-center mb-4 h-24'>
                        {brand.image_url ? (
                          <div className='relative w-full h-full'>
                            <Image
                              src={brand.image_url}
                              alt={brand.name}
                              fill
                              className='object-contain'
                            />
                          </div>
                        ) : (
                          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold'>
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
                        {t("brands.productCount")}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}{" "}
      {/* All Brands */}
      <h2 className='text-2xl font-bold mb-6'>{t("brands.all")}</h2>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
        {brands
          ?.filter(
            (
              brand
            ): brand is {
              id: number;
              name: string;
              image_url: string | null;
            } =>
              typeof brand === "object" &&
              brand !== null &&
              "id" in brand &&
              "name" in brand
          )
          .map((brand) => (            <Link
              href={`/products?brand=${brand.id}`}
              key={brand.id}
              className='block'
            >
              <Card className='h-full hover:shadow-md transition-shadow'>
                <CardHeader className='pb-2'>
                  <div className='flex justify-center mb-2 h-16'>
                    {brand.image_url ? (
                      <div className='relative w-full h-full'>
                        <Image
                          src={brand.image_url}
                          alt={brand.name}
                          fill
                          className='object-contain'
                        />
                      </div>
                    ) : (
                      <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-lg font-bold'>
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <CardTitle className='text-center text-base'>
                    {brand.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-center pt-0'>
                  <CardDescription className='text-sm'>
                    {brandCountsMap[brand.id] || 0} {t("brands.productCount")}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
