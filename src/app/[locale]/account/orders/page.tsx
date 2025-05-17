"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Eye,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

// Define TypeScript interfaces for our data
interface Product {
  id: string;
  name: string;
  image_url?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  product: Product;
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "paid" | "pending" | "failed";
  payment_method?: "card" | "cash" | string;
  payment_id?: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  tax?: number;
  discount?: number;
  order_items: OrderItem[];
  shipping_address?: {
    id: string;
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const { locale } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Fetch user orders
  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get user orders
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            id,
            created_at,
            status,
            total,
            payment_status,
            order_items (
              id,
              quantity,
              price,
              product_id,
              product:products (name)
            )
          `
          )
          .eq("user_uid", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Use a more specific type assertion approach
        setOrders((data || []) as unknown as Order[]);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // Function to get status badge color
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "processing":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Function to get payment status badge color
  const getPaymentStatusColor = (status: Order["payment_status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-[50vh] w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }
  return (
    <div>
      <h1 className='text-3xl font-semibold mb-4'>{t("title")}</h1>
      <p className='text-muted-foreground mb-6'>{t("subtitle")}</p>

      {orders.length === 0 ? (
        <Card className='text-center p-10'>
          <CardContent className='pt-10 flex flex-col items-center'>
            <ShoppingBag className='h-16 w-16 text-muted-foreground mb-4' />
            <h3 className='text-xl font-semibold mb-2'>{t("noOrders")}</h3>
            <p className='text-muted-foreground mb-6'>
              {t("noOrdersDescription")}
            </p>
            <Link href={`/${locale}`}>
              <Button>{t("startShopping")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div>
          {orders.map((order) => (
            <Card key={order.id} className='mb-6'>
              <CardHeader className='pb-3'>
                <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
                  <div>
                    <CardTitle className='text-xl'>
                      {t("orderNumber")}
                      {order.id.substring(0, 8)}
                    </CardTitle>
                    <CardDescription className='flex items-center mt-1'>
                      <Calendar className='h-4 w-4 mr-1' />
                      {format(new Date(order.created_at), "PPP")}
                      <span className='mx-2'>•</span>
                      <Clock className='h-4 w-4 mr-1' />
                      {format(new Date(order.created_at), "p")}
                    </CardDescription>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {" "}
                    <Badge
                      variant='outline'
                      className={getStatusColor(order.status)}
                    >
                      {t(order.status, { fallback: order.status })}
                    </Badge>
                    <Badge
                      variant='outline'
                      className={getPaymentStatusColor(order.payment_status)}
                    >
                      {t(order.payment_status, {
                        fallback: order.payment_status,
                      })}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  {" "}
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("productsTitle", { fallback: "Product" })}
                      </TableHead>
                      <TableHead className='text-right'>
                        {t("quantity", { fallback: "Qty" })}
                      </TableHead>
                      <TableHead className='text-right'>
                        {t("price", { fallback: "Price" })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell className='text-right'>
                          {item.quantity}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(item.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>{" "}
              <CardFooter className='flex justify-between items-center border-t py-4'>
                <div>
                  <p className='font-medium'>
                    {t("total")}: {formatCurrency(order.total)}
                  </p>
                </div>
                <Link href={`/${locale}/account/orders/${order.id}`}>
                  <Button variant='outline' size='sm'>
                    <Eye className='h-4 w-4 mr-2' />
                    {t("viewDetails")}
                    <ChevronRight className='h-4 w-4 ml-1' />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
