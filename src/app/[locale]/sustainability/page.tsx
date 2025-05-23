"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

import {
  Leaf,
  Recycle,
  LifeBuoy,
  TreePine,
  Battery,
  BookOpen,
  Trophy,
  PackageOpen,
  Truck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function SustainabilityPage() {
  const t = useTranslations("sustainability");


  return (
    <div className='container mx-auto py-12 px-4'>
      {/* Hero Section */}
      <section className='relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl overflow-hidden mb-16'>
        <div className='absolute inset-0 opacity-20'>
          <div className="absolute inset-0 bg-[url('/sustainability-pattern.svg')] bg-repeat opacity-30"></div>
        </div>
        <div className='relative px-8 py-16 md:py-24 lg:px-16 flex flex-col items-center text-center'>
          <Leaf className='w-16 h-16 mb-6' />
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>
            {t("heroTitle", {
              defaultValue: "Our Commitment to Sustainability",
            })}
          </h1>
          <p className='text-xl max-w-3xl mb-8'>
            {t("heroSubtitle", {
              defaultValue:
                "Taking meaningful actions today for a greener tomorrow in Belgium and beyond",
            })}
          </p>
          <Button size='lg' asChild>
            <a href='#initiatives'>
              {t("learnMore", {
                defaultValue: "Learn More About Our Initiatives",
              })}
            </a>
          </Button>
        </div>
      </section>

      {/* Key Stats */}
      <section className='mb-16'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='bg-card/50 border-2 border-emerald-200 dark:border-emerald-900'>
            <CardContent className='p-6 flex flex-col items-center text-center'>
              <Recycle className='w-12 h-12 text-emerald-600 mb-4' />
              <h3 className='text-3xl font-bold mb-2'>
                {t("recycledScreensCount", { defaultValue: "5,000+" })}
              </h3>
              <p className='text-muted-foreground'>
                {t("recycledScreensText", {
                  defaultValue: "Phone screens recycled since 2022",
                })}
              </p>
            </CardContent>
          </Card>

          <Card className='bg-card/50 border-2 border-emerald-200 dark:border-emerald-900'>
            <CardContent className='p-6 flex flex-col items-center text-center'>
              <TreePine className='w-12 h-12 text-emerald-600 mb-4' />
              <h3 className='text-3xl font-bold mb-2'>
                {t("co2Reduction", { defaultValue: "60 tons" })}
              </h3>
              <p className='text-muted-foreground'>
                {t("co2ReductionText", {
                  defaultValue: "CO₂ emissions saved through our practices",
                })}
              </p>
            </CardContent>
          </Card>

          <Card className='bg-card/50 border-2 border-emerald-200 dark:border-emerald-900'>
            <CardContent className='p-6 flex flex-col items-center text-center'>
              <Battery className='w-12 h-12 text-emerald-600 mb-4' />
              <h3 className='text-3xl font-bold mb-2'>
                {t("batteryCount", { defaultValue: "8,500+" })}
              </h3>
              <p className='text-muted-foreground'>
                {t("batteryText", {
                  defaultValue: "Batteries properly recycled & repurposed",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className='mb-16' id='initiatives'>
        <Tabs defaultValue='recycling' className='w-full'>
          <TabsList className='w-full flex max-w-3xl mx-auto mb-8 h-auto flex-wrap justify-center'>
            <TabsTrigger value='recycling' className='py-2 px-4'>
              <Recycle className='w-4 h-4 mr-2' />
              {t("recyclingTab", { defaultValue: "Screen Recycling" })}
            </TabsTrigger>
            <TabsTrigger value='initiatives' className='py-2 px-4'>
              <Leaf className='w-4 h-4 mr-2' />
              {t("initiativesTab", { defaultValue: "Initiatives" })}
            </TabsTrigger>
            <TabsTrigger value='impact' className='py-2 px-4'>
              <LifeBuoy className='w-4 h-4 mr-2' />
              {t("impactTab", { defaultValue: "Environmental Impact" })}
            </TabsTrigger>
            <TabsTrigger value='partners' className='py-2 px-4'>
              <BookOpen className='w-4 h-4 mr-2' />
              {t("partnersTab", { defaultValue: "Partners & Certifications" })}
            </TabsTrigger>
          </TabsList>

          {/* Screen Recycling Tab Content */}
          <TabsContent value='recycling' className='space-y-8'>
            <div className='flex flex-col md:flex-row items-center gap-8'>
              <div className='md:w-1/2'>
                <h2 className='text-3xl font-bold mb-4'>
                  {t("recyclingTitle", {
                    defaultValue: "Phone Screen Recycling Program",
                  })}
                </h2>
                <p className='mb-4'>
                  {t("recyclingDesc1", {
                    defaultValue:
                      "Mobile phone screens contain valuable rare materials like indium and gold that can be extracted and reused. Our specialized recycling process ensures these materials don't end up in landfills.",
                  })}
                </p>
                <p className='mb-4'>
                  {t("recyclingDesc2", {
                    defaultValue:
                      "When you bring your old devices to us, we properly dismantle them and send the components to certified Belgian recycling facilities. This process reduces the need for environmentally harmful mining and helps create a circular economy.",
                  })}
                </p>
                <div className='flex flex-col sm:flex-row gap-4 mt-6'>
                  <Button>
                    {t("recycleButton", {
                      defaultValue: "Recycle Your Device",
                    })}
                  </Button>
                  <Button variant='outline'>
                    {t("learnProcessButton", {
                      defaultValue: "Learn About Our Process",
                    })}
                  </Button>
                </div>
              </div>
              <div className='md:w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg p-4'>
                <div className='relative h-80 w-full rounded-lg overflow-hidden'>
                  <div className='absolute inset-0 flex items-center justify-center text-muted-foreground text-sm'>
                    {t("imageAlt", {
                      defaultValue: "Phone screen recycling process",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Card className='mt-8'>
              <CardContent className='p-6'>
                <h3 className='text-2xl font-semibold mb-4'>
                  {t("recyclingStatsTitle", {
                    defaultValue: "The Impact of Screen Recycling",
                  })}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='flex flex-col items-center text-center'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4 mb-3'>
                      <Recycle className='h-6 w-6 text-emerald-600' />
                    </div>
                    <h4 className='font-semibold mb-2'>
                      {t("rareMetalsTitle", {
                        defaultValue: "Rare Metals Recovery",
                      })}
                    </h4>
                    <p className='text-sm text-muted-foreground'>
                      {t("rareMetalsText", {
                        defaultValue:
                          "Recovering indium and other precious metals reduces harmful mining impact",
                      })}
                    </p>
                  </div>
                  <div className='flex flex-col items-center text-center'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4 mb-3'>
                      <PackageOpen className='h-6 w-6 text-emerald-600' />
                    </div>
                    <h4 className='font-semibold mb-2'>
                      {t("wasteReductionTitle", {
                        defaultValue: "E-Waste Reduction",
                      })}
                    </h4>
                    <p className='text-sm text-muted-foreground'>
                      {t("wasteReductionText", {
                        defaultValue:
                          "Every recycled screen keeps hazardous materials out of landfills",
                      })}
                    </p>
                  </div>
                  <div className='flex flex-col items-center text-center'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4 mb-3'>
                      <TreePine className='h-6 w-6 text-emerald-600' />
                    </div>
                    <h4 className='font-semibold mb-2'>
                      {t("energySavingTitle", {
                        defaultValue: "Energy Conservation",
                      })}
                    </h4>
                    <p className='text-sm text-muted-foreground'>
                      {t("energySavingText", {
                        defaultValue:
                          "Recycling uses up to 85% less energy than producing new screens",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Initiatives Tab Content */}
          <TabsContent value='initiatives' className='space-y-8'>
            <h2 className='text-3xl font-bold mb-6 text-center'>
              {t("ourInitiatives", {
                defaultValue: "Our Sustainability Initiatives",
              })}
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mt-1'>
                      <Battery className='h-5 w-5 text-emerald-600' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>
                        {t("batteryProgramTitle", {
                          defaultValue: "Battery Recycling Program",
                        })}
                      </h3>
                      <p className='text-muted-foreground mb-3'>
                        {t("batteryProgramDesc", {
                          defaultValue:
                            "Our comprehensive battery recycling program ensures lithium-ion batteries from phones and electronic devices are safely processed to extract cobalt, lithium, and other materials for reuse.",
                        })}
                      </p>
                      <ul className='space-y-2 text-sm'>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("batteryPoint1", {
                            defaultValue:
                              "Safe collection points at all our locations",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("batteryPoint2", {
                            defaultValue:
                              "Partnerships with certified Belgian recyclers",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("batteryPoint3", {
                            defaultValue:
                              "Educational resources on battery disposal",
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mt-1'>
                      <Truck className='h-5 w-5 text-emerald-600' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>
                        {t("carbonNeutralTitle", {
                          defaultValue: "Carbon-Neutral Deliveries",
                        })}
                      </h3>
                      <p className='text-muted-foreground mb-3'>
                        {t("carbonNeutralDesc", {
                          defaultValue:
                            "We've partnered with eco-conscious delivery services in Belgium to offer carbon-neutral shipping options, using electric vehicles and carbon offset programs.",
                        })}
                      </p>
                      <ul className='space-y-2 text-sm'>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("carbonPoint1", {
                            defaultValue:
                              "Local deliveries via electric vehicles",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("carbonPoint2", {
                            defaultValue:
                              "Carbon offset program for longer distances",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("carbonPoint3", {
                            defaultValue: "Eco-friendly packaging materials",
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mt-1'>
                      <Leaf className='h-5 w-5 text-emerald-600' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>
                        {t("refurbishedTitle", {
                          defaultValue: "Refurbished Device Program",
                        })}
                      </h3>
                      <p className='text-muted-foreground mb-3'>
                        {t("refurbishedDesc", {
                          defaultValue:
                            "Our certified refurbishment program extends the life of devices that might otherwise become waste, reducing manufacturing demands and their associated environmental impacts.",
                        })}
                      </p>
                      <ul className='space-y-2 text-sm'>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("refurbishedPoint1", {
                            defaultValue:
                              "Quality testing and repair by certified technicians",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("refurbishedPoint2", {
                            defaultValue:
                              "Extended warranty on refurbished products",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("refurbishedPoint3", {
                            defaultValue:
                              "Trade-in options for customers' old devices",
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mt-1'>
                      <TreePine className='h-5 w-5 text-emerald-600' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>
                        {t("treePlantingTitle", {
                          defaultValue: "One Repair, One Tree",
                        })}
                      </h3>
                      <p className='text-muted-foreground mb-3'>
                        {t("treePlantingDesc", {
                          defaultValue:
                            "For every major repair service, we contribute to reforestation efforts in Belgium and around the world, partnering with local environmental organizations.",
                        })}
                      </p>
                      <ul className='space-y-2 text-sm'>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("treePlantingPoint1", {
                            defaultValue:
                              "Over 2,000 trees planted since program launch",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("treePlantingPoint2", {
                            defaultValue:
                              "Focus on native Belgian species in local forests",
                          })}
                        </li>
                        <li className='flex items-start gap-2'>
                          <span className='text-emerald-600 font-bold'>•</span>
                          {t("treePlantingPoint3", {
                            defaultValue:
                              "Tracking system for customers to monitor their tree's growth",
                          })}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Environmental Impact Tab Content */}
          <TabsContent value='impact' className='space-y-8'>
            <div className='text-center mb-8'>
              <h2 className='text-3xl font-bold mb-4'>
                {t("impactTitle", { defaultValue: "Our Environmental Impact" })}
              </h2>
              <p className='max-w-3xl mx-auto text-muted-foreground'>
                {t("impactDesc", {
                  defaultValue:
                    "We're committed to transparency in our environmental efforts. Here's how our initiatives are making a difference in Belgium and globally.",
                })}
              </p>
            </div>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold mb-4'>
                  {t("annualImpactTitle", {
                    defaultValue: "Annual Environmental Impact (2023)",
                  })}
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-3xl font-bold text-emerald-600 mb-1'>
                      1,750
                    </div>
                    <p className='text-sm'>
                      {t("screensRecycled", {
                        defaultValue: "Screens recycled",
                      })}
                    </p>
                  </div>
                  <div className='flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-3xl font-bold text-emerald-600 mb-1'>
                      850
                    </div>
                    <p className='text-sm'>
                      {t("devicesRefurbished", {
                        defaultValue: "Devices refurbished",
                      })}
                    </p>
                  </div>
                  <div className='flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-3xl font-bold text-emerald-600 mb-1'>
                      25 tons
                    </div>
                    <p className='text-sm'>
                      {t("co2Saved", { defaultValue: "CO₂ emissions saved" })}
                    </p>
                  </div>
                  <div className='flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg'>
                    <div className='text-3xl font-bold text-emerald-600 mb-1'>
                      3,200 kg
                    </div>
                    <p className='text-sm'>
                      {t("eWasteRecovered", {
                        defaultValue: "E-waste recovered",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-4'>
                    {t("materialRecoveryTitle", {
                      defaultValue: "Material Recovery Impact",
                    })}
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    {t("materialRecoveryDesc", {
                      defaultValue:
                        "Through our recycling programs, we've recovered significant amounts of valuable materials that would otherwise be lost in landfills:",
                    })}
                  </p>
                  <ul className='space-y-3'>
                    <li className='flex justify-between items-center'>
                      <span>{t("gold", { defaultValue: "Gold" })}</span>
                      <span className='font-semibold'>240g</span>
                    </li>
                    <li className='flex justify-between items-center'>
                      <span>{t("silver", { defaultValue: "Silver" })}</span>
                      <span className='font-semibold'>2.5kg</span>
                    </li>
                    <li className='flex justify-between items-center'>
                      <span>{t("copper", { defaultValue: "Copper" })}</span>
                      <span className='font-semibold'>125kg</span>
                    </li>
                    <li className='flex justify-between items-center'>
                      <span>
                        {t("rareEarth", {
                          defaultValue: "Rare Earth Elements",
                        })}
                      </span>
                      <span className='font-semibold'>17kg</span>
                    </li>
                    <li className='flex justify-between items-center'>
                      <span>{t("lithium", { defaultValue: "Lithium" })}</span>
                      <span className='font-semibold'>35kg</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-4'>
                    {t("communityImpactTitle", {
                      defaultValue: "Community Environmental Impact",
                    })}
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    {t("communityImpactDesc", {
                      defaultValue:
                        "Our sustainability efforts extend beyond our stores to positively impact the Belgian community:",
                    })}
                  </p>
                  <ul className='space-y-3'>
                    <li className='flex items-start gap-3'>
                      <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1 mt-0.5'>
                        <TreePine className='h-4 w-4 text-emerald-600' />
                      </div>
                      <span>
                        {t("communityPoint1", {
                          defaultValue:
                            "Educational workshops on e-waste management in 15 local schools",
                        })}
                      </span>
                    </li>
                    <li className='flex items-start gap-3'>
                      <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1 mt-0.5'>
                        <TreePine className='h-4 w-4 text-emerald-600' />
                      </div>
                      <span>
                        {t("communityPoint2", {
                          defaultValue:
                            "Partnership with Leuven municipality for community e-waste collection events",
                        })}
                      </span>
                    </li>
                    <li className='flex items-start gap-3'>
                      <div className='rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1 mt-0.5'>
                        <TreePine className='h-4 w-4 text-emerald-600' />
                      </div>
                      <span>
                        {t("communityPoint3", {
                          defaultValue:
                            "Donation of refurbished devices to underprivileged communities",
                        })}
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Partners Tab Content */}
          <TabsContent value='partners' className='space-y-8'>
            <div className='text-center mb-8'>
              <h2 className='text-3xl font-bold mb-4'>
                {t("partnersTitle", {
                  defaultValue: "Our Environmental Partners & Certifications",
                })}
              </h2>
              <p className='max-w-3xl mx-auto text-muted-foreground'>
                {t("partnersDesc", {
                  defaultValue:
                    "We collaborate with leading environmental organizations and maintain certifications that reflect our commitment to sustainable business practices.",
                })}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-4'>
                    {t("certificationsTitle", {
                      defaultValue: "Our Certifications",
                    })}
                  </h3>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <Trophy className='h-8 w-8 text-emerald-600' />
                      <div>
                        <h4 className='font-semibold'>ISO 14001</h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("iso14001", {
                            defaultValue:
                              "Environmental Management System certification",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Trophy className='h-8 w-8 text-emerald-600' />
                      <div>
                        <h4 className='font-semibold'>
                          R2 (Responsible Recycling)
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("r2Cert", {
                            defaultValue:
                              "Standard for electronics recycling and refurbishment",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Trophy className='h-8 w-8 text-emerald-600' />
                      <div>
                        <h4 className='font-semibold'>
                          {t("belgianEcoLabel", {
                            defaultValue: "Belgian Eco Label",
                          })}
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("ecoLabelDesc", {
                            defaultValue:
                              "Recognized for outstanding environmental practices in Belgium",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Trophy className='h-8 w-8 text-emerald-600' />
                      <div>
                        <h4 className='font-semibold'>e-Stewards</h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("eStewards", {
                            defaultValue:
                              "Certification for responsible e-waste recycling",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-4'>
                    {t("partnershipsTitle", {
                      defaultValue: "Our Partnerships",
                    })}
                  </h3>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center'>
                        <span className='text-xs text-muted-foreground'>
                          Logo
                        </span>
                      </div>
                      <div>
                        <h4 className='font-semibold'>Recupel</h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("recupelDesc", {
                            defaultValue:
                              "Belgian organization for collection and processing of e-waste",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center'>
                        <span className='text-xs text-muted-foreground'>
                          Logo
                        </span>
                      </div>
                      <div>
                        <h4 className='font-semibold'>Natuurpunt</h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("natuurpuntDesc", {
                            defaultValue:
                              "Partner for our tree planting initiatives in Flemish forests",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center'>
                        <span className='text-xs text-muted-foreground'>
                          Logo
                        </span>
                      </div>
                      <div>
                        <h4 className='font-semibold'>
                          Circular Economy Belgium
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("circularDesc", {
                            defaultValue:
                              "Collaboration to promote circular business models",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center'>
                        <span className='text-xs text-muted-foreground'>
                          Logo
                        </span>
                      </div>
                      <div>
                        <h4 className='font-semibold'>Bond Beter Leefmilieu</h4>
                        <p className='text-sm text-muted-foreground'>
                          {t("bondDesc", {
                            defaultValue:
                              "Collaboration on environmental awareness campaigns",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Get Involved Section */}
      <section className='mb-16'>
        <Card className='bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-900'>
          <CardContent className='p-8'>
            <div className='text-center mb-8'>
              <h2 className='text-3xl font-bold mb-4'>
                {t("getInvolvedTitle", {
                  defaultValue: "Get Involved in Our Sustainability Efforts",
                })}
              </h2>
              <p className='max-w-3xl mx-auto text-muted-foreground'>
                {t("getInvolvedDesc", {
                  defaultValue:
                    "There are many ways you can participate in and support our environmental initiatives.",
                })}
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
              <div className='bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm'>
                <h3 className='font-semibold mb-3 flex items-center'>
                  <Recycle className='w-5 h-5 mr-2 text-emerald-600' />
                  {t("recycleDeviceTitle", {
                    defaultValue: "Recycle Your Device",
                  })}
                </h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  {t("recycleDeviceDesc", {
                    defaultValue:
                      "Bring your old phones and electronics to any of our locations for proper recycling, even if you don't need repairs.",
                  })}
                </p>
                <Button variant='outline' className='w-full' asChild>
                  <Link href='/contact'>
                    {t("findDropoff", {
                      defaultValue: "Find Drop-off Locations",
                    })}
                  </Link>
                </Button>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm'>
                <h3 className='font-semibold mb-3 flex items-center'>
                  <Leaf className='w-5 h-5 mr-2 text-emerald-600' />
                  {t("buyRefurbishedTitle", {
                    defaultValue: "Choose Refurbished",
                  })}
                </h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  {t("buyRefurbishedDesc", {
                    defaultValue:
                      "Extend the life cycle of electronics by purchasing certified refurbished devices with our quality guarantee.",
                  })}
                </p>
                <Button variant='outline' className='w-full' asChild>
                  <Link href='/refurbished'>
                    {t("browseRefurbished", {
                      defaultValue: "Browse Refurbished Devices",
                    })}
                  </Link>
                </Button>
              </div>

              <div className='bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm'>
                <h3 className='font-semibold mb-3 flex items-center'>
                  <BookOpen className='w-5 h-5 mr-2 text-emerald-600' />
                  {t("spreadAwarenessTitle", {
                    defaultValue: "Spread Awareness",
                  })}
                </h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  {t("spreadAwarenessDesc", {
                    defaultValue:
                      "Help us educate others about the importance of e-waste recycling and sustainable electronics usage.",
                  })}
                </p>
                <Button variant='outline' className='w-full' asChild>
                  <Link href='#resources'>
                    {t("downloadResources", {
                      defaultValue: "Download Resources",
                    })}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className='mb-16' id='resources'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold mb-4'>
            {t("faqTitle", { defaultValue: "Frequently Asked Questions" })}
          </h2>
          <p className='max-w-3xl mx-auto text-muted-foreground'>
            {t("faqDesc", {
              defaultValue:
                "Learn more about our sustainability initiatives and how you can contribute.",
            })}
          </p>
        </div>

        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  {t("faq1Question", {
                    defaultValue:
                      "How do you ensure proper recycling of device components?",
                  })}
                </h3>
                <p className='text-muted-foreground'>
                  {t("faq1Answer", {
                    defaultValue:
                      "We work exclusively with certified recycling partners in Belgium who meet the highest environmental standards. Every component is tracked through our system to ensure it reaches the appropriate recycling facility. We conduct regular audits of our partners' facilities and processes to maintain compliance with both Belgian and EU environmental regulations.",
                  })}
                </p>
              </div>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  {t("faq2Question", {
                    defaultValue:
                      "What happens to the data on recycled devices?",
                  })}
                </h3>
                <p className='text-muted-foreground'>
                  {t("faq2Answer", {
                    defaultValue:
                      "All devices that enter our recycling program undergo a secure data wiping process that meets GDPR requirements and industry standards for data destruction. We provide a certificate of data erasure upon request, giving you peace of mind that your personal information has been properly handled.",
                  })}
                </p>
              </div>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  {t("faq3Question", {
                    defaultValue:
                      "Can I recycle any brand or type of device with you?",
                  })}
                </h3>
                <p className='text-muted-foreground'>
                  {t("faq3Answer", {
                    defaultValue:
                      "Yes! We accept all brands, models, and types of electronic devices for recycling - not just phones. This includes tablets, laptops, smartwatches, wireless earbuds, and other small electronics. Even if the device is completely non-functional, the materials can still be recovered and recycled properly.",
                  })}
                </p>
              </div>
              <div className='pb-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  {t("faq4Question", {
                    defaultValue:
                      "Do you offer any incentives for recycling old devices?",
                  })}
                </h3>
                <p className='text-muted-foreground'>
                  {t("faq4Answer", {
                    defaultValue:
                      "Absolutely! When you recycle a device with us, you'll receive a discount voucher for future repairs or purchases. For devices that still have some value, our trade-in program offers store credit or cash depending on the condition and model of your device.",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section>
        <div className='bg-emerald-700 text-white rounded-xl overflow-hidden'>
          <div className='p-8 md:p-12 text-center'>
            <Leaf className='w-12 h-12 mx-auto mb-6 opacity-90' />
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              {t("ctaTitle", {
                defaultValue: "Join Us in Making a Difference",
              })}
            </h2>
            <p className='max-w-2xl mx-auto mb-8 text-emerald-100'>
              {t("ctaText", {
                defaultValue:
                  "Every recycled device contributes to a more sustainable future for Belgium and our planet. Start your environmental journey with us today.",
              })}
            </p>{" "}
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                variant='outline'
                className='bg-transparent border-white hover:bg-white hover:text-emerald-700'
                asChild
              >
                <Link href={`/contact?subject=recycle`}>
                  {t("recycleNowButton", { defaultValue: "Recycle Now" })}
                </Link>
              </Button>
              <Button
                size='lg'
                className='bg-white text-emerald-700 hover:bg-emerald-100'
                asChild
              >
                <Link href={`/contact?subject=collection`}>
                  {t("learnMoreButton", {
                    defaultValue: "Schedule a Collection",
                  })}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
