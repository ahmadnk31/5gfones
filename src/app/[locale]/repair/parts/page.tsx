import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import RepairLayout from "@/components/repair-layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";

import PartCardClient from "@/components/part-card-client";
import { formatCurrency } from "@/lib/utils";

export default async function RepairPartsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations("repair");
  const supabase = await createClient();
  const { locale } = await params;

  // Get the model filter from the URL query string
  const modelId = searchParams.model ? Number(searchParams.model) : undefined;

  // Fetch the device model information if specified
  let modelInfo: any = null;
  if (modelId) {
    const { data: model } = await supabase
      .from("device_models")
      .select(
        `
        id,
        name,
        image_url,
        device_series (
          id,
          name,
          device_type_id,
          device_types (
            id,
            name,
            brand_id,
            device_brands (
              id,
              name
            )
          )
        )
      `
      )
      .eq("id", modelId)
      .single();

    modelInfo = model;
  }
  // Prepare the query for repair parts
  let partsQuery = supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      description,
      base_price,
      image_url,
      in_stock,
      category_id,
      categories (
        id,
        name
      ),
      compatible_with_model_id,
      has_variants:product_variants(count)
    `
    )
    .eq("is_repair_part", true);

  // Apply model filter
  if (modelId) {
    partsQuery = partsQuery.eq("compatible_with_model_id", modelId);
  } else {
    // If no model specified, limit the number of results and show popular parts
    partsQuery = partsQuery.limit(12);
  }

  // Execute the query
  const { data: parts } = await partsQuery.order("base_price");

  // Get navigation path information
  let deviceTypeId: number | null = null;
  let brandId: number | null = null;
  let seriesId: number | null = null;

  if (modelInfo?.device_series) {
    seriesId = modelInfo.device_series.id;
    deviceTypeId = modelInfo.device_series.device_type_id;
    brandId = modelInfo.device_series.device_types?.brand_id || null;
  }
  // We'll move the formatCurrency function to the client component
  return (
    <RepairLayout activeTab='parts'>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        {/* Breadcrumb navigation */}
        <div className='flex flex-wrap items-center mb-6'>
          {modelId && (
            <>
              {" "}
              <Link
                href={`/${locale}/repair/models`}
                className='text-blue-600 hover:underline flex items-center'
              >
                <ArrowLeft className='h-4 w-4 mr-1' />
                {t("backToModels") || "Back to Models"}
              </Link>
              {deviceTypeId && (
                <>
                  <span className='mx-2'>/</span>{" "}
                  <Link
                    href={`/${locale}/repair/models?device=${deviceTypeId}`}
                    className='text-blue-600 hover:underline'
                  >
                    {modelInfo?.device_series?.device_types?.name}
                  </Link>
                </>
              )}
              {seriesId && (
                <>
                  <span className='mx-2'>/</span>{" "}
                  <Link
                    href={`/${locale}/repair/models?device=${deviceTypeId}&series=${seriesId}`}
                    className='text-blue-600 hover:underline'
                  >
                    {modelInfo?.device_series?.name}
                  </Link>
                </>
              )}
            </>
          )}
        </div>        <h1 className='text-3xl font-bold mb-2'>
          {modelId ? `${modelInfo?.name} ${t("partsPageTitle", "Repair Parts")}` : t("partsPageTitle", "Repair Parts")}
        </h1>
        <p className='text-gray-600 mb-8'>
          {modelId
            ? t("browseModelParts", "Browse compatible repair parts for {model}").replace("{model}", modelInfo?.name)
            : t("browseQualityParts", "Browse our selection of quality repair parts")}
        </p>
        {/* Selected Model Display (if applicable) */}
        {modelInfo && (
          <div className='mb-10 bg-gray-50 rounded-lg p-6 flex flex-col md:flex-row items-center'>
            <div className='w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 mr-6 mb-4 md:mb-0 border'>
              {modelInfo.image_url ? (
                <Image
                  src={modelInfo.image_url}
                  alt={modelInfo.name}
                  width={100}
                  height={100}
                  className='max-h-full w-auto object-contain'
                />
              ) : (                <div className='text-gray-400 text-center text-sm'>
                  {t("noImageText", "[No Image]")}
                </div>
              )}
            </div>
            <div className='flex-1'>
              <h2 className='text-xl font-bold'>{modelInfo.name}</h2>
              {modelInfo.device_series && (
                <p className='text-gray-600'>
                  {modelInfo.device_series.device_types?.device_brands?.name} •{" "}
                  {modelInfo.device_series.device_types?.name} •{" "}
                  {modelInfo.device_series.name}
                </p>
              )}
              <div className='mt-4'>
                {" "}
                <Link
                  href={`/${locale}/repair/schedule?model=${modelInfo.id}`}
                  className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md inline-flex items-center mr-3'
                >
                  {t("scheduleRepair") || "Schedule Repair"}
                </Link>{" "}
                <Link
                  href={`/${locale}/repair/track`}
                  className='text-blue-600 hover:underline inline-flex items-center'
                >
                  <ExternalLink className='h-4 w-4 mr-1' />
                  {t("trackExistingRepair") || "Track Existing Repair"}
                </Link>
              </div>
            </div>
          </div>
        )}{" "}
        {/* Parts Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {parts?.map((part) => (
            <Card
              key={part.id}
              className='overflow-hidden border hover:shadow-md transition-shadow h-full flex flex-col'
            >
              <CardContent className='p-0 flex-1'>
                <div className='h-40 bg-gray-100 flex items-center justify-center p-4 border-b'>
                  {part.image_url ? (
                    <Image
                      src={part.image_url}
                      alt={part.name}
                      width={120}
                      height={120}
                      className='max-h-full w-auto object-contain'
                      style={{ maxWidth: "100%" }}
                    />
                  ) : (
                    <div className='text-gray-500 font-medium text-center'>
                      {part.name}
                    </div>
                  )}
                </div>
                <div className='p-4'>                  <div className='text-sm text-blue-600 mb-1'>
                    {part.categories?.name || t("repairPartDefault", "Repair Part")}
                  </div>
                  <h3 className='font-medium text-base mb-2'>{part.name}</h3>
                  <p className='text-sm text-gray-600 line-clamp-2'>
                    {part.description || t("compatiblePart", "Compatible replacement part")}
                  </p>
                  <div className='flex justify-between items-center mt-3'>
                    <div className='text-lg font-bold text-blue-700'>
                      {formatCurrency(part.base_price)}
                    </div>
                    <div
                      className={`text-sm ${
                        part.in_stock > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {part.in_stock > 0
                        ? t("inStock") || "In Stock"
                        : t("outOfStock") || "Out of Stock"}{" "}
                      {part.has_variants && part.has_variants[0].count > 0 && (
                        <span className='ml-1 text-xs text-blue-600'>
                          • {t("hasVariants") || "Options"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='p-4 pt-0 mt-auto'>
                {" "}
                <PartCardClient
                  part={part}
                  locale={locale}
                  modelId={modelId}
                  translations={{
                    scheduleRepair: t("scheduleRepair"),
                    addToCart: t("addToCart") || "Add to Cart",
                    inStock: t("inStock") || "In Stock",
                    outOfStock: t("outOfStock") || "Out of Stock",
                    selectVariant: t("selectVariant") || "Select Option",
                    close: t("close") || "Close",
                    addedToCart: t("addedToCart") || "Added to cart",
                    errorAddingToCart: t("errorAddingToCart") || "Error",
                  }}
                  scheduleRepairMode={!!modelId}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
        {/* No Results Message */}
        {(!parts || parts.length === 0) && (
          <div className='text-center py-12 bg-gray-50 rounded-lg'>            <p className='text-lg text-gray-500 mb-4'>
              {modelId
                ? t("noPartsForModel", "No repair parts available for {model}.").replace("{model}", modelInfo?.name)
                : t("noPartsAvailable", "No repair parts available at the moment.")}
            </p>
            {modelId && (
              <Link
                href={`/${locale}/repair/schedule`}
                className='bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-md inline-block'
              >
                {t("scheduleCustomRepair") || "Schedule a Custom Repair"}
              </Link>
            )}
          </div>
        )}
        {/* Request Custom Part Section */}
        <div className='mt-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 text-center'>          <h2 className='text-2xl font-bold mb-4'>
            {t("needSpecificPart", "Need a Specific Repair Part?")}
          </h2>
          <p className='text-lg mb-6 max-w-2xl mx-auto'>
            {t("customPartDescription", "If you don't see the exact part you need, our team can help source it for you. We work with multiple suppliers to get the right parts for your device.")}
          </p>{" "}
          <Link
            href={`/${locale}/repair/schedule`}
            className='inline-block bg-white text-blue-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-md'
          >
            {t("requestCustomPart") || "Request a Custom Part"}
          </Link>
        </div>
      </div>
    </RepairLayout>
  );
}
