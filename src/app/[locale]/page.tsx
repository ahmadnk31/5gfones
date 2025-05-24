import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Carousel, Card } from "@/components/ui/apple-card-carousel";
import BannerCarousel from "@/components/banner-carousel";
import HomepageBanner from "@/components/homepage-banner";
import { formatCurrency } from "@/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Metadata } from "next";
import { generateSEOMetadata, PageType } from "@/lib/seo";

// Generate metadata for the homepage
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSEOMetadata({
    pageType: PageType.HOME,
    locale,
  });
}

interface RepairService {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  base_price: number;
}

// Helper function to get CSS class for phone color
function getColorClass(color: string | null | undefined): string {
  if (!color) return "bg-gray-400";
  
  const colorLower = color.toLowerCase();
  
  if (colorLower.includes("black")) return "bg-gray-900";
  if (colorLower.includes("white")) return "bg-gray-100 border border-gray-300";
  if (colorLower.includes("blue")) return "bg-blue-500";
  if (colorLower.includes("red")) return "bg-red-500";
  if (colorLower.includes("green")) return "bg-green-500";
  if (colorLower.includes("purple")) return "bg-purple-500";
  if (colorLower.includes("gold")) return "bg-yellow-500";
  if (colorLower.includes("yellow")) return "bg-yellow-400";
  if (colorLower.includes("silver")) return "bg-gray-300";
  if (colorLower.includes("pink")) return "bg-pink-400";
  if (colorLower.includes("orange")) return "bg-orange-500";
  
  return "bg-gray-400";
};

