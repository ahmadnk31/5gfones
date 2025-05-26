import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations            } from "next-intl/server";
import Image from "next/image";
import { Metadata } from "next";
import { generateSEOMetadata, PageType } from "@/lib/seo";

import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  Phone,
  Shield,
  PenToolIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

// Generate metadata for the repair page
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSEOMetadata({
    pageType: PageType.REPAIR,
    locale,
  });
}

export default async function RepairPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();


  // Fetch repair services
  const { data: repairServices } = await supabase
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
    .order("base_price", { ascending: true })
    .limit(6);

  // Fetch device brands for repair
  const { data: deviceBrands } = await supabase
    .from("device_brands")
    .select("id, name, image_url")
    .order("name")
    .limit(8);

  return (
    <div>      {/* Hero Section */}
      <section className='bg-gradient-to-r from-emerald-600 to-green-700 text-white py-16 md:py-24'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='max-w-3xl'>
            <h1 className='text-3xl md:text-5xl font-bold mb-4'>
              {t("heroTitle") || "Professional Device Repair Services"}
            </h1>
            <p className='text-lg md:text-xl mb-6 opacity-90'>
              {t("heroSubtitle") ||
                "Fast, reliable repairs for phones, tablets, and computers with quality parts and expert technicians."}</p>            <Link href={`/repair/schedule`}>
              <Button size='lg' variant='secondary'>
                {t("scheduleButton") || "Schedule a Repair"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Repair Process */}
      <section className='py-16'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <h2 className='text-2xl md:text-3xl font-bold mb-3 text-center'>
            {t("mainProcessTitle") || "How Our Repair Process Works"}
          </h2>
          <p className='text-center text-gray-600 mb-12 max-w-3xl mx-auto'>
            {t("mainProcessDescription") ||
              "Simple, transparent process to get your device fixed and back in your hands as quickly as possible."}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center'>
              <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CalendarIcon className='h-8 w-8 text-emerald-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                {t("processStep1Title") || "1. Schedule"}
              </h3>
              <p className='text-gray-600'>
                {t("processStep1Description") ||
                  "Book an appointment online or walk in with your device at a time that works for you."}
              </p>
            </div>            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center'>
              <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <PenToolIcon className='h-8 w-8 text-emerald-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                {t("processStep2Title") || "2. Diagnose"}
              </h3>
              <p className='text-gray-600'>
                {t("processStep2Description") ||
                  "Our technicians will diagnose the issue and provide a transparent price quote."}
              </p>
            </div>

            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='h-8 w-8 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                {t("processStep3Title") || "3. Repair & Return"}
              </h3>
              <p className='text-gray-600'>
                {t("processStep3Description") ||
                  "We fix your device using quality parts and test it thoroughly before returning it to you."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Device Brands */}
      {deviceBrands && deviceBrands.length > 0 && (
        <section className='py-12 bg-gray-50'>
          <div className='container mx-auto px-4 max-w-6xl'>
            <h2 className='text-2xl md:text-3xl font-bold mb-3 text-center'>
              {t("devicesWeRepair") || "Devices We Repair"}
            </h2>
            <p className='text-center text-gray-600 mb-10'>
              {t("devicesDescription") ||
                "We service all major brands and models with genuine or high-quality compatible parts."}
            </p>

            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4'>
              {deviceBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/repair/brands/${brand.id}`}
                  className='flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow'
                >                  <div className='w-16 h-16 relative mb-3'>
                    <Image
                      src={brand.image_url || "/placeholder.svg"}
                      alt={brand.name}
                      width={84}
                      height={84}
                      sizes='64px'
                      className='object-contain'
                      style={{ width: "auto", height: "auto" }} // Add both width and height auto
                    />
                  </div>
                  <h3 className='font-medium text-sm text-center'>
                    {brand.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common Repair Services */}
      {repairServices && repairServices.length > 0 && (
        <section className='py-16'>
          <div className='container mx-auto px-4 max-w-6xl'>
            <h2 className='text-2xl md:text-3xl font-bold mb-3 text-center'>
              {t("popularRepairServices") || "Popular Repair Services"}
            </h2>
            <p className='text-center text-gray-600 mb-10'>
              {t("servicesDescription") ||
                "Fast and reliable fixes for your device's most common issues."}
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {repairServices.map((service) => (
                <div
                  key={service.id}
                  className='bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden'
                >                  <div className='h-48 relative flex items-center justify-center'>
                    <Image
                      src={service.image_url || "/placeholder.svg"}
                      alt={service.name}
                      width={500}
                      height={300}
                      sizes='(max-width: 768px) 100vw, 300px'
                      style={{ 
                        maxWidth: "100%",
                        height: "auto" // Add height auto to maintain aspect ratio
                      }}
                      className='object-contain w-auto' // Changed from object-fill to object-contain
                    />
                  </div><div className='p-6'>
                    <h3 className='text-xl font-semibold mb-2'>
                      {service.name}
                    </h3>
                    <div className='flex justify-between items-center'>                      <span className='text-lg font-bold text-emerald-600'>
                        {t("fromPrice", { price: service.base_price }) ||
                          `From $${service.base_price}`}
                      </span>
                      <Link href={`/repair/services/${service.id}`}>
                        <Button variant='outline' size='sm'>
                          {t("learnMore") || "Learn More"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>            <div className='text-center mt-10'>
              <Link href={`/repair/services`}>
                <Button>
                  {t("viewAllServices") || "View All Repair Services"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}      <section className='py-16 bg-emerald-50'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <h2 className='text-2xl md:text-3xl font-bold mb-3 text-center'>
            {t("whyChooseTitle") || "Why Choose Our Repair Services"}
          </h2>
          <p className='text-center text-gray-600 mb-12'>
            {t("whyChooseDescription") ||
              "Trusted by thousands of customers for quality repairs and exceptional service."}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='bg-white p-6 rounded-lg shadow-sm'>
              <Shield className='h-10 w-10 text-emerald-600 mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                {t("warrantyTitle") || "Warranty Guaranteed"}
              </h3>
              <p className='text-gray-600'>
                {t("warrantyDescription") ||
                  "All our repairs come with a 90-day warranty on parts and service."}
              </p>
            </div>            <div className='bg-white p-6 rounded-lg shadow-sm'>
              <Clock className='h-10 w-10 text-emerald-600 mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                {t("turnaroundTitle") || "Quick Turnaround"}
              </h3>
              <p className='text-gray-600'>
                {t("turnaroundDescription") ||
                  "Many repairs completed same-day, getting your device back to you faster."}
              </p>
            </div>            <div className='bg-white p-6 rounded-lg shadow-sm'>
              <PenToolIcon className='h-10 w-10 text-emerald-600 mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                {t("techniciansTitle") || "Expert Technicians"}
              </h3>
              <p className='text-gray-600'>
                {t("techniciansDescription") ||
                  "Skilled, certified technicians with years of experience in device repair."}
              </p>
            </div>            <div className='bg-white p-6 rounded-lg shadow-sm'>
              <Phone className='h-10 w-10 text-emerald-600 mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                {t("diagnosticsTitle") || "Free Diagnostics"}
              </h3>
              <p className='text-gray-600'>
                {t("diagnosticsDescription") ||
                  "We diagnose your device issues at no cost before any repairs begin."}
              </p>
            </div>
          </div>
        </div>
      </section>      {/* CTA Section */}
      <section className='py-16 bg-gradient-to-r from-emerald-600 to-green-700 text-white'>
        <div className='container mx-auto px-4 max-w-6xl text-center'>
          <h2 className='text-2xl md:text-3xl font-bold mb-4'>
            {t("ctaTitle") || "Ready to get your device fixed?"}
          </h2>
          <p className='text-lg mb-8 max-w-2xl mx-auto'>
            {t("ctaDescription") ||
              "Schedule a repair appointment now or contact us to speak with a technician about your device."}
          </p>          <div className='flex flex-col sm:flex-row justify-center gap-4'>            <Link href={`/repair/schedule`}>
              <Button size='lg' variant='secondary'>
                {t("scheduleRepair")}
              </Button>
            </Link>
            <Link href={`/contact`}>
              <Button
                size='lg'
                variant='outline'
                className='bg-transparent hover:bg-white/10'
              >
                {t("contactUs") || "Contact Us"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
