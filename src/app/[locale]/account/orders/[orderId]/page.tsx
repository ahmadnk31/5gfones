"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ChevronLeft,
  MapPin,
  Package,
  CreditCard,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  RefreshCw,
  AlertTriangle,
  ChevronsUpDown,
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
  unit_price: number; // Changed from price to unit_price to match database schema
  product_id: string;
  product: Product;
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "paid" | "pending" | "failed" | "refunded" | "partially_refunded";
  payment_method?: "card" | "cash" | string;
  payment_id?: string;
  user_uid?: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  tax?: number;
  discount?: number;
  refund_amount?: number;
  refund_date?: string;
  refund_reason?: string;
  refund_status?: "pending" | "approved" | "rejected";
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

export default function OrderDetailsPage() {
  const t = useTranslations("orders");
  const { orderId, locale } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Fetch order details
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) return;

      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;        // Get order details
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            user_uid,            order_items (
              id,
              quantity,
              unit_price,
              product_id,
              product:products (id, name, image_url)
            ),
            shipping_address (
              id,
              full_name,
              address_line1,
              address_line2,
              city,
              state,
              postal_code,
              country
            )
          `
          )
          .eq("id", orderId)
          .eq("user_uid", user.id)
          .single();
        if (error || !data) {
          notFound();
          return;
        }

        setOrder(data as unknown as Order);
      } catch (error) {
        console.error("Error fetching order:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

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
      case "refunded":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "partially_refunded":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
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

  if (!order) {
    return notFound();
  }
  return (
    <div>
      <div className='flex items-center mb-6'>
        <Link href={`/${locale}/account/orders`}>
          <Button variant='outline' size='sm' className='mr-4'>
            <ChevronLeft className='h-4 w-4 mr-1' />
            {t("backToOrders")}
          </Button>
        </Link>
        <h1 className='text-2xl font-semibold'>{t("orderDetails")}</h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          {/* Order Overview */}
          <Card className='mb-6'>
            <CardHeader>
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
                    <TableHead className='text-right'>
                      {t("total", { fallback: "Total" })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className='flex items-center'>
                          {item.product.image_url && (
                            <div className='h-10 w-10 mr-3'>
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className='h-full w-full object-cover rounded'
                              />
                            </div>
                          )}
                          <Link href={`/${locale}/products/${item.product.id}`}>
                            <span className='hover:underline'>
                              {item.product.name}
                            </span>
                          </Link>
                        </div>
                      </TableCell>                      <TableCell className='text-right'>
                        {item.quantity}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(item.unit_price / item.quantity)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t("orderTimeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='relative border-l border-gray-200 dark:border-gray-700'>
                <li className='mb-10 ml-6'>
                  <span className='absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900'>
                    <Calendar className='w-3 h-3 text-blue-800 dark:text-blue-300' />
                  </span>
                  <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white'>
                    {t("orderPlaced")}
                  </h3>
                  <time className='block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500'>
                    {format(new Date(order.created_at), "PPP p")}
                  </time>
                  <p className='text-base font-normal text-gray-500 dark:text-gray-400'>
                    {t("orderConfirmed")}
                  </p>
                </li>
                {order.status !== "cancelled" && (
                  <>
                    <li className='mb-10 ml-6'>
                      <span
                        className={`absolute flex items-center justify-center w-6 h-6 ${
                          order.status === "processing" ||
                          order.status === "shipped" ||
                          order.status === "delivered"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-100 dark:bg-gray-700"
                        } rounded-full -left-3 ring-8 ring-white dark:ring-gray-900`}
                      >
                        <Package className='w-3 h-3 text-blue-800 dark:text-blue-300' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white'>
                        {t("orderProcessing")}
                      </h3>
                      {order.status === "processing" && (
                        <span className='bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3'>
                          {t("current")}
                        </span>
                      )}
                      <p className='text-base font-normal text-gray-500 dark:text-gray-400'>
                        {t("orderBeingPrepared")}
                      </p>
                    </li>
                    <li className='mb-10 ml-6'>
                      <span
                        className={`absolute flex items-center justify-center w-6 h-6 ${
                          order.status === "shipped" ||
                          order.status === "delivered"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-100 dark:bg-gray-700"
                        } rounded-full -left-3 ring-8 ring-white dark:ring-gray-900`}
                      >
                        <Package className='w-3 h-3 text-blue-800 dark:text-blue-300' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white'>
                        {t("orderShipped")}
                      </h3>
                      {order.status === "shipped" && (
                        <span className='bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3'>
                          {t("current")}
                        </span>
                      )}
                      <p className='text-base font-normal text-gray-500 dark:text-gray-400'>
                        {t("orderOnItsWay")}
                      </p>
                    </li>
                    <li className='ml-6'>
                      <span
                        className={`absolute flex items-center justify-center w-6 h-6 ${
                          order.status === "delivered"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-100 dark:bg-gray-700"
                        } rounded-full -left-3 ring-8 ring-white dark:ring-gray-900`}
                      >
                        <Package className='w-3 h-3 text-blue-800 dark:text-blue-300' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white'>
                        {t("orderDelivered")}
                      </h3>
                      {order.status === "delivered" && (
                        <span className='bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3'>
                          {t("current")}
                        </span>
                      )}
                      <p className='text-base font-normal text-gray-500 dark:text-gray-400'>
                        {t("orderCompleted")}
                      </p>
                    </li>
                  </>
                )}
                {order.status === "cancelled" && (
                  <li className='ml-6'>
                    <span className='absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-red-900'>
                      <svg
                        className='w-3 h-3 text-red-800 dark:text-red-300'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M6 18L18 6M6 6l12 12'
                        ></path>
                      </svg>
                    </span>
                    <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white'>
                      {t("orderCancelled")}
                    </h3>
                    <time className='block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500'>
                      {order.updated_at &&
                        format(new Date(order.updated_at), "PPP p")}
                    </time>
                    <p className='text-base font-normal text-gray-500 dark:text-gray-400'>
                      {t("orderCancelledDescription")}
                    </p>
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Order Summary */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>{t("orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t("subtotal")}</span>
                  <span>{formatCurrency(order.subtotal || order.total)}</span>
                </div>{" "}
                {order.shipping_cost && order.shipping_cost > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      {t("shipping")}
                    </span>
                    <span>{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}
                {order.tax && order.tax > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>{t("tax")}</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.discount && order.discount > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      {t("discount")}
                    </span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className='flex justify-between font-medium'>
                  <span>{t("total")}</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className='mb-6'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center'>
                <CreditCard className='h-5 w-5 mr-2' />
                {t("paymentInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t("method")}</span>
                  <span>
                    {order.payment_method === "card"
                      ? t("creditCard")
                      : order.payment_method === "cash"
                      ? t("cashOnDelivery")
                      : order.payment_method}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t("status")}</span>
                  <Badge
                    variant='outline'
                    className={getPaymentStatusColor(order.payment_status)}
                  >
                    {order.payment_status}
                  </Badge>
                </div>                {order.payment_id && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      {t("transactionId")}
                    </span>
                    <span className='truncate max-w-[150px]'>
                      {order.payment_id}
                    </span>
                  </div>
                )}
                
                {/* Show refund information if order is refunded */}
                {(order.payment_status === "refunded" || order.payment_status === "partially_refunded") && order.refund_amount && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className='flex justify-between font-medium'>
                      <span>{t("refundAmount") || "Refund Amount"}</span>
                      <span>{formatCurrency(order.refund_amount)}</span>
                    </div>
                    {order.refund_date && (
                      <div className='flex justify-between text-sm mt-1'>
                        <span className='text-muted-foreground'>{t("refundDate") || "Refund Date"}</span>
                        <span>{format(new Date(order.refund_date), "PPP")}</span>
                      </div>
                    )}
                    {order.refund_reason && (
                      <div className='flex justify-between text-sm mt-1'>
                        <span className='text-muted-foreground'>{t("refundReason") || "Reason"}</span>
                        <span>{order.refund_reason}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show refund request button if order is eligible */}
                {order.payment_status === "paid" && 
                 order.status === "delivered" && (              <div className="mt-4 pt-4 border-t border-gray-200">
                    {order.refund_status === "pending" ? (
                      <div className="w-full rounded-md bg-yellow-50 p-3 text-center">
                        <p className="text-sm font-medium text-yellow-800">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {t("refundRequestPending") || "Your refund request is pending review"}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          {t("refundRequestPendingDescription") || "We'll notify you once your request has been processed."}
                        </p>
                      </div>
                    ) : order.refund_status === "rejected" ? (
                      <div className="w-full rounded-md bg-red-50 p-3 text-center mb-2">
                        <p className="text-sm font-medium text-red-800">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {t("refundRequestRejected") || "Your refund request was declined"}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {t("refundRequestRejectedDescription") || "Please contact customer support for more information."}
                        </p>
                      </div>
                    ) : (
                      <RefundRequestButton order={order} />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center'>
                  <MapPin className='h-5 w-5 mr-2' />
                  {t("shippingAddress")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className='not-italic space-y-1 text-sm'>
                  <p className='font-medium'>
                    {order.shipping_address.full_name}
                  </p>
                  <p>{order.shipping_address.address_line1}</p>
                  {order.shipping_address.address_line2 && (
                    <p>{order.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.state}{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </address>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Refund Request Button Component
function RefundRequestButton({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const supabase = createClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Determine if order is eligible for refund
  // Only delivered orders within 14 days can be eligible
  const isEligibleForRefund = () => {
    if (order.status !== "delivered" || order.payment_status !== "paid") {
      return false;
    }
    
    // Check if order was delivered within the last 14 days
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceOrder <= 14; // Only allow refunds within 14 days
  };
    // Submit refund request
  const handleSubmitRefundRequest = async () => {
    if (!reason) {
      setError("Please select a reason for your refund request");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit refund request via API
      const response = await fetch("/api/refund-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          additionalInfo,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit refund request");
      }
      
      setIsDialogOpen(false);
      toast.success("Your refund request has been submitted successfully", {
        description: "Our team will review your request and get back to you shortly.",
      });
      
      // Refresh the page to show the updated status
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (error: any) {
      console.error("Error submitting refund request:", error);
      setError(error.message || "Failed to submit refund request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If not eligible, show disabled button with explanation
  if (!isEligibleForRefund()) {
    return (
      <div className="w-full">
        <Button 
          disabled 
          variant="outline" 
          className="w-full"
          title="Only delivered orders within 14 days are eligible for refund"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("requestRefund") || "Request Refund"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          {t("refundEligibilityNote") || "Only delivered orders within 14 days are eligible for refund"}
        </p>
      </div>
    );
  }
  
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("requestRefund") || "Request Refund"}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("refundRequestTitle") || "Request a Refund"}</DialogTitle>
            <DialogDescription>
              {t("refundRequestDescription") || "Please provide details about why you're requesting a refund for this order."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="refund-reason">{t("refundReason") || "Reason for refund"}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="refund-reason">
                  <SelectValue placeholder={t("selectRefundReason") || "Select a reason"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">
                    {t("refundReasonDamaged") || "Item arrived damaged"}
                  </SelectItem>
                  <SelectItem value="defective">
                    {t("refundReasonDefective") || "Item is defective"}
                  </SelectItem>
                  <SelectItem value="not_as_described">
                    {t("refundReasonNotAsDescribed") || "Item not as described"}
                  </SelectItem>
                  <SelectItem value="wrong_item">
                    {t("refundReasonWrongItem") || "Received wrong item"}
                  </SelectItem>
                  <SelectItem value="no_longer_wanted">
                    {t("refundReasonNoLongerWanted") || "No longer wanted/needed"}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("refundReasonOther") || "Other reason"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="additional-info">
                {t("additionalInformation") || "Additional Information"}
              </Label>
              <Textarea
                id="additional-info"
                placeholder={t("additionalInfoPlaceholder") || "Please provide more details about your refund request..."}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
              />
            </div>
            
            {error && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmitRefundRequest}
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? (
                <>
                  <ChevronsUpDown className="h-4 w-4 mr-2 animate-spin" />
                  {t("submitting") || "Submitting..."}
                </>
              ) : (
                t("submitRequest") || "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
