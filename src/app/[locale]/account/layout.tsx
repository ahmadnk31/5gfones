"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { User, ShoppingBag, Settings } from "lucide-react";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("auth.account");
  const ordersT = useTranslations("orders");
  const pathname = usePathname();
  const { locale } = useParams();

  // Determine active tab
  let activeTab = "profile";
  if (pathname.includes("/orders")) {
    activeTab = "orders";
  } else if (pathname.includes("/settings")) {
    activeTab = "settings";
  }

  return (
    <div className='container'>
      <div className='flex flex-col gap-6 md:gap-8 py-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{t("title")}</h1>
        </div>

        <div className='flex flex-col md:flex-row gap-6'>
          {/* Sidebar Navigation for larger screens */}
          <div className='md:w-64 lg:w-72 hidden md:block'>
            <Card>
              <div className='p-2'>
                <nav className='space-y-1'>
                  <Link
                    href={`/${locale}/account`}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                      pathname === `/${locale}/account`
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <User className='h-4 w-4' />
                    {t("profile")}
                  </Link>{" "}
                  <Link
                    href={`/${locale}/account/orders`}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                      pathname === `/${locale}/account/orders` ||
                        pathname.includes(`/${locale}/account/orders/`)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <ShoppingBag className='h-4 w-4' />
                    {ordersT("title")}
                  </Link>
                </nav>
              </div>
            </Card>
          </div>

          {/* Mobile navigation */}
          <div className='md:hidden'>
            <Tabs value={activeTab}>
              <TabsList className='grid w-full grid-cols-2'>
                <Link href={`/${locale}/account`}>
                  <TabsTrigger value='profile' className='w-full'>
                    <User className='h-4 w-4 mr-2' />
                    {t("profile")}
                  </TabsTrigger>
                </Link>{" "}
                <Link href={`/${locale}/account/orders`}>
                  <TabsTrigger value='orders' className='w-full'>
                    <ShoppingBag className='h-4 w-4 mr-2' />
                    {ordersT("title")}
                  </TabsTrigger>
                </Link>
              </TabsList>
            </Tabs>
          </div>

          {/* Main content */}
          <div className='flex-1'>{children}</div>
        </div>
      </div>
    </div>
  );
}
