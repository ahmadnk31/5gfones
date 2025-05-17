"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LockIcon, ShieldIcon, EyeIcon, MailIcon } from "lucide-react";

export default function PrivacyPolicyPage() {
  const t = useTranslations("privacy");

  return (
    <div className='container mx-auto py-12 px-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold mb-2'>{t("title")}</h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          {t("subtitle")}
        </p>
      </div>

      <div className='max-w-4xl mx-auto'>
        <Card className='mb-10'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <ShieldIcon className='h-6 w-6 text-primary' />
              <p className='text-sm text-muted-foreground'>
                {t("lastUpdated", { date: "May 11, 2025" })}
              </p>
            </div>
            <div className='prose dark:prose-invert max-w-none'>
              <p>{t("introduction")}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='summary' className='mb-10'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='summary'>{t("summary")}</TabsTrigger>
            <TabsTrigger value='full'>{t("fullPolicy")}</TabsTrigger>
          </TabsList>

          <TabsContent value='summary' className='mt-6 space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex flex-col items-center text-center gap-4 py-4'>
                    <div className='rounded-full bg-primary/10 p-3'>
                      <EyeIcon className='h-6 w-6 text-primary' />
                    </div>
                    <div>
                      <h3 className='font-bold mb-2'>{t("summary1.title")}</h3>
                      <p className='text-muted-foreground text-sm'>
                        {t("summary1.content")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex flex-col items-center text-center gap-4 py-4'>
                    <div className='rounded-full bg-primary/10 p-3'>
                      <LockIcon className='h-6 w-6 text-primary' />
                    </div>
                    <div>
                      <h3 className='font-bold mb-2'>{t("summary2.title")}</h3>
                      <p className='text-muted-foreground text-sm'>
                        {t("summary2.content")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className='p-6'>
                <h3 className='font-bold mb-4'>{t("keyPoints")}</h3>
                <ul className='space-y-3 text-muted-foreground text-sm'>
                  <li className='flex items-start gap-2'>
                    <span className='text-primary font-bold'>•</span>
                    <span>{t("keyPoint1")}</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-primary font-bold'>•</span>
                    <span>{t("keyPoint2")}</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-primary font-bold'>•</span>
                    <span>{t("keyPoint3")}</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-primary font-bold'>•</span>
                    <span>{t("keyPoint4")}</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-primary font-bold'>•</span>
                    <span>{t("keyPoint5")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='full' className='mt-6'>
            <Accordion type='single' collapsible className='w-full space-y-4'>
              <AccordionItem
                value='section-1'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section1.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section1.content1")}</p>
                    <p>{t("section1.content2")}</p>
                    <ul className='list-disc pl-5 space-y-2'>
                      <li>{t("section1.list.item1")}</li>
                      <li>{t("section1.list.item2")}</li>
                      <li>{t("section1.list.item3")}</li>
                      <li>{t("section1.list.item4")}</li>
                      <li>{t("section1.list.item5")}</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-2'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section2.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section2.content1")}</p>
                    <p>{t("section2.content2")}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-3'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section3.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section3.content1")}</p>
                    <p>{t("section3.content2")}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-4'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section4.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section4.content1")}</p>
                    <p>{t("section4.content2")}</p>
                    <div className='bg-muted p-4 rounded-md mt-4'>
                      <h4 className='font-medium mb-2'>
                        {t("section4.cookiesTitle")}
                      </h4>
                      <p className='text-sm mb-2'>
                        {t("section4.cookiesDescription")}
                      </p>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
                        <div>
                          <span className='font-medium'>
                            {t("section4.cookieTypes.essential")}:{" "}
                          </span>
                          <span>{t("section4.cookieTypes.essentialDesc")}</span>
                        </div>
                        <div>
                          <span className='font-medium'>
                            {t("section4.cookieTypes.preferences")}:{" "}
                          </span>
                          <span>
                            {t("section4.cookieTypes.preferencesDesc")}
                          </span>
                        </div>
                        <div>
                          <span className='font-medium'>
                            {t("section4.cookieTypes.statistics")}:{" "}
                          </span>
                          <span>
                            {t("section4.cookieTypes.statisticsDesc")}
                          </span>
                        </div>
                        <div>
                          <span className='font-medium'>
                            {t("section4.cookieTypes.marketing")}:{" "}
                          </span>
                          <span>{t("section4.cookieTypes.marketingDesc")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-5'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section5.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section5.content1")}</p>
                    <p>{t("section5.content2")}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-6'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section6.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section6.content1")}</p>
                    <ul className='list-disc pl-5 space-y-2'>
                      <li>{t("section6.list.item1")}</li>
                      <li>{t("section6.list.item2")}</li>
                      <li>{t("section6.list.item3")}</li>
                      <li>{t("section6.list.item4")}</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value='section-7'
                className='border rounded-lg px-6'
              >
                <AccordionTrigger className='py-4 text-lg font-semibold'>
                  {t("section7.title")}
                </AccordionTrigger>
                <AccordionContent className='pt-2 pb-6'>
                  <div className='space-y-4 text-muted-foreground'>
                    <p>{t("section7.content1")}</p>
                    <p>{t("section7.content2")}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        <Card className='mt-10'>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row gap-6 items-center'>
              <div className='flex-1 text-center sm:text-left'>
                <h2 className='text-xl font-bold mb-2'>{t("contactTitle")}</h2>
                <p className='text-muted-foreground mb-4'>
                  {t("contactDescription")}
                </p>
                <div className='flex items-center gap-2 mb-2'>
                  <MailIcon className='h-4 w-4 text-primary' />
                  <a
                    href='mailto:privacy@finopenspos.com'
                    className='hover:underline'
                  >
                    {t("email")}
                  </a>
                </div>
              </div>
              <div>
                <Button>{t("contactButton")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
