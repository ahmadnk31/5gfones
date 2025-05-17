"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PackageIcon,
  TruckIcon,
  CalendarIcon,
  RefreshCcwIcon,
  GlobeIcon,
} from "lucide-react";

export default function ShippingPolicyPage() {
  const t = useTranslations("shipping.policy");
  const c = useTranslations("common");

  return (
    <div className='container mx-auto py-12 px-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold mb-2'>{t("title")}</h1>
        <p className='text-muted-foreground'>{t("subtitle")}</p>
      </div>

      <Tabs defaultValue='domestic' className='mb-10'>
        <TabsList className='grid w-full grid-cols-2 mb-8'>
          <TabsTrigger value='domestic'>{t("domesticShipping")}</TabsTrigger>
          <TabsTrigger value='international'>
            {t("internationalShipping")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value='domestic' className='space-y-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <TruckIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("standardShipping")}
                  </h2>
                  <p className='mb-2'>{t("standardDomesticDescription")}</p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4'>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("deliveryTime")}
                      </dt>
                      <dd className='font-medium'>
                        {t("standardDomesticTime")}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("shippingCost")}
                      </dt>
                      <dd className='font-medium'>
                        {t("standardDomesticCost")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <PackageIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("expressShipping")}
                  </h2>
                  <p className='mb-2'>{t("expressDomesticDescription")}</p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4'>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("deliveryTime")}
                      </dt>
                      <dd className='font-medium'>
                        {t("expressDomesticTime")}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("shippingCost")}
                      </dt>
                      <dd className='font-medium'>
                        {t("expressDomesticCost")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <CalendarIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("processingTime")}
                  </h2>
                  <p>{t("processingTimeDescription")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='international' className='space-y-8'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <GlobeIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("internationalInfo")}
                  </h2>
                  <p className='mb-4'>{t("internationalDescription")}</p>
                  <div className='bg-muted p-4 rounded-md'>
                    <h3 className='font-semibold mb-2'>{t("importantNote")}</h3>
                    <p className='text-sm'>{t("customsNote")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <TruckIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("standardInternational")}
                  </h2>
                  <p className='mb-2'>
                    {t("standardInternationalDescription")}
                  </p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4'>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("deliveryTime")}
                      </dt>
                      <dd className='font-medium'>
                        {t("standardInternationalTime")}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("shippingCost")}
                      </dt>
                      <dd className='font-medium'>
                        {t("standardInternationalCost")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start gap-4'>
                <PackageIcon className='h-8 w-8 text-primary shrink-0 mt-1' />
                <div>
                  <h2 className='text-xl font-bold mb-2'>
                    {t("expressInternational")}
                  </h2>
                  <p className='mb-2'>{t("expressInternationalDescription")}</p>
                  <dl className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4'>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("deliveryTime")}
                      </dt>
                      <dd className='font-medium'>
                        {t("expressInternationalTime")}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm text-muted-foreground'>
                        {t("shippingCost")}
                      </dt>
                      <dd className='font-medium'>
                        {t("expressInternationalCost")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <h2 className='text-2xl font-bold mb-6'>{t("additionalInformation")}</h2>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-start gap-4'>
              <RefreshCcwIcon className='h-6 w-6 text-primary shrink-0 mt-1' />
              <div>
                <h3 className='font-bold mb-2'>{t("trackingInfo")}</h3>
                <p>{t("trackingDescription")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-start gap-4'>
              <RefreshCcwIcon className='h-6 w-6 text-primary shrink-0 mt-1' />
              <div>
                <h3 className='font-bold mb-2'>{t("shippingRestrictions")}</h3>
                <p>{t("restrictionsDescription")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='mt-10'>
        <div className='bg-muted p-6 rounded-lg'>
          <h2 className='text-xl font-bold mb-4'>{t("faqs")}</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold mb-2'>{t("faq1.question")}</h3>
              <p className='text-muted-foreground'>{t("faq1.answer")}</p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>{t("faq2.question")}</h3>
              <p className='text-muted-foreground'>{t("faq2.answer")}</p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>{t("faq3.question")}</h3>
              <p className='text-muted-foreground'>{t("faq3.answer")}</p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>{t("faq4.question")}</h3>
              <p className='text-muted-foreground'>{t("faq4.answer")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
