"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const supabase = createClient();

  // State to store dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingRepairs: 0,
    recentOrders: [],
    recentRepairs: [],
  });

  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get order stats
        const { count: orderCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        // Get product stats
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Get customer stats
        const { count: customerCount } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true });

        // Get revenue stats
        const { data: revenueData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("status", "completed");

        const totalRevenue =
          revenueData?.reduce(
            (sum, order) => sum + parseFloat(order.total_amount),
            0
          ) || 0;

        // Get repair stats
        const { count: pendingRepairsCount } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .not("status_id", "eq", 5); // Assuming status 5 is "completed"

        // Get recent orders
        const { data: recentOrders } = await supabase
          .from("orders")
          .select(
            `
            id,
            total_amount,
            status,
            created_at,
            customer:customer_id(name, email)
          `
          )
          .order("created_at", { ascending: false })
          .limit(5);

        // Get recent repairs
        const { data: recentRepairs } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            created_at,
            device_model:device_model_id(name),
            status:status_id(name, color),
            customer:customer_id(name, email)
          `
          )
          .order("appointment_date", { ascending: false })
          .limit(5);

        setDashboardData({
          totalOrders: orderCount || 0,
          totalProducts: productCount || 0,
          totalCustomers: customerCount || 0,
          totalRevenue,
          pendingRepairs: pendingRepairsCount || 0,
          recentOrders: recentOrders || [],
          recentRepairs: recentRepairs || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-gray-500'>
          Welcome to the FinOpenPOS admin dashboard.
        </p>
      </div>

      {loading ? (
        <div className='flex justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Revenue
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(dashboardData.totalRevenue)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  From all completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Orders</CardTitle>
                <ShoppingBag className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {dashboardData.totalOrders}
                </div>
                <p className='text-xs text-muted-foreground'>Total orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Products</CardTitle>
                <Package className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {dashboardData.totalProducts}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Products in inventory
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Repairs</CardTitle>
                <Wrench className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {dashboardData.pendingRepairs}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Pending repair appointments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders placed in the system
                </CardDescription>
              </CardHeader>
              <CardContent className='px-0'>
                <div className='space-y-8'>
                  {dashboardData.recentOrders.length > 0 ? (
                    <div className='overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b'>
                            <th className='px-6 py-3 text-left font-medium'>
                              Order
                            </th>
                            <th className='px-6 py-3 text-left font-medium'>
                              Customer
                            </th>
                            <th className='px-6 py-3 text-left font-medium'>
                              Date
                            </th>
                            <th className='px-6 py-3 text-right font-medium'>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y'>
                          {dashboardData.recentOrders.map((order: any) => (
                            <tr key={order.id} className='hover:bg-gray-50'>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className='text-blue-600 hover:underline'
                                >
                                  #{order.id}
                                </Link>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                {order.customer?.name || "Guest"}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                {formatDate(order.created_at)}
                              </td>
                              <td className='px-6 py-4 text-right whitespace-nowrap font-medium'>
                                {formatCurrency(parseFloat(order.total_amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className='text-center py-6 text-gray-500'>
                      No recent orders
                    </div>
                  )}
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link
                    href='/admin/orders'
                    className='text-blue-600 hover:underline text-sm'
                  >
                    View all orders
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Repairs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Repairs</CardTitle>
                <CardDescription>
                  Latest repair appointments scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className='px-0'>
                <div className='space-y-8'>
                  {dashboardData.recentRepairs.length > 0 ? (
                    <div className='overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b'>
                            <th className='px-6 py-3 text-left font-medium'>
                              ID
                            </th>
                            <th className='px-6 py-3 text-left font-medium'>
                              Device
                            </th>
                            <th className='px-6 py-3 text-left font-medium'>
                              Date
                            </th>
                            <th className='px-6 py-3 text-left font-medium'>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y'>
                          {dashboardData.recentRepairs.map((repair: any) => (
                            <tr key={repair.id} className='hover:bg-gray-50'>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <Link
                                  href={`/admin/appointments?id=${repair.id}`}
                                  className='text-blue-600 hover:underline'
                                >
                                  #{repair.id}
                                </Link>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                {repair.device_model?.name || "Unknown Device"}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                {formatDate(repair.appointment_date)}
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <span
                                  className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
                                  style={{
                                    backgroundColor: `${repair.status?.color}20`,
                                    color: repair.status?.color,
                                  }}
                                >
                                  {repair.status?.name || "Unknown Status"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className='text-center py-6 text-gray-500'>
                      No recent repair appointments
                    </div>
                  )}
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link
                    href='/admin/appointments'
                    className='text-blue-600 hover:underline text-sm'
                  >
                    View all repair appointments
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
