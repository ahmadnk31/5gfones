import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconArrowRight, IconDeviceMobile, IconExchange, IconStarFilled, IconCheck, IconPlus } from '@tabler/icons-react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function UpgradePage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const locale = params.locale;
  return (
    <main>
      {/* Hero Section with full-width background */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                {t("app.tradeIn.upgrade.title") || "Upgrade Your Device"}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg">
                {t("app.tradeIn.upgrade.description") || 
                  "Trade in your current phone and get extra credit toward your next purchase of a new or refurbished device."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sell-phone">
                  <Button size="lg" variant="secondary" className="flex items-center gap-2">
                    {t("app.tradeIn.startProcess") || "Start Upgrade Process"}
                    <IconArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-blue-700">
                    {t("common.viewDevices") || "Browse Devices"}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <Image 
                src="/images/upgrade-device.png" 
                alt="Upgrade your device" 
                width={500} 
                height={400}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            <Link href="/sell-phone" className="flex items-center text-blue-600 hover:text-blue-800">
              <IconArrowLeft className="mr-2" size={16} />
              {t("common.backTo", { page: t("navigation.sellPhone") })}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Benefits Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">
              {t("app.tradeIn.upgrade.subtitle") || "Get the Latest Technology"}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {t("app.tradeIn.upgrade.description") || 
                "Trade in your current device and upgrade to the latest technology. We offer competitive values for your trade-in and special discounts on new purchases."}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">                <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <IconDeviceMobile size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("app.tradeIn.upgrade.benefit1") || "Get instant credit toward a new device"}
              </h3>
              <p className="text-gray-600">
                Receive immediate credit for your current device that you can put towards a brand new phone or upgrade.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <IconExchange size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("app.tradeIn.upgrade.benefit2") || "Enjoy special discounts on new purchases"}
              </h3>
              <p className="text-gray-600">
                Access exclusive promotions and additional discounts when you trade in your device through our upgrade program.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                <IconPlus size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("app.tradeIn.upgrade.benefit3") || "Free data transfer to your new device"}
              </h3>
              <p className="text-gray-600">
                Our expert team will transfer all your contacts, photos, and important data to your new device at no additional cost.
              </p>
            </div>
          </div>
        </section>
          {/* How It Works Section - with process flow visual */}
        <section className="mb-16 bg-gray-50 p-8 rounded-xl">
          <h2 className="text-3xl font-bold mb-10 text-center">
            {t("app.tradeIn.upgrade.howItWorks") || "How It Works"}
          </h2>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] h-1 bg-green-300 -translate-y-1/2 z-0"></div>
            
            <div className="grid md:grid-cols-3 gap-10 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("app.tradeIn.upgrade.step1Title") || "Evaluate Your Device"}
                </h3>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.step1Desc") || "Tell us about your current device to get an estimated trade-in value."}
                </p>
              </div>
                <div className="flex flex-col items-center text-center">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("app.tradeIn.upgrade.step2Title") || "Choose a New Device"}
                </h3>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.step2Desc") || "Browse our collection of latest devices and select your upgrade."}
                </p>
              </div>
                <div className="flex flex-col items-center text-center">
                <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("app.tradeIn.upgrade.step3Title") || "Complete the Exchange"}
                </h3>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.step3Desc") || "Bring your old device to our store or mail it in and receive your new one."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/sell-phone">
              <Button size="lg" className="flex items-center gap-2">
                {t("app.tradeIn.startProcess") || "Start Upgrade Process"}
                <IconArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Comparison Section - Why Upgrade */}
        <section className="mb-16">          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">{t("app.tradeIn.upgrade.whyUpgrade") || "Why Upgrade Now?"}</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {t("app.tradeIn.upgrade.whyUpgradeSubtitle") || "See how the latest devices compare to your current phone with these key improvements"}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-8">                <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-400">
                  <span className="mr-2">{t("app.tradeIn.upgrade.comparison.older") || "Older Devices"}</span>
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-gray-200 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>                    <p className="text-gray-600">{t("app.tradeIn.upgrade.comparison.oldFeature1") || "Slower performance with aging processor"}</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-200 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600">{t("app.tradeIn.upgrade.comparison.oldFeature2") || "Limited battery life that deteriorates over time"}</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-200 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>                    <p className="text-gray-600">{t("app.tradeIn.upgrade.comparison.oldFeature3") || "Basic camera functionality with lower resolution"}</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-200 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600">{t("app.tradeIn.upgrade.comparison.oldFeature4") || "Limited or no 5G connectivity capabilities"}</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-200 rounded-full p-1 mr-3 mt-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>                    <p className="text-gray-600">{t("app.tradeIn.upgrade.comparison.oldFeature5") || "May no longer receive security updates"}</p>
                  </li>
                </ul>
              </div>
              <div className="p-8 bg-green-50"><h3 className="text-xl font-semibold mb-4 flex items-center text-green-600">
                  <span className="mr-2">Latest Devices</span>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">RECOMMENDED</span>
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <IconCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-800">Lightning-fast processing speed with latest chipsets</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <IconCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-800">All-day battery life with fast charging capabilities</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <IconCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-800">Advanced camera systems with AI-powered photography</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <IconCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-800">Ultra-fast 5G connectivity and WiFi 6 support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <IconCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-gray-800">Regular security updates and latest OS features</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-10 text-center">Customer Experiences</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
              </div>              <p className="text-gray-600 italic mb-6">
                &quot;The upgrade process was incredibly smooth. I traded in my old phone and got a great deal on the newest model. The data transfer was handled professionally and I walked out with everything set up.&quot;
              </p>
              <div className="flex items-center">                <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center text-green-700 font-bold">
                  SM
                </div>
                <div>
                  <h4 className="font-semibold">Sarah M.</h4>
                  <p className="text-sm text-gray-500">Upgraded from iPhone 12 to 14 Pro</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
              </div>              <p className="text-gray-600 italic mb-6">
                &quot;I was shocked by how much they offered for my old Samsung. The credit made a significant dent in the cost of my new Galaxy. The staff was incredibly helpful throughout the process.&quot;
              </p>
              <div className="flex items-center">                <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center text-green-700 font-bold">
                  JT
                </div>
                <div>
                  <h4 className="font-semibold">James T.</h4>
                  <p className="text-sm text-gray-500">Upgraded from Galaxy S20 to S22 Ultra</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
                <IconStarFilled size={20} />
              </div>              <p className="text-gray-600 italic mb-6">
                &quot;As someone who was worried about losing photos and contacts during the switch, I was pleasantly surprised by how seamless the process was. Everything was transferred perfectly to my new device.&quot;
              </p>
              <div className="flex items-center">                <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center text-green-700 font-bold">
                  AL
                </div>
                <div>
                  <h4 className="font-semibold">Ana L.</h4>
                  <p className="text-sm text-gray-500">Upgraded from Pixel 4 to Pixel 7</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="mb-16">          <h2 className="text-3xl font-bold mb-8 text-center">{t("app.tradeIn.upgrade.faq") || "Frequently Asked Questions"}</h2>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-medium">
                {t("app.tradeIn.upgrade.faqQuestions.q1") || "How do you determine the value of my current device?"}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.faqQuestions.a1") || "We evaluate devices based on the model, condition, storage capacity, and current market value. Factors like screen condition, functionality of buttons and cameras, and general wear and tear are all considered in our assessment."}
                </p>
              </AccordionContent>
            </AccordionItem>            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-medium">
                {t("app.tradeIn.upgrade.faqQuestions.q2") || "Can I trade in a device with a cracked screen?"}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.faqQuestions.a2") || "Yes! We accept devices with cracked screens and other imperfections. While these issues will affect the trade-in value, you can still get credit toward your new device purchase. Just be sure to accurately describe the condition during the evaluation process."}
                </p>
              </AccordionContent>
            </AccordionItem>            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-medium">
                {t("app.tradeIn.upgrade.faqQuestions.q3") || "How long does the upgrade process take?"}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.faqQuestions.a3") || "The entire process typically takes between 30-60 minutes if done in-store, including device evaluation, data transfer, and setting up your new phone. If you choose to mail in your device, processing may take 3-5 business days after we receive it."}
                </p>
              </AccordionContent>
            </AccordionItem>            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-medium">
                {t("app.tradeIn.upgrade.faqQuestions.q4") || "What should I do before trading in my device?"}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.faqQuestions.a4") || "We recommend backing up your data, signing out of all accounts (iCloud, Google, etc.), disabling any security features like Find My iPhone or Google's Find My Device, and performing a factory reset if possible. Don't worry if you need help with these steps - our staff can assist you in-store."}
                </p>
              </AccordionContent>
            </AccordionItem>            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-medium">
                {t("app.tradeIn.upgrade.faqQuestions.q5") || "Can I upgrade to any device or only specific models?"}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-gray-600">
                  {t("app.tradeIn.upgrade.faqQuestions.a5") || "You can upgrade to any new or refurbished device in our inventory. Your trade-in credit will be applied to the purchase regardless of which model you select. This flexibility allows you to choose the perfect device for your needs and budget."}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        
        {/* Final Call to Action */}
        <section className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
            <div>              <h2 className="text-3xl font-bold text-white mb-4">
                {t("app.tradeIn.upgrade.ctaTitle") || "Ready to Upgrade Your Device?"}
              </h2>
              <p className="text-green-100 mb-6">
                {t("app.tradeIn.upgrade.ctaSubtitle") || "Get started today and enjoy the benefits of the latest technology with our hassle-free upgrade process."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sell-phone">
                  <Button size="lg" variant="secondary" className="flex items-center gap-2">
                    {t("app.tradeIn.startProcess") || "Start Upgrade Process"}
                    <IconArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-green-700">
                    {t("app.tradeIn.upgrade.contactUs") || "Contact Us"}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative h-64">
              <Image
                src="/images/upgrade-devices-group.png" 
                alt="Modern smartphones" 
                fill
                className="object-contain"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
