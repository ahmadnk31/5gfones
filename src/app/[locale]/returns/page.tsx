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
import {
  RefreshCwIcon,
  PackageIcon,
  TruckIcon,
  CreditCardIcon,
  HelpCircleIcon,
} from "lucide-react";

export default function ReturnsPage() {
  const t = useTranslations("returnsPolicy");

  return (
    <div className='container mx-auto py-12 px-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold mb-2'>
          {t("title", { defaultValue: "Returns & Refunds Policy" })}
        </h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          {t("subtitle", {
            defaultValue:
              "Information about our return process, eligibility, and refund procedures",
          })}
        </p>
      </div>

      <div className='max-w-4xl mx-auto'>
        <Card className='mb-10'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <RefreshCwIcon className='h-6 w-6 text-primary' />
              <p className='text-sm text-muted-foreground'>
                {t("lastUpdated", {
                  date: "May 11, 2025",
                  defaultValue: "Last Updated: {date}",
                })}
              </p>
            </div>
            <div className='prose dark:prose-invert max-w-none'>
              <p>
                {t("introduction", {
                  defaultValue:
                    "At FinOpenPOS, we want you to be completely satisfied with your purchase. If you're not entirely happy with your order, we're here to help.",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='summary' className='mb-10'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='summary'>
              {t("summary", { defaultValue: "Summary" })}
            </TabsTrigger>
            <TabsTrigger value='full'>
              {t("fullPolicy", { defaultValue: "Full Policy" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='summary' className='mt-6 space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    <PackageIcon className='h-5 w-5 text-primary' />
                    <h3 className='font-semibold'>
                      {t("returnEligibility.title", {
                        defaultValue: "Return Eligibility",
                      })}
                    </h3>
                  </div>
                  <ul className='space-y-2 text-sm'>
                    <li>
                      {t("returnEligibility.point1", {
                        defaultValue: "30-day return window",
                      })}
                    </li>
                    <li>
                      {t("returnEligibility.point2", {
                        defaultValue:
                          "Items must be unused and in original packaging",
                      })}
                    </li>
                    <li>
                      {t("returnEligibility.point3", {
                        defaultValue:
                          "Some items are non-returnable (software, custom items)",
                      })}
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    <TruckIcon className='h-5 w-5 text-primary' />
                    <h3 className='font-semibold'>
                      {t("returnProcess.title", {
                        defaultValue: "Return Process",
                      })}
                    </h3>
                  </div>
                  <ul className='space-y-2 text-sm'>
                    <li>
                      {t("returnProcess.point1", {
                        defaultValue: "Log in and request through 'My Orders'",
                      })}
                    </li>
                    <li>
                      {t("returnProcess.point2", {
                        defaultValue: "Ship items back using our return label",
                      })}
                    </li>
                    <li>
                      {t("returnProcess.point3", {
                        defaultValue: "Track return status in your account",
                      })}
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    <CreditCardIcon className='h-5 w-5 text-primary' />
                    <h3 className='font-semibold'>
                      {t("refunds.title", { defaultValue: "Refund Process" })}
                    </h3>
                  </div>
                  <ul className='space-y-2 text-sm'>
                    <li>
                      {t("refunds.point1", {
                        defaultValue: "Processed within 3-5 business days",
                      })}
                    </li>
                    <li>
                      {t("refunds.point2", {
                        defaultValue: "Credit card refunds: 5-10 business days",
                      })}
                    </li>
                    <li>
                      {t("refunds.point3", {
                        defaultValue: "PayPal refunds: 24-48 hours",
                      })}
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-2 mb-4'>
                    <HelpCircleIcon className='h-5 w-5 text-primary' />
                    <h3 className='font-semibold'>
                      {t("specialCases.title", {
                        defaultValue: "Special Cases",
                      })}
                    </h3>
                  </div>
                  <ul className='space-y-2 text-sm'>
                    <li>
                      {t("specialCases.point1", {
                        defaultValue: "Damaged items: Contact within 48 hours",
                      })}
                    </li>
                    <li>
                      {t("specialCases.point2", {
                        defaultValue:
                          "Incorrect items: Replacement or full refund",
                      })}
                    </li>
                    <li>
                      {t("specialCases.point3", {
                        defaultValue: "Repair services: Special terms apply",
                      })}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='full' className='mt-6'>
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem value='section-1'>
                <AccordionTrigger className='font-semibold'>
                  {t("section1.title", { defaultValue: "Return Eligibility" })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section1.content1", {
                      defaultValue:
                        "We offer a 30-day return policy for most items purchased from our store. To be eligible for a return, the item must be unused, in its original packaging, and in the same condition as when you received it.",
                    })}
                  </p>
                  <p>
                    {t("section1.content2", {
                      defaultValue: "Non-returnable items include:",
                    })}
                  </p>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>
                      {t("section1.nonReturnable1", {
                        defaultValue: "Software licenses and digital products",
                      })}
                    </li>
                    <li>
                      {t("section1.nonReturnable2", {
                        defaultValue: "Gift cards and promotional vouchers",
                      })}
                    </li>
                    <li>
                      {t("section1.nonReturnable3", {
                        defaultValue: "Custom-made or personalized items",
                      })}
                    </li>
                    <li>
                      {t("section1.nonReturnable4", {
                        defaultValue:
                          "Items marked as non-returnable at the time of purchase",
                      })}
                    </li>
                    <li>
                      {t("section1.nonReturnable5", {
                        defaultValue:
                          "Items with broken seals, unless defective",
                      })}
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-2'>
                <AccordionTrigger className='font-semibold'>
                  {t("section2.title", { defaultValue: "Return Process" })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section2.content1", {
                      defaultValue:
                        "To start a return, please follow these steps:",
                    })}
                  </p>
                  <ol className='list-decimal pl-5 space-y-3'>
                    <li>
                      {t("section2.process1", {
                        defaultValue:
                          "Log in to your account and navigate to 'My Orders'.",
                      })}
                    </li>
                    <li>
                      {t("section2.process2", {
                        defaultValue:
                          "Select the order containing the item(s) you wish to return.",
                      })}
                    </li>
                    <li>
                      {t("section2.process3", {
                        defaultValue:
                          "Click on 'Return Items' and select the specific products.",
                      })}
                    </li>
                    <li>
                      {t("section2.process4", {
                        defaultValue:
                          "Choose your return reason and preferred refund method.",
                      })}
                    </li>
                    <li>
                      {t("section2.process5", {
                        defaultValue:
                          "Print the return shipping label provided (if applicable).",
                      })}
                    </li>
                    <li>
                      {t("section2.process6", {
                        defaultValue:
                          "Package the item(s) securely with all original packaging and components.",
                      })}
                    </li>
                    <li>
                      {t("section2.process7", {
                        defaultValue:
                          "Ship the package using the provided label or your preferred carrier.",
                      })}
                    </li>
                  </ol>
                  <p>
                    {t("section2.content2", {
                      defaultValue:
                        "You can track your return status in your account under 'My Returns'.",
                    })}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-3'>
                <AccordionTrigger className='font-semibold'>
                  {t("section3.title", { defaultValue: "Refunds" })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section3.content1", {
                      defaultValue:
                        "After we receive and inspect your return, we will process your refund. The refund will be issued to your original payment method unless otherwise specified.",
                    })}
                  </p>
                  <p>
                    {t("section3.content2", {
                      defaultValue: "Refund processing times:",
                    })}
                  </p>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>
                      {t("section3.refundTime1", {
                        defaultValue:
                          "Credit card refunds: 5-10 business days to appear on your statement",
                      })}
                    </li>
                    <li>
                      {t("section3.refundTime2", {
                        defaultValue: "PayPal refunds: 24-48 hours",
                      })}
                    </li>
                    <li>
                      {t("section3.refundTime3", {
                        defaultValue: "Bank transfers: 3-7 business days",
                      })}
                    </li>
                    <li>
                      {t("section3.refundTime4", {
                        defaultValue: "Store credit: Immediate",
                      })}
                    </li>
                  </ul>
                  <p>
                    {t("section3.content3", {
                      defaultValue:
                        "If you haven't received your refund within the expected timeframe, please check your bank account again, then contact your credit card company or bank. It can sometimes take time for refunds to be officially posted.",
                    })}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-4'>
                <AccordionTrigger className='font-semibold'>
                  {t("section4.title", {
                    defaultValue: "Damaged or Incorrect Items",
                  })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section4.content1", {
                      defaultValue:
                        "If you receive damaged or incorrect items, please contact our customer service team within 48 hours of delivery. To expedite the process, please:",
                    })}
                  </p>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>
                      {t("section4.damagedProcess1", {
                        defaultValue:
                          "Take clear photos of the damaged items or packaging",
                      })}
                    </li>
                    <li>
                      {t("section4.damagedProcess2", {
                        defaultValue:
                          "Include your order number when contacting us",
                      })}
                    </li>
                    <li>
                      {t("section4.damagedProcess3", {
                        defaultValue:
                          "Keep all original packaging until the issue is resolved",
                      })}
                    </li>
                  </ul>
                  <p>
                    {t("section4.content2", {
                      defaultValue:
                        "For damaged or incorrect items, we will arrange for a replacement or issue a full refund including any shipping charges incurred.",
                    })}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-5'>
                <AccordionTrigger className='font-semibold'>
                  {t("section5.title", {
                    defaultValue: "Return Shipping Costs",
                  })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section5.content1", {
                      defaultValue:
                        "For standard returns (change of mind), customers are responsible for return shipping costs unless otherwise stated.",
                    })}
                  </p>
                  <p>
                    {t("section5.content2", {
                      defaultValue:
                        "We provide free return shipping in these cases:",
                    })}
                  </p>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>
                      {t("section5.freeReturn1", {
                        defaultValue: "Damaged or defective products",
                      })}
                    </li>
                    <li>
                      {t("section5.freeReturn2", {
                        defaultValue: "Incorrect items shipped",
                      })}
                    </li>
                    <li>
                      {t("section5.freeReturn3", {
                        defaultValue: "Items substantially not as described",
                      })}
                    </li>
                    <li>
                      {t("section5.freeReturn4", {
                        defaultValue:
                          "Products covered by specific promotions offering free returns",
                      })}
                    </li>
                  </ul>
                  <p>
                    {t("section5.content3", {
                      defaultValue:
                        "To use our pre-paid return label (when applicable), please select this option during the return initiation process in your account.",
                    })}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-6'>
                <AccordionTrigger className='font-semibold'>
                  {t("section6.title", {
                    defaultValue: "Repair Services Returns",
                  })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section6.content1", {
                      defaultValue:
                        "For repair services, different return terms apply:",
                    })}
                  </p>
                  <ul className='list-disc pl-5 space-y-1'>
                    <li>
                      {t("section6.repairReturn1", {
                        defaultValue:
                          "If you're unsatisfied with a repair, please contact us within 7 days of service completion",
                      })}
                    </li>
                    <li>
                      {t("section6.repairReturn2", {
                        defaultValue:
                          "All repairs include a 90-day warranty on both parts and labor",
                      })}
                    </li>
                    <li>
                      {t("section6.repairReturn3", {
                        defaultValue:
                          "If the same issue recurs within the warranty period, we'll fix it at no additional cost",
                      })}
                    </li>
                    <li>
                      {t("section6.repairReturn4", {
                        defaultValue:
                          "Our warranty doesn't cover new damage, water damage, or software issues unrelated to the original repair",
                      })}
                    </li>
                  </ul>
                  <p>
                    {t("section6.content2", {
                      defaultValue:
                        "For warranty service, bring your device to any of our locations with your repair receipt or warranty information.",
                    })}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='section-7'>
                <AccordionTrigger className='font-semibold'>
                  {t("section7.title", { defaultValue: "Contact Us" })}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-4 px-4'>
                  <p>
                    {t("section7.content1", {
                      defaultValue:
                        "If you have any questions about our return policy, please contact us:",
                    })}
                  </p>
                  <ul className='space-y-2'>
                    <li>
                      <strong>
                        {t("section7.email", { defaultValue: "Email" })}:
                      </strong>{" "}
                      support@5gphones.be
                    </li>
                    <li>
                      <strong>
                        {t("section7.phone", { defaultValue: "Phone" })}:
                      </strong>{" "}
                      +1 (555) 123-4567
                    </li>
                    <li>
                      <strong>
                        {t("section7.hours", { defaultValue: "Hours" })}:
                      </strong>{" "}
                      Mon-Fri: 10AM-6PM, Sat: 10AM-6:30PM
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        <div className='flex flex-col sm:flex-row justify-center gap-4 mt-12'>
          <Button variant='outline'>
            {t("contactSupport", { defaultValue: "Contact Support" })}
          </Button>
          <Button>
            {t("initiateReturn", { defaultValue: "Start a Return" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
