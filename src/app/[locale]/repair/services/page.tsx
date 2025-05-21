import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ShieldCheck, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function RepairServicesPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient()
  

  // Fetch all repair services
  const { data: repairServices } = await supabase
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
    .order("base_price", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
        {t("allRepairServices") || "All Repair Services"}
      </h1>
      <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        {t("allServicesDescription") ||
          "Browse our complete range of professional repair services for all device types. Quick turnaround times and quality parts guaranteed."}
      </p>

      {repairServices && repairServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {repairServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="h-48 relative">
                <Image
                  src={service.image_url || "/placeholder.svg"}
                  alt={service.name}
                  width={500}
                  height={300}
                  style={{ 
                    maxWidth: "100%",
                    height: "auto"
                  }}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {t("qualityParts") || "Quality Parts"}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {t("warrantyIncluded") || "Warranty"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    {t("fromPrice", { price: service.base_price }) ||
                      `From $${service.base_price}`}
                  </span>
                  <Link href={`/repair/services/${service.id}`}>
                    <Button variant="outline" size="sm">
                      {t("learnMore") || "Learn More"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">{t("noServicesFound") || "No repair services found."}</p>
        </div>
      )}

      <div className="mt-16 bg-blue-50 rounded-lg p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">
            {t("needHelpChoosingService") || "Not sure which repair service you need?"}
          </h2>          <p className="text-gray-700 mb-6">
            {t("helpChoosingDescription") || 
             "Our technicians can diagnose your device and recommend the appropriate repair service. Schedule a free diagnosis appointment today."}
          </p>          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/repair/schedule`}>
              <Button>{t("scheduleRepair") || "Schedule Repair"}</Button>
            </Link>
            <Link href={`/contact`}>
              <Button variant="outline">{t("contactUs") || "Contact Us"}</Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-4 md:w-1/3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">{t("qualityGuarantee") || "Quality Guarantee"}</h3>
              <p className="text-sm text-gray-600">
                {t("qualityGuaranteeDescription") || "All repairs come with a 90-day warranty on parts and labor."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium">{t("expertTechnicians") || "Expert Technicians"}</h3>
              <p className="text-sm text-gray-600">
                {t("expertTechniciansDescription") || "Our certified technicians have years of experience in device repair."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
