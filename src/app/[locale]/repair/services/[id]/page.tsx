import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  CalendarIcon,
  ArrowLeft,
  PenTool,
} from "lucide-react";

export default async function RepairServiceDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();
  const { locale, id } = params;

  // Fetch repair service details
  const { data: service, error } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      description,
      base_price,
      image_url,
      category_id,
      compatible_with_model_id
    `
    )
    .eq("id", id)
    .eq("is_repair_part", true)
    .single();

  if (error || !service) {
    return notFound();
  }

  // Fetch compatible device model if available
  let deviceModel = null;
  if (service.compatible_with_model_id) {
    const { data } = await supabase
      .from("device_models")
      .select(
        `
        id,
        name,
        image_url,
        device_series:device_series_id(
          id,
          name,
          device_type:device_type_id(
            id,
            name,
            brand:brand_id(
              id,
              name
            )
          )
        )
      `
      )
      .eq("id", service.compatible_with_model_id)
      .single();
    
    deviceModel = data;
  }

  // Fetch related repair services
  const { data: relatedServices } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      base_price,
      image_url
    `
    )
    .eq("is_repair_part", true)
    .neq("id", id)
    .limit(3);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link
        href={`/${locale}/repair/services`}
        className="flex items-center text-blue-600 mb-8 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("backToServices") || "Back to all repair services"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 border border-gray-200">
            <div className="relative h-80 w-full mb-6">
              <Image
                src={service.image_url || "/placeholder.svg"}
                alt={service.name}
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">{service.name}</h1>

            {deviceModel && (
              <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-200">
                <span>
                  {t("compatibleWith", {
                    model: deviceModel.name,
                    series: deviceModel.device_series?.name || "",
                    brand: deviceModel.device_series?.device_type?.brand?.name || "",
                  }) || `Compatible with ${deviceModel.name}`}
                </span>
              </div>
            )}

            <div className="prose max-w-none">
              <p className="text-lg mb-6">{service.description}</p>

              <h2 className="text-xl font-semibold mt-8 mb-4">
                {t("whatIncluded") || "What's Included"}
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("qualityParts") ||
                      "Genuine or high-quality compatible parts"}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("expertService") || "Expert technician labor"}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("diagnostics") || "Complete device diagnostic"}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("warranty") || "90-day warranty on parts and labor"}
                  </span>
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">
                {t("serviceProcess") || "Service Process"}
              </h2>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 font-medium">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {t("schedule") || "Schedule"}
                    </h3>
                    <p className="text-gray-600">
                      {t("scheduleDescription") ||
                        "Book an appointment at a time that works for you"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 font-medium">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {t("diagnostic") || "Diagnosis"}
                    </h3>
                    <p className="text-gray-600">
                      {t("diagnosticDescription") ||
                        "Our technicians will diagnose the problem and confirm the repair"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 font-medium">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {t("repair") || "Repair"}
                    </h3>
                    <p className="text-gray-600">
                      {t("repairDescription") ||
                        "We repair your device using quality parts"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-blue-700 font-medium">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {t("pickup") || "Pickup"}
                    </h3>
                    <p className="text-gray-600">
                      {t("pickupDescription") ||
                        "Pick up your repaired device, fully tested and ready to use"}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-20">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">
                  {t("priceDetails") || "Price Details"}
                </h2>
                <div className="flex items-center text-3xl font-bold text-blue-600 mb-4">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(service.base_price)}
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <PenTool className="h-5 w-5 text-blue-600 mr-3" />
                    <span>
                      {t("priceIncludesParts") ||
                        "Price includes parts and labor"}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-3" />
                    <span>
                      {t("typicalDuration") ||
                        "Typical duration: 1-2 hours"}
                    </span>
                  </li>
                </ul>                <div className="space-y-3">
                  <Link href={`/${locale}/repair/schedule?repairPartId=${service.id}${service.compatible_with_model_id ? `&modelId=${service.compatible_with_model_id}` : ''}`}>
                    <Button className="w-full">{t("scheduleService") || "Schedule Service"}</Button>
                  </Link>
                  <Link href={`/${locale}/contact`}>
                    <Button variant="outline" className="w-full">
                      {t("askQuestion") || "Ask a Question"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {relatedServices && relatedServices.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {t("relatedServices") || "Related Services"}
                  </h2>
                  <div className="space-y-4">
                    {relatedServices.map((relatedService) => (
                      <Link
                        key={relatedService.id}
                        href={`/${locale}/repair/services/${relatedService.id}`}
                        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors"
                      >
                        <div className="h-12 w-12 relative flex-shrink-0">
                          <Image
                            src={relatedService.image_url || "/placeholder.svg"}
                            alt={relatedService.name}
                            fill
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {relatedService.name}
                          </h3>
                          <p className="text-blue-600 text-sm font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(relatedService.base_price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
