"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PhoneIcon,
  SettingsIcon,
  UserIcon,
  PanelLeftIcon,
  ClipboardListIcon,
  ShoppingBagIcon,
  BarChartIcon,
  CalendarIcon,
  TagIcon,
  SquareStackIcon,
  SmartphoneIcon,
  WrenchIcon,
  PhoneOutgoingIcon,
  CalculatorIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FrameIcon } from "@radix-ui/react-icons";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className='flex min-h-screen'>
      {/* Sidebar Toggle Button (Mobile) */}
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className='fixed top-4 left-4 z-50 md:hidden'
      >
        <PanelLeftIcon className='h-5 w-5' />
      </Button>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 z-40 flex w-64 flex-col bg-background border-r border-border transition-transform md:translate-x-0`}
      >        <div className='flex h-14 items-center border-b px-4'>
          <Link href='/admin' className='flex items-center gap-2 font-semibold'>
            <PhoneIcon className='h-6 w-6' />
            <span className='text-lg'>
              5GPhones  
            </span>
          </Link>
        </div>
        <div className='flex flex-1 flex-col gap-1 p-3 overflow-y-auto'>
          <Link
            href='/admin'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin") ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <BarChartIcon className='h-4 w-4' />
            Dashboard
          </Link>
          {/* Store Management */}
          <div className='my-2 px-2.5 text-xs font-medium tracking-wide text-muted-foreground'>
            Store Management
          </div>
          <Link
            href='/admin/pos'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/pos") ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <ShoppingBagIcon className='h-4 w-4' />
            Point of Sale
          </Link>
          <Link
            href='/admin/orders'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/orders")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <ClipboardListIcon className='h-4 w-4' />
            Orders
          </Link>
          {/* Product Management */}
          <div className='my-2 px-2.5 text-xs font-medium tracking-wide text-muted-foreground'>
            Product Management
          </div>
          <Link
            href='/admin/brands'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/brands")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <TagIcon className='h-4 w-4' />
            Brands
          </Link>
          <Link
            href='/admin/categories'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/categories")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <SquareStackIcon className='h-4 w-4' />
            Categories
          </Link>
          <Link
            href='/admin/accessories'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/accessories")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <SmartphoneIcon className='h-4 w-4' />
            Accessories
          </Link>{" "}
          <Link
            href='/admin/parts'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/parts") ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <WrenchIcon className='h-4 w-4' />
            Repair Parts
          </Link>          <Link
            href='/admin/refurbished'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/refurbished")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <SmartphoneIcon className='h-4 w-4' />
            Refurbished Products
          </Link>          <Link
            href='/admin/category-discounts'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/category-discounts")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <TagIcon className='h-4 w-4' />
            Category Discounts
          </Link>
          <Link
            href='/admin/product-discounts'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/product-discounts")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <TagIcon className='h-4 w-4' />
            Product Discounts
          </Link>
          {/* Repair Management */}
          <div className='my-2 px-2.5 text-xs font-medium tracking-wide text-muted-foreground'>
            Repair Management
          </div>
          <Link
            href='/admin/devices'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/devices")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <SmartphoneIcon className='h-4 w-4' />
            Devices
          </Link>{" "}
          <Link
            href='/admin/appointments'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/appointments")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <CalendarIcon className='h-4 w-4' />
            Repair Appointments
          </Link>
          <Link
            href='/admin/trade-ins'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/trade-ins")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <PhoneOutgoingIcon className='h-4 w-4' />
            Trade-ins
          </Link>
          <Link
            href='/admin/trade-in-pricing'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/trade-in-pricing")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <CalculatorIcon className='h-4 w-4' />
            Trade-in Pricing
          </Link>

          <Link href="/admin/time-slots" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${isActive("/admin/time-slots") ? "bg-accent text-accent-foreground" : ""}`}>
            <CalendarIcon className='h-4 w-4' />
            Time Slots
          </Link>
          <Link href="/admin/banners" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${isActive("/admin/repair-services") ? "bg-accent text-accent-foreground" : ""}`}>
            <FrameIcon className='h-4 w-4' />
            Banners
          </Link>
          {/* Customer Management */}
          <div className='my-2 px-2.5 text-xs font-medium tracking-wide text-muted-foreground'>
            Customer Management
          </div>
          <Link
            href='/admin/customers'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/customers")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <UserIcon className='h-4 w-4' />
            Customers
          </Link>
          {/* Settings */}
          <div className='my-2 px-2.5 text-xs font-medium tracking-wide text-muted-foreground'>
            Settings
          </div>
          <Link
            href='/admin/settings'
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
              isActive("/admin/settings")
                ? "bg-accent text-accent-foreground"
                : ""
            }`}
          >
            <SettingsIcon className='h-4 w-4' />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex flex-1 overflow-y-auto flex-col ${isSidebarOpen ? "md:ml-64" : ""}`}
      >
        <header className='sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4'>
          <div className='flex items-center gap-2 md:hidden'>
            <Link
              href='/admin'
              className='flex items-center gap-2 font-semibold'
            >
              <PhoneIcon className='h-6 w-6' />
              <span>
                5GPhones
              </span>
            </Link>
          </div>
          <div className='ml-auto flex items-center gap-2'>
            <Button variant='ghost' size='icon'>
              <UserIcon className='h-5 w-5' />
            </Button>
          </div>
        </header>
        <main className='flex-1 p-4'>{children}</main>
      </div>
    </div>
  );
}
