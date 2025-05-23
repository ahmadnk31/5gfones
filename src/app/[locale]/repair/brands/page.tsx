import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import RepairLayout from "@/components/repair-layout";
import { Card, CardContent } from "@/components/ui/card";

export default async function RepairBrandsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("repair");
  const supabase = createClient();
  // Fetch all device brands
  const { data: brands } = await supabase
    .from("device_brands")
    .select("id, name, image_url")
    .order("name");

  const locale = params.locale;

  return (
    <RepairLayout activeTab='brands'>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        <h1 className='text-3xl font-bold mb-2'>
          {t("brandPageTitle") || "Device Brands We Repair"}
        </h1>
        <p className='text-gray-600 mb-8'>
          {t("brandPageDescription") ||
            "Select a brand to explore devices and repair options"}
        </p>

        {/* Brands Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6'>
          {brands?.map((brand) => (            <Link
              key={brand.id}
              href={`/${locale}/repair/devices?brand=${brand.id}`}
              className='hover:opacity-90 transition-opacity'
            >
              <Card className='overflow-hidden border hover:shadow-md transition-shadow'>
                <CardContent className='p-0'>
                  <div className='h-32 md:h-36 bg-gray-100 flex items-center justify-center p-6'>
                    {brand.image_url ? (
                      <Image
                        src={brand.image_url}
                        alt={brand.name}
                        width={120}
                        height={120}
                        className='max-h-full w-auto object-contain'
                        style={{ maxWidth: "100%" }}
                      />
                    ) : (
                      <div className='text-gray-500 font-medium text-center'>
                        {brand.name}
                      </div>
                    )}
                  </div>
                  <div className='p-3 text-center'>
                    <h3 className='font-medium text-sm'>{brand.name}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* No Brands Message */}
        {(!brands || brands.length === 0) && (
          <div className='text-center py-12'>
            <p className='text-lg text-gray-500'>
              No brands available at the moment.
            </p>
          </div>
        )}

        {/* How It Works Section */}
        <div className='mt-16'>
          <h2 className='text-2xl font-bold mb-6'>
            How Our Repair Service Works
          </h2>
          <div className='grid md:grid-cols-3 gap-6'>
            <div className='bg-blue-50 rounded-lg p-6'>
              <div className='bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mb-4'>
                <span className='font-bold text-blue-700'>1</span>
              </div>
              <h3 className='font-semibold text-lg mb-2'>Select Your Device</h3>
              <p className='text-gray-600'>
                Choose your device brand, model, and the specific repair service
                you need.
              </p>
            </div>
            <div className='bg-blue-50 rounded-lg p-6'>
              <div className='bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mb-4'>
                <span className='font-bold text-blue-700'>2</span>
              </div>
              <h3 className='font-semibold text-lg mb-2'>
                Book an Appointment
              </h3>
              <p className='text-gray-600'>
                Schedule a convenient time for your repair with our expert
                technicians.
              </p>
            </div>
            <div className='bg-blue-50 rounded-lg p-6'>
              <div className='bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mb-4'>
                <span className='font-bold text-blue-700'>3</span>
              </div>
              <h3 className='font-semibold text-lg mb-2'>
                Get Your Device Fixed
              </h3>
              <p className='text-gray-600'>
                Our certified technicians will repair your device quickly and
                efficiently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RepairLayout>
  );
}
