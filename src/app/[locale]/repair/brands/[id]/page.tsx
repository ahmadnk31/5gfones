import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function RepairBrandDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();
  const { locale, id } = params;

  // Fetch brand
  const { data: brand, error } = await supabase
    .from("device_brands")
    .select("id, name, image_url")
    .eq("id", id)
    .single();

  if (error || !brand) {
    return notFound();
  }

  // Fetch device types for this brand
  const { data: deviceTypes } = await supabase
    .from("device_types")
    .select("id, name, image_url")
    .eq("brand_id", id)
    .order("name");

  // Fetch repair services compatible with this brand's devices
  const { data: repairServices } = await supabase
    .from("products")
    .select(`
      id, 
      name, 
      base_price,
      image_url,
      compatible_with_model_id,
      device_models!inner(
        id,
        device_series!inner(
          id,
          device_type!inner(
            id,
            brand_id
          )
        )
      )
    `)
    .eq("is_repair_part", true)
    .eq("device_models.device_series.device_type.brand_id", id)
    .limit(6);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link
        href={`/${locale}/repair/brands`}
        className="flex items-center text-blue-600 mb-8 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backToBrands") || "Back to all brands"}
      </Link>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
        <div className="w-32 h-32 relative">
          <Image
            src={brand.image_url || "/placeholder.svg"}
            alt={brand.name}
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{brand.name} {t("repairs") || "Repairs"}</h1>
          <p className="text-gray-600 text-lg">
            {t("brandRepairDescription", { brand: brand.name }) || 
              `Professional repair services for all ${brand.name} devices`}
          </p>
        </div>
      </div>

      {deviceTypes && deviceTypes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("selectDeviceType") || "Select Your Device Type"}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">            {deviceTypes.map((type) => (
              <Link
                key={type.id}
                href={`/${locale}/repair/devices?brand=${brand.id}`}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="w-16 h-16 relative mb-3">
                  <Image
                    src={type.image_url || "/placeholder.svg"}
                    alt={type.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <h3 className="font-medium text-center text-sm">{type.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {repairServices && repairServices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {t("popularRepairsFor", { brand: brand.name }) || `Popular ${brand.name} Repairs`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {repairServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="h-40 relative">
                  <Image
                    src={service.image_url || "/placeholder.svg"}
                    alt={service.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{service.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(service.base_price)}
                    </span>
                    <Link href={`/${locale}/repair/services/${service.id}`}>
                      <Button variant="outline" size="sm">
                        {t("learnMore") || "Details"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href={`/${locale}/repair/services`}>
              <Button variant="outline">
                {t("viewAllServices") || "View All Repair Services"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t("readyToRepair", { brand: brand.name }) || `Ready to repair your ${brand.name} device?`}
          </h2>
          <p className="text-gray-700 mb-6">
            {t("scheduleDescription") || 
              "Schedule an appointment and our expert technicians will diagnose and repair your device quickly and professionally."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={`/${locale}/repair/schedule`}>
              <Button>{t("scheduleNow") || "Schedule Now"}</Button>
            </Link>
            <Link href={`/${locale}/contact`}>
              <Button variant="outline">{t("getQuote") || "Get a Quote"}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
