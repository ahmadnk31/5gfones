import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import RepairLayout from "@/components/repair-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export default async function RepairModelsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();
  const { locale } = await params;

  // Get the device filter from the URL query string
  const deviceTypeId = searchParams.device
    ? Number(searchParams.device)
    : undefined;
  const seriesId = searchParams.series
    ? Number(searchParams.series)
    : undefined;

  // Fetch the device type information if specified
  let deviceTypeName = "";
  let brandId: number | null = null;
  let deviceType: any = null;

  if (deviceTypeId) {
    const { data } = await supabase
      .from("device_types")
      .select(
        `
        id,
        name,
        brand_id,
        device_brands (
          id,
          name
        )
      `
      )
      .eq("id", deviceTypeId)
      .single();

    if (data) {
      deviceType = data;
      deviceTypeName = data.name;
      brandId = data.brand_id;
      brandId = deviceType.brand_id;
    }
  }

  // Fetch device series for this device type if applicable
  let series: any[] = [];
  if (deviceTypeId) {
    const { data: seriesData } = await supabase
      .from("device_series")
      .select("id, name, image_url")
      .eq("device_type_id", deviceTypeId)
      .order("name");

    if (seriesData && seriesData.length > 0) {
      series = seriesData;
    }
  }

  // Prepare the query for device models
  let modelsQuery = supabase.from("device_models").select(`
      id,
      name,
      image_url,
      device_series_id,
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
    `);
  
  console.log("Filter parameters:", { deviceTypeId, seriesId });
  
  // Create a join to filter properly
  if (seriesId) {
    console.log("Filtering by series ID:", seriesId);
    modelsQuery = modelsQuery.eq("device_series_id", seriesId);
  } else if (deviceTypeId) {
    // First get the series IDs for this device type
    console.log("Filtering by device type ID:", deviceTypeId);
    
    const { data: seriesForDeviceType } = await supabase
      .from("device_series")
      .select("id")
      .eq("device_type_id", deviceTypeId);
    
    if (seriesForDeviceType && seriesForDeviceType.length > 0) {
      console.log("Found series for device type:", seriesForDeviceType.map(s => s.id));
      const seriesIds = seriesForDeviceType.map(s => s.id);
      modelsQuery = modelsQuery.in("device_series_id", seriesIds);
    } else {
      // No series found, this will return no results
      console.log("No series found for device type ID:", deviceTypeId);
    }
  } else if (!deviceTypeId && !seriesId) {
    console.log("No filters applied, limiting results");
    // If no filters, limit the results
    modelsQuery = modelsQuery.limit(20);
  }

  // Execute the query
  const { data: models } = await modelsQuery.order("name");
  console.log("Models query result count:", models?.length);

  // Get the selected series name if a filter is applied
  let selectedSeriesName = "";
  if (seriesId && series) {
    const selectedSeries = series.find((s) => s.id === seriesId);
    selectedSeriesName = selectedSeries ? selectedSeries.name : "";
  }

  return (
    <RepairLayout activeTab='models'>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        {/* Breadcrumb navigation */}
        <div className='flex items-center mb-6'>
          {deviceTypeId && (
            <>
              {" "}
              <Link
                href={`/${locale}/repair/devices`}
                className='text-blue-600 hover:underline flex items-center'
              >
                <ArrowLeft className='h-4 w-4 mr-1' />
                {t("backToDevices") || "Back to Devices"}
              </Link>
              {brandId && (
                <>
                  <span className='mx-2'>/</span>
                  <Link
                    href={`/${locale}/repair/devices?brand=${brandId}`}
                    className='text-blue-600 hover:underline'
                  >
                    {deviceType?.device_brands?.name}
                  </Link>
                </>
              )}
            </>
          )}
        </div>{" "}
        <h1 className='text-3xl font-bold mb-2'>
          {seriesId
            ? `${selectedSeriesName} Models`
            : deviceTypeId
            ? `${deviceTypeName} Models`
            : t("modelsPageTitle") || "Device Models We Repair"}
        </h1>
        <p className='text-gray-600 mb-8'>
          {t("modelsPageDescription") ||
            "Select a device model to explore repair options and parts"}
        </p>
        {/* Series Filters (if applicable) */}
        {series && series.length > 0 && (
          <div className='mb-8'>
            {" "}
            <h2 className='text-lg font-medium mb-3'>
              {t("filterBySeries") || "Filter by Series:"}
            </h2>
            <Tabs
              defaultValue={seriesId?.toString() || "all"}
              className='w-full'
            >
              <TabsList className='h-auto max-w-full overflow-x-auto flex flex-wrap gap-1 pb-1'>
                <Link href={`/${locale}/repair/models?device=${deviceTypeId}`}>
                  <TabsTrigger
                    value='all'
                    className='data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                  >
                    {t("allSeries") || "All Series"}
                  </TabsTrigger>
                </Link>
                {series.map((s) => (
                  <Link
                    key={s.id}
                    href={`/${locale}/repair/models?device=${deviceTypeId}&series=${s.id}`}
                  >
                    <TabsTrigger
                      value={s.id.toString()}
                      className='data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                    >
                      {s.name}
                    </TabsTrigger>
                  </Link>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
        {/* Models Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {models?.map((model) => (
            <Link
              key={model.id}
              href={`/${locale}/repair/parts?model=${model.id}`}
              className='hover:opacity-90 transition-opacity'
            >
              <Card className='overflow-hidden border hover:shadow-md transition-shadow h-full'>
                <CardContent className='p-0'>
                  <div className='h-44 bg-gray-100 flex items-center justify-center p-6'>
                    {model.image_url ? (
                      <Image
                        src={model.image_url}
                        alt={model.name}
                        width={150}
                        height={150}
                        className='max-h-full w-auto object-contain'
                        style={{ maxWidth: "100%" }}
                      />
                    ) : (
                      <div className='text-gray-500 font-medium text-center'>
                        {model.name}
                      </div>
                    )}
                  </div>{" "}
                  <div className='p-4'>
                    <h3 className='font-medium text-base'>{model.name}</h3>
                    {model.device_series && model.device_series.length > 0 && (
                      <p className='text-gray-500 text-sm mt-1'>
                        {model.device_series[0].name} •{" "}
                        {model.device_series[0].device_types &&
                        model.device_series[0].device_types.length > 0
                          ? model.device_series[0].device_types[0].name
                          : ""}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {/* No Results Message */}
        {(!models || models.length === 0) && (
          <div className='text-center py-12 bg-gray-50 rounded-lg'>
            {" "}
            <p className='text-lg text-gray-500'>
              {seriesId
                ? t("noModelsForSeries") ||
                  "No models available for this series."
                : deviceTypeId
                ? t("noModelsForDevice") ||
                  "No models available for this device type."
                : t("noModels") || "No device models available at the moment."}
            </p>
          </div>
        )}
        {/* Schedule Repair CTA */}{" "}
        <div className='mt-16 bg-blue-600 text-white rounded-lg p-8 text-center'>
          <h2 className='text-2xl font-bold mb-4'>
            {t("dontSeeYourModel") || "Don't See Your Model?"}
          </h2>
          <p className='text-lg mb-6 max-w-2xl mx-auto'>
            {t("repairConsultationDescription") ||
              "We can still help! Our expert technicians can repair many models not listed here. Schedule a consultation and we'll help identify your device and the best repair options."}
          </p>
          <Link
            href={`/${locale}/repair/schedule`}
            className='inline-block bg-white text-blue-700 hover:bg-gray-100 font-medium py-3 px-8 rounded-md'
          >
            {t("scheduleRepairNow") || "Schedule a Repair Now"}
          </Link>
        </div>
      </div>
    </RepairLayout>
  );
}
