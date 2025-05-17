import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import RepairLayout from "@/components/repair-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function RepairDevicesPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();
  // Get the brand filter from the URL query string
  const brandId = searchParams.brand ? Number(searchParams.brand) : undefined;
  // Fetch all device brands for the filter
  const { data: brands } = await supabase
    .from("device_brands")
    .select("id, name")
    .order("name");

  const { locale } = await params;

  // Prepare the query for device types
  let deviceTypesQuery = supabase
    .from("device_types")
    .select(
      `
      id,
      name,
      image_url,
      brand_id,
      device_brands (
        id,
        name
      )
    `
    )
    .order("name");

  // Apply brand filter if provided
  if (brandId) {
    deviceTypesQuery = deviceTypesQuery.eq("brand_id", brandId);
  }

  // Execute the query
  const { data: deviceTypes } = await deviceTypesQuery;

  // Get the selected brand name if a filter is applied
  let selectedBrandName = "";
  if (brandId && brands) {
    const selectedBrand = brands.find((brand) => brand.id === brandId);
    selectedBrandName = selectedBrand ? selectedBrand.name : "";
  }
  console.log("deviceTypes", deviceTypes);
  return (
    <RepairLayout activeTab='devices'>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        <h1 className='text-3xl font-bold mb-2'>
          {brandId
            ? `${selectedBrandName} Devices`
            : t("deviceTypesPageTitle") || "Device Types We Repair"}
        </h1>
        <p className='text-gray-600 mb-8'>
          {t("deviceTypesPageDescription") ||
            "Select a device type to explore models and repair options"}
        </p>

        {/* Brand Filters */}
        {brands && brands.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-lg font-medium mb-3'>
              {t("filterByBrand") || "Filter by Brand"}
            </h2>
            <Tabs
              defaultValue={brandId?.toString() || "all"}
              className='w-full'
            >
              <TabsList className='h-auto max-w-full overflow-x-auto flex flex-wrap gap-1 pb-1'>
                <Link href={`/${locale}/repair/devices`}>
                  <TabsTrigger
                    value='all'
                    className='data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                  >
                    {t("allBrands") || "All Brands"}
                  </TabsTrigger>
                </Link>
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/${locale}/repair/devices?brand=${brand.id}`}
                  >
                    <TabsTrigger
                      value={brand.id.toString()}
                      className='data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                    >
                      {brand.name}
                    </TabsTrigger>
                  </Link>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Device Types Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {deviceTypes?.map((deviceType) => (
            <Link
              key={deviceType.id}
              href={`/${locale}/repair/models?device=${deviceType.id}`}
              className='hover:opacity-90 transition-opacity'
            >
              <Card className='overflow-hidden border hover:shadow-md transition-shadow h-full'>
                <CardContent className='p-0'>
                  <div className='h-44 bg-gray-100 flex items-center justify-center p-6 relative'>
                    {deviceType.image_url ? (
                      <Image
                        src={deviceType.image_url}
                        alt={deviceType.name}
                        width={150}
                        height={150}
                        className='max-h-full w-auto object-contain'
                        style={{ maxWidth: "100%" }}
                        priority={true}
                      />
                    ) : (
                      <div className='text-gray-500 font-medium text-center'>
                        {deviceType.name}
                      </div>
                    )}
                  </div>{" "}
                  <div className='p-4'>
                    <h3 className='font-medium text-base'>{deviceType.name}</h3>
                    <p className='text-gray-500 text-sm mt-1'>
                      {deviceType.device_brands &&
                      deviceType.device_brands.length > 0
                        ? deviceType?.device_brands[0]?.name
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* No Results Message */}
        {(!deviceTypes || deviceTypes.length === 0) && (
          <div className='text-center py-12 bg-gray-50 rounded-lg'>
            <p className='text-lg text-gray-500'>
              {brandId
                ? `${
                    t("noDevicesForBrand") ||
                    "No devices available for this brand."
                  }`
                : t("noDevicesAvailable") ||
                  "No devices available at the moment."}
            </p>
            <p className='text-sm text-gray-400 mt-2'>
              {t("tryDifferentBrand") ||
                "Try selecting a different brand or check back later."}
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className='mt-16 bg-blue-50 rounded-lg p-6'>
          <h2 className='text-2xl font-bold mb-4'>
            {t("needHelpWithDevice") || "Need help with your device?"}
          </h2>
          <p className='mb-4'>
            {t("repairConsultationDescription") ||
              "If you're unsure about your device or need assistance, our team is here to help. You can:"}
          </p>
          <ul className='list-disc pl-5 mb-6 space-y-2'>
            <li>
              {t("checkBrandsSection") || ""}
              <Link
                href={`/${locale}/repair/brands`}
                className='text-blue-600 hover:underline ml-1'
              >
                {t("brandsSectionLink") || "Check our Brands section"}
              </Link>
            </li>
            <li>
              {t("contactSupport") ||
                "Contact our support team for assistance with identifying your device."}
            </li>
            <li>
              {t("scheduleRepairConsultation") ||
                "Schedule a repair consultation with our experts."}
            </li>
          </ul>
          <Link
            href={`/${locale}/repair/schedule`}
            className='inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md'
          >
            {t("scheduleRepairConsultation") ||
              "Schedule a Repair Consultation"}
          </Link>
        </div>
      </div>
    </RepairLayout>
  );
}
