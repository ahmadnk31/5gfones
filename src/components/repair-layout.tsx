"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Wrench, Calendar, Search } from "lucide-react";

interface RepairLayoutProps {
  children: React.ReactNode;
  activeTab?:
    | "home"
    | "schedule"
    | "track"
    | "status"
    | "brands"
    | "devices"
    | "models"
    | "parts";
}

const RepairLayout = ({ children, activeTab = "home" }: RepairLayoutProps) => {
  const t = useTranslations("repair");
  // Get the current locale for links
  const locale = useTranslations("common")("locale") || "en";

  return (
    <div>
      {/* Primary Repair Navigation */}
      <div className='bg-white shadow-sm border-b sticky top-20 z-40'>
        <div className='container mx-auto flex justify-center overflow-x-auto'>
          <Tabs defaultValue={activeTab} className='w-full max-w-6xl'>
            <TabsList className='grid grid-cols-4 w-full'>
              <Link href={`/${locale}/repair`}>
                <TabsTrigger
                  value='home'
                  className='flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                >
                  <Phone className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("services")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/schedule`}>
                <TabsTrigger
                  value='schedule'
                  className='flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                >
                  <Calendar className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("schedule")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/track`}>
                <TabsTrigger
                  value='track'
                  className='flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                >
                  <Search className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("track")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/status`}>
                <TabsTrigger
                  value='status'
                  className='flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700'
                >
                  <Wrench className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("status")}</span>
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Secondary Navigation for Parts/Devices */}
      {(activeTab === "brands" ||
        activeTab === "devices" ||
        activeTab === "models" ||
        activeTab === "parts" ||
        activeTab === "home") && (
        <div className='bg-gray-50 border-b sticky top-32 z-30'>
          <div className='container mx-auto'>
            <Tabs
              defaultValue={activeTab === "home" ? "parts" : activeTab}
              className='w-full'
            >
              <TabsList className='h-auto max-w-full overflow-x-auto flex flex-wrap gap-1 pb-1'>
                <Link href={`/${locale}/repair/brands`}>
                  <TabsTrigger
                    value='brands'
                    className='data-[state=active]:bg-white data-[state=active]:text-blue-700'
                  >
                    {t("brands")}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/devices`}>
                  <TabsTrigger
                    value='devices'
                    className='data-[state=active]:bg-white data-[state=active]:text-blue-700'
                  >
                    {t("deviceTypes") || "Device Types"}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/models`}>
                  <TabsTrigger
                    value='models'
                    className='data-[state=active]:bg-white data-[state=active]:text-blue-700'
                  >
                    {t("models")}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/parts`}>
                  <TabsTrigger
                    value='parts'
                    className='data-[state=active]:bg-white data-[state=active]:text-blue-700'
                  >
                    {t("repairParts")}
                  </TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* Call to Action */}
      <div className='bg-blue-600 py-16 mt-12'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-white text-2xl md:text-3xl font-bold mb-4'>
            {t("needHelpWithDevice") || "Need Help with Your Device?"}
          </h2>
          <p className='text-blue-100 max-w-2xl mx-auto mb-8'>
            {t("repairConsultationDescription") ||
              "Our expert technicians are ready to diagnose and repair your device quickly and efficiently. Schedule a repair appointment or check the status of your existing repair."}
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {" "}
            <div>
              <Button
                size='lg'
                className='bg-white text-blue-700 hover:bg-blue-50 transition-colors'
                asChild
              >
                <Link href={`/${locale}/repair/schedule`}>
                  {t("scheduleRepair")}
                </Link>
              </Button>
            </div>{" "}
            <div>
              <Button
                size='lg'
                variant='outline'
                className='bg-transparent text-white border-white hover:bg-blue-700 hover:text-white transition-colors'
                asChild
              >
                <Link href={`/${locale}/repair/track`}>{t("trackRepair")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairLayout;
