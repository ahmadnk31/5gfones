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
    |"services"
    | "models"
    | "parts";
}

const RepairLayout = ({ children, activeTab = "home" }: RepairLayoutProps) => {
  const t = useTranslations("repair");
  // Get the current locale for links
  const locale = useTranslations("common")("locale") || "en";

  return (
    <div>
      {/* Primary Repair Navigation */}      <div className='bg-white shadow-sm border-b sticky top-20 z-40 w-full'>
        <div className='container mx-auto px-4 flex justify-center'>
          <Tabs defaultValue={activeTab} className='w-full max-w-3xl'>
            <TabsList className='grid grid-cols-4 w-full'>
              <Link href={`/${locale}/repair`} className='w-full'>
                <TabsTrigger
                  value='home'
                  className='flex justify-center items-center gap-2 w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                >
                  <Phone className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("services")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/schedule`} className='w-full'>
                <TabsTrigger
                  value='schedule'
                  className='flex justify-center items-center gap-2 w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                >
                  <Calendar className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("schedule")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/track`} className='w-full'>
                <TabsTrigger
                  value='track'
                  className='flex justify-center items-center gap-2 w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                >
                  <Search className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("track")}</span>
                </TabsTrigger>
              </Link>
              <Link href={`/${locale}/repair/status`} className='w-full'>
                <TabsTrigger
                  value='status'
                  className='flex justify-center items-center gap-2 w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                >
                  <Wrench className='h-4 w-4' />
                  <span className='hidden sm:inline'>{t("status.name")}</span>
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
      </div>      {/* Secondary Navigation for Parts/Devices */}
      {(activeTab === "brands" ||
        activeTab === "devices" ||
        activeTab === "models" ||
        activeTab === "parts" ||
        activeTab === "home") && (
        <div className='bg-emerald-50/30 border-b sticky top-32 z-30'>
          <div className='container mx-auto px-4 flex justify-center'>
            <Tabs
              defaultValue={activeTab === "home" ? "parts" : activeTab}
              className='w-full max-w-3xl'
            >
              <TabsList className='h-auto w-full overflow-x-auto flex justify-center gap-2 py-2'>
                <Link href={`/${locale}/repair/brands`} className='flex-1 max-w-[150px]'>
                  <TabsTrigger
                    value='brands'
                    className='w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                  >
                    {t("brands")}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/devices`} className='flex-1 max-w-[150px]'>
                  <TabsTrigger
                    value='devices'
                    className='w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                  >
                    {t("deviceTypes") || "Device Types"}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/models`} className='flex-1 max-w-[150px]'>
                  <TabsTrigger
                    value='models'
                    className='w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
                  >
                    {t("models")}
                  </TabsTrigger>
                </Link>
                <Link href={`/${locale}/repair/parts`} className='flex-1 max-w-[150px]'>
                  <TabsTrigger
                    value='parts'
                    className='w-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700'
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
      {children}      {/* Call to Action */}
      <div className='bg-emerald-600 py-16 mt-12'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-white text-2xl md:text-3xl font-bold mb-4'>
            {t("needHelpWithDevice") || "Need Help with Your Device?"}
          </h2>
          <p className='text-emerald-100 max-w-2xl mx-auto mb-8'>
            {t("repairConsultationDescription") ||
              "Our expert technicians are ready to diagnose and repair your device quickly and efficiently. Schedule a repair appointment or check the status of your existing repair."}
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {" "}
            <div>
              <Button
                size='lg'
                className='bg-white text-emerald-700 hover:bg-emerald-50 transition-colors'
                asChild
              >
                <Link href={`/${locale}/repair/schedule`}>
                  {t("scheduleRepair")}
                </Link>
              </Button>
            </div>{" "}
            <div>              <Button
                size='lg'
                variant='outline'
                className='bg-transparent text-white border-white hover:bg-emerald-700 hover:text-white transition-colors'
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
