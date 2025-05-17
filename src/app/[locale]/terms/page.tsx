"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TermsAndConditionsPage() {
  const t = useTranslations("terms");

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
            <p className='text-sm text-muted-foreground mb-6'>
              {t("lastUpdated", { date: "May 11, 2025" })}
            </p>
            <div className='prose dark:prose-invert max-w-none'>
              <p>{t("introduction")}</p>
            </div>
          </CardContent>
        </Card>

        <Accordion type='single' collapsible className='w-full space-y-4'>
          <AccordionItem value='section-1' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section1.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section1.content1")}</p>
                <p>{t("section1.content2")}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='section-2' className='border rounded-lg px-6'>
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

          <AccordionItem value='section-3' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section3.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section3.content1")}</p>
                <p>{t("section3.content2")}</p>
                <ul className='list-disc pl-5 space-y-2'>
                  <li>{t("section3.list.item1")}</li>
                  <li>{t("section3.list.item2")}</li>
                  <li>{t("section3.list.item3")}</li>
                  <li>{t("section3.list.item4")}</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='section-4' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section4.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section4.content1")}</p>
                <p>{t("section4.content2")}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='section-5' className='border rounded-lg px-6'>
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

          <AccordionItem value='section-6' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section6.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section6.content1")}</p>
                <p>{t("section6.content2")}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='section-7' className='border rounded-lg px-6'>
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

          <AccordionItem value='section-8' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section8.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section8.content1")}</p>
                <p>{t("section8.content2")}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='section-9' className='border rounded-lg px-6'>
            <AccordionTrigger className='py-4 text-lg font-semibold'>
              {t("section9.title")}
            </AccordionTrigger>
            <AccordionContent className='pt-2 pb-6'>
              <div className='space-y-4 text-muted-foreground'>
                <p>{t("section9.content1")}</p>
                <p>{t("section9.content2")}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className='mt-10'>
          <CardContent className='p-6'>
            <h2 className='text-xl font-bold mb-4'>{t("contactTitle")}</h2>
            <p className='mb-4'>{t("contactDescription")}</p>
            <ul className='list-disc pl-5 space-y-2 text-muted-foreground'>
              <li>
                <strong>{t("emailLabel")}:</strong> {t("email")}
              </li>
              <li>
                <strong>{t("phoneLabel")}:</strong> {t("phone")}
              </li>
              <li>
                <strong>{t("addressLabel")}:</strong> {t("address")}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
