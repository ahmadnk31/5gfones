"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ShoppingCart, Menu, X, User, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import SearchBarModal from "./search-bar-modal";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { cn } from "@/lib/utils";

const NavBar = () => {
  const t = useTranslations("navigation");
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0); // Get the current locale for links
  const locale = useTranslations("common")("locale") || "en";

  // Check authentication state
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Handle cart count from local storage
  useEffect(() => {
    const getCartFromStorage = () => {
      if (typeof window !== "undefined") {
        const cart = localStorage.getItem("cart");
        if (cart) {
          try {
            const cartItems = JSON.parse(cart);
            const itemCount = cartItems.reduce(
              (total: number, item: any) => total + item.quantity,
              0
            );
            setCartCount(itemCount);
          } catch (e) {
            console.error("Error parsing cart data:", e);
            setCartCount(0);
          }
        }
      }
    };

    getCartFromStorage();
    window.addEventListener("storage", getCartFromStorage);

    // Custom event for cart updates
    window.addEventListener("cartUpdated", getCartFromStorage);

    return () => {
      window.removeEventListener("storage", getCartFromStorage);
      window.removeEventListener("cartUpdated", getCartFromStorage);
    };
  }, []);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className='bg-white shadow-md sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo and brand name */}{" "}
          <div className='flex items-center'>
            <Link
              href={`/${locale}`}
              className='flex-shrink-0 flex items-center'
            >
              <Image
                src='/placeholder.svg'
                alt='FinOpenPOS'
                width={32}
                height={32}
                className='h-8 w-auto'
              />
              <span className='ml-2 text-xl font-bold text-gray-900'>
                5GPhones
              </span>
            </Link>
          </div>
          {/* Desktop Navigation */}{" "}
          <div className='hidden md:flex items-center justify-between flex-1 ml-6'>
            {/* Navigation Links with Shadcn Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href={`/${locale}`} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {t("home")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("products")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className='grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]'>
                      <li className='row-span-3'>
                        <NavigationMenuLink asChild>
                          <a
                            className='flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-500 to-blue-700 p-6 no-underline outline-none focus:shadow-md'
                            href={`/${locale}/products`}
                          >
                            <ShoppingCart className='h-6 w-6 text-white' />
                            <div className='mb-2 mt-4 text-lg font-medium text-white'>
                              {t("allProducts")}
                            </div>
                            <p className='text-sm leading-tight text-white/90'>
                              {t("browseOurCollection")}
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/categories`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("categories")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("browseByCategory")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/brands`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("brands")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("browseByBrand")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>{" "}
                      <li>
                        <Link
                          href={`/${locale}/offers`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("specialOffers")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("checkOutDeals")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/refurbished`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              Refurbished
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              Quality refurbished devices at great prices
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>{" "}                <NavigationMenuItem>
                  <Link
                    href={`/${locale}/sustainability`}
                    legacyBehavior
                    passHref
                  >
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {t("sustainability")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>{" "}
                <NavigationMenuItem>
                  <Link
                    href={`/${locale}/sell-phone`}
                    legacyBehavior
                    passHref
                  >
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {t("sellPhone")}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>{" "}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("repair")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className='grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]'>
                      <li className='row-span-3'>
                        <NavigationMenuLink asChild>
                          <a
                            className='flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-blue-600 to-blue-800 p-6 no-underline outline-none focus:shadow-md'
                            href={`/${locale}/repair`}
                          >
                            <div className='mb-2 mt-4 text-lg font-medium text-white'>
                              {t("deviceRepair")}
                            </div>
                            <p className='text-sm leading-tight text-white/90'>
                              {t("professionalRepairServices")}
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/repair/schedule`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("scheduleRepair")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("bookAppointment")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/repair/track`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("trackRepair")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("checkStatus")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={`/${locale}/repair/parts`}
                          legacyBehavior
                          passHref
                        >
                          <NavigationMenuLink
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className='text-sm font-medium leading-none'>
                              {t("repairParts")}
                            </div>
                            <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
                              {t("browseRepairParts")}
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {/* Search Bar */}
            <div className='flex-1 max-w-md mx-4'>
              <SearchBarModal />
            </div>{" "}
            {/* User and Cart */}
            <div className='flex items-center space-x-4'>
              <Link href={`/${locale}/cart`} className='relative'>
                <ShoppingCart className='h-6 w-6 text-gray-700 hover:text-gray-900' />
                {cartCount > 0 && (
                  <Badge
                    variant='destructive'
                    className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs'
                  >
                    {cartCount}
                  </Badge>
                )}
              </Link>
              {user ? (
                <div className='relative group'>
                  <Avatar className='cursor-pointer h-9 w-9'>
                    {user.user_metadata?.avatar_url ? (
                      <div className='aspect-square h-full w-full'>
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || user.email}
                          fill
                          className='object-cover'
                        />
                      </div>
                    ) : (
                      <AvatarFallback className='bg-blue-100 text-blue-800'>
                        {(user.user_metadata?.full_name || user.email || "User")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className='absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50'>
                    <div className='py-1'>
                      <div className='px-4 py-2 border-b border-gray-100'>
                        <p className='font-medium text-sm'>
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href={`/${locale}/account`}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        {t("account")}
                      </Link>                      <Link
                        href={`/${locale}/orders`}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        {t("myOrders")}
                      </Link>
                      <Link
                        href={`/${locale}/my-devices`}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        {t("myDevices")}
                      </Link>
                      <button
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        onClick={async () => {
                          await supabase.auth.signOut();
                          router.push(`/${locale}`);
                        }}
                      >
                        {t("logout")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href={`/${locale}/auth/login`} passHref>
                  <Button variant='outline' size='sm'>
                    {t("login")}
                  </Button>
                </Link>
              )}
            </div>
          </div>{" "}
          {/* Mobile Menu Button */}
          <div className='flex items-center md:hidden'>
            <Link href={`/${locale}/cart`} className='relative mr-4'>
              <ShoppingCart className='h-6 w-6 text-gray-700' />
              {cartCount > 0 && (
                <Badge
                  variant='destructive'
                  className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs'
                >
                  {cartCount}
                </Badge>
              )}
            </Link>
            <button
              type='button'
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              aria-controls='mobile-menu'
              aria-expanded='false'
              onClick={toggleMenu}
            >
              {isOpen ? (
                <X className='block h-6 w-6' aria-hidden='true' />
              ) : (
                <Menu className='block h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>{" "}
      {/* Mobile Menu */}
      {isOpen && (
        <div className='md:hidden' id='mobile-menu'>
          {/* Main Links */}
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {" "}
            <Link
              href={`/${locale}`}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
            >
              {t("home")}
            </Link>            <Link
              href={`/${locale}/sustainability`}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
            >
              {t("sustainability")}
            </Link>
            <Link
              href={`/${locale}/sell-phone`}
              className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
            >
              {t("sellPhone")}
            </Link>
            {/* Products Section with Dropdown */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'>
                <Link href={`/${locale}/products`}>{t("products")}</Link>
                <button
                  className='p-1 focus:outline-none'
                  onClick={(e) => {
                    e.preventDefault();
                    const submenu = document.getElementById("products-submenu");
                    if (submenu) {
                      submenu.classList.toggle("hidden");
                    }
                  }}
                >
                  <ChevronDown className='h-4 w-4' />
                </button>
              </div>

              <div id='products-submenu' className='pl-6 hidden space-y-1'>
                <Link
                  href={`/${locale}/categories`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("categories")}
                </Link>
                <Link
                  href={`/${locale}/brands`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("brands")}
                </Link>{" "}
                <Link
                  href={`/${locale}/offers`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("specialOffers")}
                </Link>
                <Link
                  href={`/${locale}/refurbished`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  Refurbished
                </Link>
              </div>
            </div>
            {/* Repair Section with Dropdown */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'>
                <Link href={`/${locale}/repair`}>{t("repair")}</Link>
                <button
                  className='p-1 focus:outline-none'
                  onClick={(e) => {
                    e.preventDefault();
                    const submenu = document.getElementById("repair-submenu");
                    if (submenu) {
                      submenu.classList.toggle("hidden");
                    }
                  }}
                >
                  <ChevronDown className='h-4 w-4' />
                </button>
              </div>

              <div id='repair-submenu' className='pl-6 hidden space-y-1'>
                <Link
                  href={`/${locale}/repair/schedule`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("scheduleRepair")}
                </Link>
                <Link
                  href={`/${locale}/repair/track`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("trackRepair")}
                </Link>
                <Link
                  href={`/${locale}/repair/parts`}
                  className='block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100'
                >
                  {t("repairParts")}
                </Link>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className='px-4 py-3 border-t border-gray-200'>
            <SearchBarModal />
          </div>

          {/* User Profile Section */}
          <div className='pt-4 pb-3 border-t border-gray-200'>
            {user ? (
              <div className='px-4 space-y-2'>
                <div className='flex items-center px-3 py-2'>
                  <div className='mr-3'>
                    <Avatar className='h-10 w-10'>
                      {user.user_metadata?.avatar_url ? (
                        <div className='aspect-square h-full w-full'>
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt={user.user_metadata?.full_name || user.email}
                            fill
                            className='object-cover'
                          />
                        </div>
                      ) : (
                        <AvatarFallback className='bg-blue-100 text-blue-800'>
                          {(
                            user.user_metadata?.full_name ||
                            user.email ||
                            "User"
                          )
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div>
                    <p className='text-base font-medium text-gray-800'>
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className='text-sm text-gray-500 truncate'>
                      {user.email}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/${locale}/account`}
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
                >
                  {t("account")}
                </Link>                <Link
                  href={`/${locale}/orders`}
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
                >
                  {t("myOrders")}
                </Link>
                <Link
                  href={`/${locale}/my-devices`}
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
                >
                  {t("myDevices")}
                </Link>
                <button
                  className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100'
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push(`/${locale}`);
                  }}
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className='px-4'>
                <Link
                  href={`/${locale}/auth/login`}
                  className='block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-gray-100'
                >
                  {t("login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
