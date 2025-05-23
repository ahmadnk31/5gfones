"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  CreditCard,
  Package2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Smartphone,
  Users,
  Wrench,
  MessageSquare,
  X,
  Mail,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check authentication and admin role
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: session } = await supabase.auth.getSession();

        if (!session.session) {
          // No session, redirect to login
          router.push("/en/login?redirect=/admin");
          return;
        }

        setUser(session.session.user);

        // Check if user has admin role
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          router.push("/en");
          return;
        }

        setUserRole(profile?.role);

        // If not admin, redirect to home
        if (profile?.role !== "admin") {
          router.push("/en");
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/en/login?redirect=/admin");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/en");
  };

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className='h-5 w-5' />,
      exact: true,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: <Package2 className='h-5 w-5' />,
      exact: false,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: <CreditCard className='h-5 w-5' />,
      exact: false,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: <Users className='h-5 w-5' />,
      exact: false,
    },
    {
      name: "Repair",
      icon: <Wrench className='h-5 w-5' />,
      children: [
        {
          name: "Appointments",
          href: "/admin/appointments",
          exact: false,
        },
        {
          name: "Devices",
          href: "/admin/devices",
          exact: false,
        },
      ],
    },    {
      name: "Support",
      href: "/admin/support",
      icon: <MessageSquare className='h-5 w-5' />,
      exact: false,
    },
    {
      name: "Contact",
      href: "/admin/contact",
      icon: <Mail className='h-5 w-5' />,
      exact: false,
    },    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className='h-5 w-5' />,
      exact: false,
    },
    {
      name: "DHL Integration",
      href: "/admin/dhl-experimental",
      icon: <Truck className='h-5 w-5' />,
      exact: false,
    },
  ];

  // Function to check if a nav item is active
  const isActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
      </div>
    );
  }

  return (
    <div className='flex h-screen overflow-hidden bg-gray-100'>
      {/* Sidebar for larger screens */}
      <div
        className={`hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r`}
      >
        <div className='flex-1 flex flex-col min-h-0'>
          <div className='flex items-center h-16 flex-shrink-0 px-4 border-b'>
            <Link href='/admin' className='flex items-center'>
              <span className='text-xl font-semibold'>FinOpenPOS Admin</span>
            </Link>
          </div>
          <div className='flex-1 flex flex-col overflow-y-auto pt-5 pb-4'>
            <nav className='flex-1 px-2 space-y-1'>
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.name} className='space-y-1'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className={`w-full justify-between ${
                            (item.children || []).some((child) =>
                              isActive(child.href, child.exact)
                            )
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span className='flex items-center'>
                            {item.icon}
                            <span className='ml-3'>{item.name}</span>
                          </span>
                          <ChevronDown className='h-4 w-4 opacity-50' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='start'
                        side='right'
                        className='w-52'
                      >
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.name} asChild>
                            <Link
                              href={child.href}
                              className={`w-full ${
                                isActive(child.href, child.exact)
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {child.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href, item.exact)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    <span className='ml-3'>{item.name}</span>
                  </Link>
                )
              )}
            </nav>
          </div>
          <div className='flex-shrink-0 flex border-t p-4'>
            <div className='flex items-center'>
              <div className='h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center'>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-gray-700 truncate'>
                  {user?.email}
                </p>
                <p className='text-xs text-gray-500'>Admin</p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto'
                onClick={handleLogout}
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`md:hidden fixed inset-0 flex z-40 ${
          sidebarOpen ? "visible" : "invisible"
        }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-gray-600 ${
            sidebarOpen ? "opacity-75" : "opacity-0"
          } transition-opacity ease-linear duration-300`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition ease-in-out duration-300`}
        >
          <div className='absolute top-0 right-0 -mr-12 pt-2'>
            <button
              className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
              onClick={() => setSidebarOpen(false)}
            >
              <span className='sr-only'>Close sidebar</span>
              <X className='h-6 w-6 text-white' />
            </button>
          </div>

          <div className='flex-1 flex flex-col min-h-0'>
            <div className='flex items-center h-16 flex-shrink-0 px-4 border-b'>
              <span className='text-xl font-semibold'>FinOpenPOS Admin</span>
            </div>
            <div className='flex-1 flex flex-col overflow-y-auto pt-5 pb-4'>
              <nav className='flex-1 px-2 space-y-1'>
                {navItems.map((item) =>
                  item.children ? (
                    <div key={item.name} className='space-y-1 pb-2'>
                      <div className='flex items-center px-2 py-2 text-sm font-medium text-gray-600'>
                        {item.icon}
                        <span className='ml-3'>{item.name}</span>
                      </div>
                      <div className='pl-6 space-y-1'>
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                              isActive(child.href, child.exact)
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <span className='ml-3'>{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive(item.href, item.exact)
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className='ml-3'>{item.name}</span>
                    </Link>
                  )
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='md:pl-64 flex flex-col flex-1'>
        <div className='sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow'>
          <button
            type='button'
            className='-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            onClick={() => setSidebarOpen(true)}
          >
            <span className='sr-only'>Open sidebar</span>
            <Menu className='h-6 w-6' />
          </button>
        </div>
        <main className='flex-1 relative overflow-y-auto focus:outline-none'>
          <div className='py-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 md:px-8'>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