export default async function Home() {
  const t = await getTranslations()
  const supabase = createClient();

  // Fetch repair services first
  const { data: repairServices } = await supabase
    .from("repair_services")
    .select("*")
    .order("base_price", { ascending: true })
    .limit(8);

  // Fetch featured products
  const { data: featuredProducts } = await supabase
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
    .limit(8);

  // Fetch trending products (using in_stock as a proxy for popularity)
  const { data: trendingProducts } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      base_price as price,
      image_url,
      in_stock as stock,
      brands (name),
      (select count(*) from product_variants where product_id = products.id) as has_variants
    `
    )
    .order("in_stock", { ascending: false })
    .limit(6);

  // Fetch refurbished products (if table exists)
  const { data: refurbishedProducts, error: refurbishedError } = await supabase
    .from("refurbished_products")
    .select(
      `
      id,
      name,
      description,
      condition,
      refurbished_price,
      original_price,
      discount_percentage,
      warranty_months,
      in_stock,
      image_url,
      brands (id, name)
    `
    )
    .order("discount_percentage", { ascending: false })
    .eq("is_featured", true)
    .limit(4);
  // Fetch refurbished product images (if available)
  let refurbishedImages: { [key: string]: string } = {};
  if (refurbishedProducts && refurbishedProducts.length > 0) {
    const { data: images } = await supabase
      .from("refurbished_product_images")
      .select("refurbished_product_id, image_url")
      .in(
        "refurbished_product_id",
        refurbishedProducts.map((p) => p.id)
      )
      .eq("is_primary", true);

    if (images) {
      images.forEach((img) => {
        refurbishedImages[img.refurbished_product_id] = img.image_url;
      });
    }
  }
  // Try to get trade-in data either from trade_in_prices or device_models tables
  let phoneTradeIns: any[] = [],
    tradeInError = null;

  // First try trade_in_prices table, which is the most accurate data
  const { data: priceData, error: priceErr } = await supabase
    .from("trade_in_prices")
    .select(
      `
      id,
      device_model_id,
      base_price,
      storage_capacity,
      color,
      device_models:device_model_id (
        id,
        name,
        image_url,
        device_series (
          id,
          name,
          device_type_id,
          device_types:device_type_id (
            name,
            brand_id,
            device_brands:brand_id (name)
          )
        )
      )
    `
    )
    .order("base_price", { ascending: false })
    .limit(4);

  if (priceData && priceData.length > 0) {
    // Use trade_in_prices data
    phoneTradeIns = priceData;
  } else {
    // Try phone_trade_ins as second option
    const { data: tradeInData, error: tradeInErr } = await supabase
      .from("phone_trade_ins")
      .select(
        `
        id, 
        device_model_id,
        storage_capacity,
        color,
        offered_value,
        device_models (
          id,
          name,
          image_url,
          device_series (
            name,
            device_types (
              name,
              device_brands (name)
            )
          )
        )
      `
      )
      .eq("status", "approved")
      .order("offered_value", { ascending: false })
      .limit(4);

    if (tradeInData && tradeInData.length > 0) {
      phoneTradeIns = tradeInData;
    } else {
      // If no data from either table, try fetching popular device models directly
      const { data: deviceModels, error: deviceErr } = await supabase
        .from("device_models")
        .select(
          `
          id, 
          name, 
          image_url,
          device_series (
            name,
            device_types:device_type_id (
              name,
              device_brands:brand_id (name)
            )
          )
        `
        )
        .limit(4);

      if (deviceModels && deviceModels.length > 0) {
        // Create trade-in entries with dummy values for display purposes
        phoneTradeIns = deviceModels.map((model, index) => {
          // Use hardcoded storage options since there's no translation key available
          const storageOptions = ["64GB", "128GB", "256GB", "512GB"];
          
          // Use hardcoded color options since there's no translation key available
          const colorOptions = ["Black", "Silver", "Gold", "Blue", "Gray"];
          
          // Calculate a more realistic trade-in value based on model index and storage
          const storageIndex = index % storageOptions.length;
          const storageCapacity = storageOptions[storageIndex];
          // Base price increases with storage size (base * storage multiplier)
          const baseValue = 100 + (storageIndex * 75);
          
          return {
            id: model.id,
            device_model_id: model.id,
            // Generate a consistent price in a realistic range
            offered_value: baseValue,
            // Select a storage option based on model index for consistency
            storage_capacity: storageCapacity,
            // Select a color option based on model index for consistency
            color: colorOptions[index % colorOptions.length] || colorOptions[0],
            device_models: model,
          };
        });
      }

      tradeInError = deviceErr || tradeInErr || priceErr;
    }
  }

  // Fetch featured categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, image_url")
    .is("parent_id", null)
    .limit(6);

  // Fetch device brands for the brands section
  // Define device brand type
  type DeviceBrand = {
    id: number;
    name: string;
    image_url: string | null;
  };

  // First try device_brands table
  const { data: rawDeviceBrands } = await supabase
    .from("device_brands")
    .select("id, name, image_url")
    .order("name", { ascending: true })
    .limit(8);

  // Fallback to brands table if no results
  let deviceBrands: DeviceBrand[] = [];
console.log("Device Brands:", rawDeviceBrands);
console.log("phoneTradeIns:", phoneTradeIns);

  if (rawDeviceBrands && rawDeviceBrands.length > 0) {
    // Filter and safely type the device brands
    deviceBrands = rawDeviceBrands
      .filter(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          !("error" in item) &&
          "id" in item
      )
      .map((item) => ({
        id: typeof item.id === "number" ? item.id : Number(item.id),
        name: String(item.name || ""),
        image_url: item.image_url as string | null,
      }));
  } else {
    // Fallback to brands table
    const { data: rawBrands } = await supabase
      .from("brands")
      .select("id, name, image_url")
      .order("name", { ascending: true })
      .limit(8);

    if (rawBrands && rawBrands.length > 0) {
      deviceBrands = rawBrands
        .filter(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            !("error" in item) &&
            "id" in item
        )
        .map((item) => ({
          id: typeof item.id === "number" ? item.id : Number(item.id),
          name: String(item.name || ""),
          image_url: item.image_url as string | null,
        }));
    }
  }

  // Fetch latest mobile devices (for "Latest Devices" carousel)
  const { data: latestDevices } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      base_price,
      image_url,
      in_stock,
      brands (id, name, image_url)
    `
    )
    .eq("is_repair_part", false)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch repair services (for "Premium Services" carousel)
  const { data: repairServicesPremium } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      base_price,
      image_url
    `
    )
    .eq("is_repair_part", true)
    .order("in_stock", { ascending: false })
    .limit(4);
    console.log("repairParts:", repairServicesPremium);  return (
    <main>
      {/* HomepageBanner: Conditionally shows Banner Carousel or Default Hero */}
      <HomepageBanner 
        tagline="Get the latest 5G devices and accessories" 
        subtitle="Your premier destination for cutting-edge 5G technology and accessories"
        buttonLabel={t("navigation.products")}
      />
      {/* Main Services Section */}
      <section className='py-12 md:py-20'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <h2 className='text-2xl md:text-4xl font-bold mb-8 text-center'>
            {t("app.carousel.title")}
          </h2>
          <Carousel
            items={[
              <Card
                key='1'
                card={{
                  src: "/images/phone-screen-repair.png",
                  title: t("app.carousel.phoneRepair.title") || "Phone Screen Repair",
                  category: t("app.carousel.phoneRepair.category") || "Repair Service",
                  content: (
                    <div className='space-y-4'>
                      <p className='text-lg text-gray-700'>
                        {t("app.carousel.phoneRepair.description") || "Professional screen repair service for all phone models"}
                      </p>                      <Link href='/repair'>
                        <Button className='flex items-center gap-2'>
                          {t("app.carousel.phoneRepair.button") || "Book Repair"}
                          <IconArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  ),
                }}
                index={0}
              />,
              <Card
                key='2'
                card={{
                  src: "/images/battery-replacement.png",
                  title: t("app.carousel.batteryReplacement.title"),
                  category: t("app.carousel.batteryReplacement.category"),
                  content: (
                    <div className='space-y-4'>
                      <p className='text-lg text-gray-700'>
                        {t("app.carousel.batteryReplacement.description")}
                      </p>
                      <Link href='/repair/services'>
                        <Button className='flex items-center gap-2'>
                          {t("app.carousel.batteryReplacement.button")}
                          <IconArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  ),
                }}
                index={1}
              />,
              <Card
                key='3'
                card={{
                  src: "/images/sell-old-phone.png",
                  title: t("app.carousel.tradeIn.title"),
                  category: t("app.carousel.tradeIn.category"),
                  content: (
                    <div className='space-y-4'>
                      <p className='text-lg text-gray-700'>
                        {t("app.carousel.tradeIn.description")}
                      </p>                      <Link href="/sell-phone">
                        <Button className='flex items-center gap-2'>
                          {t("app.carousel.tradeIn.button")}
                          <IconArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  ),
                }}
                index={2}
              />,
              <Card
                key='4'
                card={{
                  src: "/accessories.jpg",
                  title: t("app.carousel.accessories.title"),
                  category: t("app.carousel.accessories.category"),
                  content: (
                    <div className='space-y-4'>
                      <p className='text-lg text-gray-700'>
                        {t("app.carousel.accessories.description")}
                      </p>
                      <Link href='/products'>
                        <Button className='flex items-center gap-2'>
                          {t("app.carousel.accessories.button")}
                          <IconArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  ),
                }}
                index={3}
              />,
            ]}
          />
        </div>
      </section>
      {/* Repair Services Grid - New Section */}
      {repairServices && repairServices.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              {t("app.repairServices.title") || "Our Repair Services"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {repairServices.map((service: RepairService) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-20 h-20 mb-4 relative">
                    <Image
                      src={service.image_url || "/images/placeholder-repair.png"}
                      alt={service.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 80px) 100vw, 80px"
                      priority={true}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>                  <p className="text-xl font-bold text-emerald-600 mb-4">
                    {formatCurrency(service.base_price)}
                  </p>
                  <Link href={`/repair/services/${service.id}`}>
                    <Button variant="outline" className="w-full">
                      {t("common.bookNow") || "Book Now"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Device Brands Section */}
      <section className='py-12 md:py-16 bg-gray-50'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <h2 className='text-2xl md:text-3xl font-bold mb-8 text-center'>
            {t("app.deviceBrands.title")}
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {deviceBrands && deviceBrands.length > 0 ? (
              deviceBrands.map((brand) => (
                <div
                  key={brand.id}
                  className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow'
                >
                  <Image
                    src={brand.image_url || "/images/placeholder-brand.png"}
                    alt={brand.name}
                    width={80}
                    height={80}
                    className='mb-4 object-contain'
                  />
                  <h3 className='text-lg font-medium'>{brand.name}</h3>
                </div>
              ))
            ) : (
              // Fallback to hardcoded brands if none found in database
              <>
                <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow'>
                  <Image
                    src='/images/apple-logo.png'
                    alt='Apple'
                    width={80}
                    height={80}
                    className='mb-4'
                  />
                  <h3 className='text-lg font-medium'>Apple</h3>
                </div>
                <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow'>
                  <Image
                    src='/images/samsung-logo.png'
                    alt='Samsung'
                    width={80}
                    height={80}
                    className='mb-4'
                  />
                  <h3 className='text-lg font-medium'>Samsung</h3>
                </div>
                <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow'>
                  <Image
                    src='/images/google-logo.png'
                    alt='Google'
                    width={80}
                    height={80}
                    className='mb-4'
                  />
                  <h3 className='text-lg font-medium'>Google</h3>
                </div>
                <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow'>
                  <Image
                    src='/images/xiaomi-logo.png'
                    alt='Xiaomi'
                    width={80}
                    height={80}
                    className='mb-4'
                  />
                  <h3 className='text-lg font-medium'>Xiaomi</h3>
                </div>
              </>
            )}
          </div>
          <div className='mt-8 text-center'>
            <Link href='/repair/brands'>
              <Button
                variant='outline'
                className='flex items-center gap-2 mx-auto'
              >
                {t("app.deviceBrands.viewAll")}
                <IconArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* New Products Carousel Section */}
      {latestDevices && latestDevices.length > 0 && (
        <section className='py-12 md:py-20'>
          <div className='container mx-auto px-4 max-w-7xl'>
            <h2 className='text-2xl md:text-4xl font-bold mb-8 text-center'>
              {t("app.latestDevices.title")}
            </h2>
            <Carousel
              items={latestDevices.map((device, index) => (
                <Card
                  key={`device-${device.id}`}
                  card={{
                    src: device.image_url || "/placeholder.svg",
                    title: device.name,
                    category:
                      (device.brands && device.brands[0]?.name) ||
                      t("app.latestDevices.iphone.category"),
                    content: (
                      <div className='space-y-4'>
                        <p className='text-lg text-gray-700'>
                          {device.description ||
                            (index === 0
                              ? t("app.latestDevices.iphone.description")
                              : index === 1
                              ? t("app.latestDevices.samsung.description")
                              : index === 2
                              ? t("app.latestDevices.pixel.description")
                              : t("app.latestDevices.xiaomi.description"))}
                        </p>
                        <div className='flex items-center justify-between'>
                          <span className='text-xl font-bold'>
                            ${device.base_price}
                          </span>
                          <Link href={`/products/${device.id}`}>
                            <Button className='flex items-center gap-2'>
                              {t("common.viewDetails")}
                              <IconArrowRight size={16} />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ),
                  }}
                  index={index}
                />
              ))}
            />
          </div>
        </section>
      )}

      {/* Refurbished Products Section */}
      {refurbishedProducts && refurbishedProducts.length > 0 && (
        <section className='py-12 md:py-20'>
          <div className='container mx-auto px-4 max-w-7xl'>
            <div className='text-center mb-10'>
              <h2 className='text-2xl md:text-4xl font-bold mb-4'>
                {t("app.refurbished.title")}
              </h2>
              <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
                {t("app.refurbished.description")}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {refurbishedProducts.map((product) => (
                <div
                  key={product.id}
                  className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300'
                >
                  <div className='relative'>
                    <Image
                      src={
                        refurbishedImages[product.id] ||
                        product.image_url ||
                        "/images/placeholder-product.png"
                      }
                      alt={product.name}
                      width={400}
                      height={300}
                      className='w-full h-48 object-cover'
                    />
                    {product.discount_percentage && (
                      <div className='absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md'>
                        {product.discount_percentage}% OFF
                      </div>
                    )}
                    {product.condition && (
                      <div className='absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md'>
                        {product.condition}
                      </div>
                    )}
                  </div>

                  <div className='p-4'>
                    {product.name && (
                      <h3 className='text-lg font-semibold line-clamp-2 mb-1'>
                        {product.name}
                      </h3>
                    )}
                    {product.brands && product.brands[0]?.name && (
                      <p className='text-gray-500 text-sm mb-3'>
                        {product.brands[0].name}
                      </p>
                    )}

                    {(product.refurbished_price || product.original_price) && (
                      <div className='flex items-center justify-between mb-3'>
                        <div>
                          {product.refurbished_price && (                            <span className='text-xl font-bold text-emerald-700'>
                              {formatCurrency(product.refurbished_price)}
                            </span>
                          )}
                          {product.original_price && (
                            <span className='text-sm text-gray-500 line-through ml-2'>
                              {formatCurrency(product.original_price)}
                            </span>
                          )}
                        </div>
                        {product.warranty_months && (
                          <span className='text-sm text-green-600 font-medium'>
                            {product.warranty_months} {t("app.warranty.months")}
                          </span>
                        )}
                      </div>
                    )}

                    <Link href={`/refurbished/${product.id}`}>
                      <Button className='w-full'>{t("common.viewDetails")}</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-8 text-center'>
              <Link href='/refurbished'>
                <Button
                  variant='outline'
                  className='flex items-center gap-2 mx-auto'
                >
                  {t("app.refurbished.viewAll")}
                  <IconArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* Repair Services Section */}
      <section className='py-12 md:py-20 bg-blue-50'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <div className='text-center mb-10'>
            <h2 className='text-2xl md:text-4xl font-bold mb-4'>
              {t("app.services.title")}
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {t("app.services.description")}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10'>
            {repairServicesPremium && repairServicesPremium.map((service) => (
              <div
                key={service.id}
                className='bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px]'
              >
                <div className='flex items-start'>                  <div className='bg-emerald-100 p-3 rounded-full mr-4'>
                    <Image
                      src={service.image_url || "/images/repair-service.png"}
                      alt={service.name}
                      width={44}
                      height={44}
                      className='text-emerald-600'
                    />
                  </div>
                  <div>
                    <h3 className='text-xl font-semibold mb-2'>
                      {service.name}
                    </h3>
                  
                    <div className='flex items-center text-sm text-gray-500 mb-4'>
                      <span className='flex items-center mr-4'>
                        <svg                          className='w-4 h-4 mr-1 text-emerald-500'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                        {t("app.services.time")}
                      </span>
                      <span className='flex items-center'>
                        <svg
                          className='w-4 h-4 mr-1 text-green-500'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                          />
                        </svg>
                        {t("app.services.warranty")}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>                      <span className='text-lg font-bold text-blue-600'>
                        {formatCurrency(service.base_price)}
                      </span>
                      <Link href={`/repair/schedule?repairPartId=${service.id}`}>
                        <Button
                          variant='outline'
                          className='flex items-center gap-2'
                        >
                          {t("app.services.book")}{" "}
                          <IconArrowRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className='text-center'>
            <Link href='/repair/services'>
              <Button size='lg' className='flex items-center gap-2 mx-auto'>
                {t("app.services.viewAll")}
                <IconArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Trade-In Value Calculator Section */}
      {phoneTradeIns && phoneTradeIns.length > 0 && (
        <section className='py-12 md:py-20 bg-gradient-to-br from-blue-50 to-gray-100'>
          <div className='container mx-auto px-4 max-w-7xl'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-center'>
              <div>
                <h2 className='text-2xl md:text-4xl font-bold mb-4'>
                  {t("app.tradeIn.title")}
                </h2>
                <p className='text-lg text-gray-700 mb-6'>
                  {t("app.tradeIn.description")}
                </p>

                {/* Feature list */}
                <ul className='space-y-3 mb-8'>
                  <li className='flex items-start gap-3'>
                    <div className='bg-green-100 p-1 rounded-full mt-1'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                    <span className='text-gray-700'>
                      {t("app.tradeIn.feature1")}
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <div className='bg-green-100 p-1 rounded-full mt-1'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                    <span className='text-gray-700'>
                      {t("app.tradeIn.feature2")}
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <div className='bg-green-100 p-1 rounded-full mt-1'>
                      <svg
                        className='w-4 h-4 text-green-600'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    </div>
                    <span className='text-gray-700'>
                      {t("app.tradeIn.feature3")}
                    </span>
                  </li>                </ul>                <Link href="/sell-phone">
                  <Button size='lg' className='flex items-center gap-2'>
                    {t("app.tradeIn.cta")}
                    <IconArrowRight size={18} />
                  </Button>
                </Link>
              </div>

              {/* Top trade-in items grid */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>
                  {t("app.tradeIn.topPrices")}
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {phoneTradeIns.map((phone) => (
                    <div
                      key={phone.id}
                      className='bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all'
                    >
                      <div className='flex items-start gap-4'>
                        <Image
                          src={phone.device_models?.image_url || '/images/placeholder-phone.png'}
                          alt={phone.device_models?.name || t("app.tradeIn.device")}
                          width={80}
                          height={80}
                          className='rounded-lg object-cover'
                        />
                        <div>
                          {phone.device_models?.name && (
                            <h4 className='font-semibold mb-1'>
                              {phone.device_models.name}
                            </h4>
                          )}
                          {(phone.storage_capacity || phone.color) && (
                            <p className='text-sm text-gray-600 mb-2'>
                              {[phone.storage_capacity, phone.color].filter(Boolean).join(' • ')}
                            </p>
                          )}
                          <div className='flex items-center gap-2'>
                            <span className='text-lg font-bold text-green-600'>
                              {formatCurrency(phone.base_price || phone.offered_value)}
                            </span>
                            <span className='text-sm text-gray-500'>
                              {t("app.tradeIn.estimate.value")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Testimonials Section */}
      {/* ... existing code ... */}
      {/* Product Categories Grid Section */}
      {categories && categories.length > 0 && (
        <section className='py-12 md:py-20 bg-gray-50'>
          <div className='container mx-auto px-4 max-w-7xl'>
            <div className='text-center mb-10'>
              <h2 className='text-2xl md:text-4xl font-bold mb-4'>
                {t("app.categories.title")}
              </h2>
              <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                {t("app.categories.description")}
              </p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
              {categories.map((category) => (
                <Link
                  key={`category-${category.id}`}
                  href={`/categories/${category.id}`}
                >
                  <div className='bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-all hover:bg-blue-50 text-center h-full'>
                    <div className='w-16 h-16 mb-3 flex items-center justify-center'>
                      <Image
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        width={64}
                        height={64}
                        className='object-contain'
                      />
                    </div>
                    <h3 className='text-md font-medium'>{category.name}</h3>
                  </div>
                </Link>
              ))}
            </div>

            <div className='text-center mt-10'>
              <Link href='/categories'>
                <Button
                  variant='outline'
                  size='lg'
                  className='flex items-center gap-2 mx-auto'
                >
                  {t("app.categories.viewAll")} <IconArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className='py-12'>
          <div className='container mx-auto px-4 max-w-6xl'>
            <div className='flex flex-col md:flex-row justify-between items-center mb-8'>
              <div>
                <h2 className='text-2xl md:text-3xl font-bold'>{t("app.featuredProducts.title")}</h2>
                <p className='text-gray-600 mt-2'>
                  {t("app.featuredProducts.description")}
                </p>
              </div>
              <Link
                href='/products'
                className='mt-4 md:mt-0 text-blue-600 hover:underline flex items-center'
              >
                {t("app.featuredProducts.viewAll")} <IconArrowRight size={16} className='ml-1' />
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {" "}
              {featuredProducts &&
                featuredProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.base_price}
                    imageUrl={product.image_url || "/placeholder.svg"}
                    inStock={product.in_stock}
                    hasVariants={product.variant_count > 0}
                    brandName={product.brands?.name || ""}
                  />
                ))}
            </div>
          </div>
        </section>
      )}
      {/* Trade-In Section */}
      {phoneTradeIns && phoneTradeIns.length > 0 && (
        <section className='py-12 md:py-20 bg-gradient-to-r from-green-50 to-blue-50'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <div className='text-center mb-10'>
            <h2 className='text-2xl md:text-4xl font-bold mb-4'>
              {t("app.tradeIn.title")}
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {t("app.tradeIn.description")}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
              <div className='h-48 bg-green-100 flex items-center justify-center'>
                <Image
                  src='/images/sell-old-phone.png'
                  alt='Sell your phone'
                  width={500}
                  height={500}
                  className='object-cover w-full h-full'
                />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-bold mb-3'>
                  {t("app.tradeIn.sell.title")}
                </h3>
                <p className='text-gray-600 mb-4'>
                  {t("app.tradeIn.sell.description")}
                </p>                <Link href='/sell-phone'>
                  <Button className='w-full flex items-center justify-center gap-2'>
                    {t("app.tradeIn.quoteButton")} <IconArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
              <div className='h-48 bg-blue-100 flex items-center justify-center'>
                <Image
                  src='/images/upgrade-device.png'
                  alt='Upgrade your device'
                  width={500}
                  height={500}
                  className='object-contain'
                />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-bold mb-3'>
                  {t("app.tradeIn.upgrade.title")}
                </h3>
                <p className='text-gray-600 mb-4'>
                  {t("app.tradeIn.upgrade.description")}
                </p>                <Link href='/sell-phone/upgrade'>
                  <Button className='w-full flex items-center justify-center gap-2'>
                    {t("app.tradeIn.upgradeButton")}{" "}
                    <IconArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
              <div className='h-48 bg-purple-100 flex items-center justify-center'>
                <Image
                  src='/images/services/recycle-device.png'
                  alt='Recycle devices'
                  width={200}
                  height={200}
                  className='object-contain'
                />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-bold mb-3'>
                  {t("app.tradeIn.recycle.title")}
                </h3>
                <p className='text-gray-600 mb-4'>
                  {t("app.tradeIn.recycle.description")}
                </p>
                <Link href='/sell-phone/recycle'>
                  <Button
                    variant='outline'
                    className='w-full flex items-center justify-center gap-2'
                  >
                    {t("app.tradeIn.recycle.learnMore")} <IconArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Phone Trade-In Value Carousel */}
          {phoneTradeIns && phoneTradeIns.length > 0 && !tradeInError && (
            <>
              <h3 className='text-xl font-bold mb-6 text-center'>
                {t("app.tradeIn.topPrices")}
              </h3>
              <Carousel
                items={phoneTradeIns.map((tradeIn, index) => (
                  <Card
                    key={`trade-${tradeIn.id}`}
                    card={{
                      src:
                        tradeIn.device_models?.image_url ||
                        "/images/sell-old-phone.png",
                      title:
                        tradeIn.device_models?.name ||
                        t("app.tradeIn.sell.title"),
                      category: (() => {
                        // Get brand name if available
                        const brandName =
                          tradeIn.device_models?.device_series?.device_types
                            ?.device_brands?.name ||
                          tradeIn.device_models?.device_series
                            ?.device_types?.[0]?.device_brands?.[0]?.name;

                        // Get series name
                        const seriesName =
                          tradeIn.device_models?.device_series?.name;

                        // Format storage if available
                        const storage = tradeIn.storage_capacity
                          ? `${tradeIn.storage_capacity}`
                          : "";

                        if (brandName && seriesName) {
                          return `${brandName} ${seriesName}${
                            storage ? ` · ${storage}` : ""
                          }`;
                        } else if (seriesName) {
                          return `${seriesName}${
                            storage ? ` · ${storage}` : ""
                          }`;
                        } else {
                          return storage || t("app.tradeIn.sell.category");
                        }
                      })(),
                      content: (
                        <div className='space-y-4'>
                          <div className='flex flex-col gap-2'>
                            {/* Device details - storage and color */}
                            <div className='flex items-center text-sm text-gray-600'>
                              {tradeIn.storage_capacity && (
                                <span className='inline-flex items-center mr-3'>
                                  <svg
                                    className='w-4 h-4 mr-1'
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3'
                                    />
                                  </svg>
                                  {tradeIn.storage_capacity}
                                </span>
                              )}
                              {tradeIn.color && (
                                <span className='inline-flex items-center'>
                                  <span
                                    className={`w-3 h-3 mr-1 rounded-full ${getColorClass(tradeIn.color)}`}
                                  ></span>
                                  {tradeIn.color}
                                </span>
                              )}
                            </div>

                            {/* Price and button */}
                            <div className='flex items-center justify-between'>
                              <div className='flex flex-col'>
                                <span className='text-xl font-bold'>
                                  ${tradeIn.offered_value || tradeIn.base_price}
                                </span>
                                <span className='text-sm text-green-500'>
                                  {t("app.tradeIn.cashOffer")}
                                </span>
                              </div>                              <Link href='/sell-phone'>
                                <Button className='flex items-center gap-2'>
                                  {t("app.tradeIn.sellButton")}
                                  <IconArrowRight size={16} />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ),
                    }}
                    index={index}
                  />
                ))}
              />
            </>
          )}
        </div>
      </section>
      )}
      {/* Trending Products */}
      {trendingProducts && trendingProducts.length > 0 && (
        <section className='py-12 bg-gray-50'>
          <div className='container mx-auto px-4 max-w-6xl'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl md:text-3xl font-bold'>
                {t("app.trendingProducts.title")}
              </h2>
              <Link
                href='/products'
                className='text-blue-600 hover:underline flex items-center gap-2'
              >
                {t("app.trendingProducts.viewAll")}
                <IconArrowRight size={16} />
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6'>
              {trendingProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url || "/placeholder.svg"}
                  inStock={product.stock}
                  hasVariants={Boolean(product.has_variants)}
                  brandName={product.brands?.name || ""}
                />
              ))}
            </div>
          </div>
        </section>
      )}      {/* CTA Banner */}
      <section className='py-12 bg-gradient-to-r from-emerald-600 to-green-700 text-white'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='flex flex-col md:flex-row items-center justify-between'>
            <div className='md:w-2/3 text-center md:text-left mb-6 md:mb-0'>
              {t("app.ctaBanner.title") && (
                <h2 className='text-2xl md:text-3xl font-bold mb-4'>
                  {t("app.ctaBanner.title")}
                </h2>
              )}
              {t("app.ctaBanner.description") && (
                <p className='text-lg mb-6 max-w-2xl opacity-90'>
                  {t("app.ctaBanner.description")}
                </p>
              )}              <Link href='/repair'>
                <Button
                  size='lg'
                  className='px-8 py-3 text-lg bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                >
                  {t("app.ctaBanner.button") || t("common.learnMore")}
                </Button>
              </Link>
            </div>
            <div className='md:w-1/3 flex justify-center'>
              <Image
                src='/images/professional-fixer.png'
                alt={t("app.ctaBanner.imageAlt") || "Professional Repair Service"}
                width={300}
                height={200}
                className='rounded-lg shadow-lg'
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
