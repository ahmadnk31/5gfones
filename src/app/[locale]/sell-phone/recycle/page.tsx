import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { 
  IconArrowLeft, 
  IconArrowRight, 
  IconRecycle, 
  IconLeaf, 
  IconCertificate,
  IconTruck,
  IconCalendarStats 
} from '@tabler/icons-react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function RecyclePage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const locale = params.locale;
    return (
    <>
      {/* Hero section with sticky navigation */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white relative">
        <div className="container mx-auto px-4">
          {/* Navigation */}
          <nav className="py-4 sticky top-0 px-2 z-10 backdrop-blur-sm bg-emerald-600/90">
            <div className="flex items-center justify-between">
              <Link href="/sell-phone" className="flex items-center text-white hover:text-emerald-100">
                <IconArrowLeft className="mr-2" size={16} />
                {t("common.backTo", { page: t("navigation.sellPhone") })}
              </Link>
              
              <div className="flex items-center space-x-6">
                <a href="#how-it-works" className="hover:text-emerald-100">
                  {t("recycle.howItWorks") || "How It Works"}
                </a>
                <a href="#benefits" className="hover:text-emerald-100">
                  {t("recycle.benefits") || "Benefits"}
                </a>
                <a href="#faq" className="hover:text-emerald-100">
                  {t("recycle.faq") || "FAQ"}
                </a>
                <Link href="/sell-phone">
                  <Button size="sm" variant="outline" className="bg-white text-emerald-700 hover:bg-emerald-50">
                    {t("recycle.startNow") || "Start Now"}
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
          
          {/* Hero content */}
          <div className="py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                {t("app.tradeIn.recycle.title") || "Recycle Your Old Device"}
              </h1>
              
              <p className="text-xl mb-8 max-w-lg">
                {t("app.tradeIn.recycle.description") || 
                  "Don't throw your old electronics in the trash. Recycle them responsibly with our program and help protect the environment."}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/sell-phone">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
                    {t("recycle.startProcess") || "Start Recycling Process"}
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" className="border-white  hover:bg-emerald-700">
                    {t("recycle.learnMore") || "Learn More"} 
                    <IconArrowRight className="ml-2" size={18} />
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Image 
                src="/images/services/recycle-device.png" 
                alt="Recycle your device" 
                width={500} 
                height={400}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">      
        <div className="max-w-6xl mx-auto">
          {/* Benefits */}
          <div id="benefits" className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              {t("recycle.whyRecycle") || "Why Recycle With Us?"}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto bg-emerald-100 h-16 w-16 flex items-center justify-center rounded-full mb-4">
                  <IconLeaf className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("recycle.environmentalBenefit") || "Environmental Impact"}
                </h3>
                <p className="text-gray-600">
                  {t("recycle.environmentalDesc") || 
                    "Prevent harmful materials from ending up in landfills and reduce the need for raw material mining."}
                </p>
              </div>
              
              <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto bg-emerald-100 h-16 w-16 flex items-center justify-center rounded-full mb-4">
                  <IconCertificate className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("recycle.certifiedBenefit") || "Certified Process"}
                </h3>
                <p className="text-gray-600">
                  {t("recycle.certifiedDesc") || 
                    "Our recycling partners follow strict environmental guidelines and data security protocols."}
                </p>
              </div>
              
              <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto bg-emerald-100 h-16 w-16 flex items-center justify-center rounded-full mb-4">
                  <IconTruck className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {t("recycle.freePickupBenefit") || "Free Pickup Service"}
                </h3>
                <p className="text-gray-600">
                  {t("recycle.freePickupDesc") || 
                    "We offer convenient pickup options for multiple devices, making recycling effortless for you."}
                </p>
              </div>
            </div>
          </div>
          
          {/* How It Works Section */}      <div id="how-it-works" className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              {t("recycle.howItWorks") || "How It Works"}
            </h2>
            
            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-emerald-200 -translate-x-1/2 hidden md:block"></div>
                
              <div className="space-y-12 relative">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/2 flex justify-end order-1 md:order-1">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                      <div className="bg-emerald-100 h-12 w-12 flex items-center justify-center rounded-full mb-4">
                        <span className="text-emerald-700 font-bold text-xl">1</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {t("recycle.step1Title") || "Register Your Device"}
                      </h3>
                      <p className="text-gray-600">
                        {t("recycle.step1Desc") || 
                          "Tell us what devices you want to recycle using our easy online form. We accept phones, tablets, laptops, and other electronics."}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/2 order-2 md:order-2">
                    <Image 
                      src="/images/recycle-register.png" 
                      alt="Register device" 
                      width={300} 
                      height={200}
                      className="rounded-lg object-contain mx-auto"
                    />
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/2 order-1 md:order-2">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                      <div className="bg-emerald-100 h-12 w-12 flex items-center justify-center rounded-full mb-4">
                        <span className="text-emerald-700 font-bold text-xl">2</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {t("recycle.step2Title") || "Schedule a Pickup or Drop-off"}
                      </h3>
                      <p className="text-gray-600">
                        {t("recycle.step2Desc") || 
                          "Choose whether you'd like us to pick up the device from your location or if you prefer to drop it off at one of our recycling centers."}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/2 flex justify-end order-2 md:order-1">
                    <Image 
                      src="/images/recycle-pickup.png" 
                      alt="Schedule pickup" 
                      width={300} 
                      height={200}
                      className="rounded-lg object-contain mx-auto"
                    />
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/2 flex justify-end order-1 md:order-1">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                      <div className="bg-emerald-100 h-12 w-12 flex items-center justify-center rounded-full mb-4">
                        <span className="text-emerald-700 font-bold text-xl">3</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {t("recycle.step3Title") || "Secure Data Wiping"}
                      </h3>
                      <p className="text-gray-600">
                        {t("recycle.step3Desc") || 
                          "All devices undergo certified data wiping procedures to ensure your personal information is completely removed and unrecoverable."}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/2 order-2 md:order-2">
                    <Image 
                      src="/images/data-wipe.png" 
                      alt="Data wiping" 
                      width={300} 
                      height={200}
                      className="rounded-lg object-contain mx-auto"
                    />
                  </div>
                </div>
                
                {/* Step 4 */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-1/2 order-1 md:order-2">
                    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                      <div className="bg-emerald-100 h-12 w-12 flex items-center justify-center rounded-full mb-4">
                        <span className="text-emerald-700 font-bold text-xl">4</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {t("recycle.step4Title") || "Environmentally Friendly Recycling"}
                      </h3>
                      <p className="text-gray-600">
                        {t("recycle.step4Desc") || 
                          "Your devices are broken down and recycled following strict environmental standards. We'll send you a certificate of recycling upon completion."}
                      </p>
                    </div>
                  </div>
                  <div className="md:w-1/2 flex justify-end order-2 md:order-1">
                    <Image 
                      src="/images/eco-recycling.png" 
                      alt="Environmentally friendly recycling" 
                      width={300} 
                      height={200}
                      className="rounded-lg object-contain mx-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100 rounded-full p-2 mr-3 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p>{t("app.tradeIn.recycle.benefit1") || "Free recycling of all electronic devices"}</p>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 rounded-full p-2 mr-3 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p>{t("app.tradeIn.recycle.benefit2") || "Secure data wiping on all devices"}</p>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 rounded-full p-2 mr-3 mt-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p>{t("app.tradeIn.recycle.benefit3") || "Certificate of responsible recycling"}</p>
              </div>
            </div>
            
            <div className="mt-8">
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full md:w-auto flex items-center gap-2">
                  {t("app.tradeIn.recycle.startProcess") || "Start Recycling Process"}
                  <IconArrowRight size={16} />
                </Button>
              </Link>
                </div>
              </div>
              
              {/* FAQ Section would go here */}
            
              <div className="bg-green-50 rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-center">
                  {t("app.tradeIn.recycle.howItWorks") || "How It Works"}
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <span className="text-green-600 text-2xl font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">
                      {t("app.tradeIn.recycle.step1Title") || "Register Your Device"}
                    </h3>
                    <p className="text-gray-600">
                      {t("app.tradeIn.recycle.step1Desc") || "Tell us about the device you want to recycle."}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <span className="text-green-600 text-2xl font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">
                      {t("app.tradeIn.recycle.step2Title") || "Drop Off or Ship"}
                    </h3>
                    <p className="text-gray-600">
                      {t("app.tradeIn.recycle.step2Desc") || "Bring your device to our store or request a free shipping label."}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                      <span className="text-green-600 text-2xl font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">
                      {t("app.tradeIn.recycle.step3Title") || "Receive Certificate"}
                    </h3>
                    <p className="text-gray-600">
                      {t("app.tradeIn.recycle.step3Desc") || "Get a certificate confirming your device was recycled responsibly."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

