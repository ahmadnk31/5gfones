"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Search,
  FilterIcon,
  Edit,
  Eye,
  MoreHorizontal,
  Check,
  X,
  Calendar,
  User,
  Package,
  FileText,
  Clock,
  Banknote,
  CreditCard,
} from "lucide-react";
import { StripeProvider } from "@/components/stripe-provider";
import { StripePaymentForm } from "@/components/stripe-payment-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  format,
  parseISO,
  isToday,
  subDays,
  startOfWeek,
  startOfMonth,
} from "date-fns";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: string; // Decimal stored as string from Supabase
  in_stock: number;
}

interface ProductVariant {
  id: number;
  product_id?: number;
  variant_name: string;
  variant_value: string;
  price_adjustment?: string; // Decimal stored as string from Supabase
  stock?: number;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_variant_id: number | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  product: Product | null;
  product_variant: ProductVariant | null;
}

interface Order {
  id: number;
  customer_id: string;
  total_amount: number;
  payment_method_id: number | null;
  status: string;
  created_at: string;
  user_uid: string;
  items?: OrderItem[];
  customer?: Customer | null;
  payment_method?: PaymentMethod | null;
}

interface OrderDetails {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method_name: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  stripe_payment_id?: string;
  payment_status?: string;
  items: Array<{
    product_name: string;
    variant_name?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export default function OrdersPage() {
  // Setup internationalization
  const t = useTranslations("orders");
  const tAdmin = useTranslations("admin");
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const supabase = createClient();

  // State for new order form
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<
    Array<Product & { variants?: ProductVariant[] }>
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);
  const [orderItems, setOrderItems] = useState<
    Array<{
      productId: number | null;
      variantId: number | null;
      productName: string;
      variantName?: string;
      quantity: number;
      price: number;
    }>
  >([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [searchCustomerTerm, setSearchCustomerTerm] = useState("");
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch customers and products for order creation
  const fetchCustomersAndProducts = useCallback(async () => {
    // Only fetch if the dialog is open
    if (!isNewOrderDialogOpen) return;

    setIsCustomersLoading(true);
    setIsProductsLoading(true);

    try {      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, address")
        .order("name", { ascending: true });

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Fetch products with their variants
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
        id, 
        name, 
        base_price, 
        in_stock
      `
        )
        .gt("in_stock", 0)
        .order("name", { ascending: true });

      if (productsError) throw productsError;

      // Fetch variants for all products
      const productIds = productsData.map((p) => p.id);
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select(
          `
        id,
        product_id,
        variant_name,
        variant_value,
        price_adjustment,
        stock
      `
        )
        .in("product_id", productIds)
        .gt("stock", 0);

      if (variantsError) throw variantsError;

      // Map variants to their products
      const productsWithVariants = productsData.map((product) => {
        const variants = variantsData
          .filter((v) => v.product_id === product.id)
          .map((v) => ({
            id: v.id,
            variant_name: v.variant_name,
            variant_value: v.variant_value,
            price:
              parseFloat(product.base_price) + parseFloat(v.price_adjustment),
          }));

        return {
          ...product,
          variants: variants.length > 0 ? variants : undefined,
        };
      });

      setProducts(productsWithVariants);
    } catch (error) {
      console.error("Error fetching data for order creation:", error);
    } finally {
      setIsCustomersLoading(false);
      setIsProductsLoading(false);
    }
  }, [isNewOrderDialogOpen, supabase]);

  // Reset order form
  const resetOrderForm = () => {
    setSelectedCustomer(null);
    setSelectedPaymentMethod(null);
    setOrderItems([]);
    setSearchCustomerTerm("");
    setSearchProductTerm("");
  };

  // Effect to fetch data when the dialog opens
  useEffect(() => {
    if (isNewOrderDialogOpen) {
      fetchCustomersAndProducts();
    } else {
      resetOrderForm();
    }
  }, [isNewOrderDialogOpen, fetchCustomersAndProducts]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchCustomerTerm) return customers;

    const term = searchCustomerTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(term) ||
        customer.phone?.includes(term) ||
        customer.email?.toLowerCase().includes(term)
    );
  }, [customers, searchCustomerTerm]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchProductTerm) return products;

    const term = searchProductTerm.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [products, searchProductTerm]);

  // Add an item to the order
  const addOrderItem = (
    productId: number,
    productName: string,
    price: number,
    variantId?: number,
    variantName?: string
  ) => {
    const existingItemIndex = orderItems.findIndex(
      (item) =>
        item.productId === productId && item.variantId === (variantId || null)
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          productId,
          variantId: variantId || null,
          productName,
          variantName,
          quantity: 1,
          price,
        },
      ]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = Math.max(1, quantity);
    setOrderItems(updatedItems);
  };

  // Remove an item from the order
  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };
  // Calculate total order amount
  const calculateTotalAmount = () => {
    return orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Handle successful Stripe payment
  const handleStripePaymentSuccess = async (paymentId: string) => {
    setIsPaymentProcessing(false);
    // Now create the order with the payment ID
    await createOrder(paymentId);
  };

  // Create new order
  const createOrder = async (stripePaymentId?: string) => {
    if (!selectedCustomer || orderItems.length === 0) return;

    // For Stripe payments, let the payment form handle the loading state
    if (!showStripePayment) {
      setIsCreatingOrder(true);
    }

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      } // Create the order with appropriate payment information
      const orderData: any = {
        customer_id: selectedCustomer.id,
        total_amount: calculateTotalAmount(),
        status: "pending",
        user_uid: userId,
      };

      // If using a standard payment method, include it
      if (!showStripePayment) {
        orderData.payment_method_id = selectedPaymentMethod;
      }

      // If using Stripe, add payment reference
      if (showStripePayment && stripePaymentId) {
        orderData.stripe_payment_id = stripePaymentId;
        orderData.payment_status = "paid";
        // This assumes you have a "payment_method_name" column in your orders table
        // You might need to adjust this based on your database schema
        orderData.payment_method_name = "Credit Card";
      }

      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsToInsert = orderItems.map((item) => ({
        order_id: createdOrder.id,
        product_id: item.productId,
        product_variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // Close dialog and reset form
      setIsNewOrderDialogOpen(false);

      // Display success message
      alert("Order created successfully!");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      if (!showStripePayment) {
        setIsCreatingOrder(false);
      }
    }
  };

  // Fetch orders data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            id, 
            customer_id, 
            total_amount, 
            payment_method_id, 
            status, 
            created_at, 
            user_uid
          `
          )
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch customers data for the orders
        const customerIds = ordersData
          .map((order) => order.customer_id)
          .filter(Boolean);
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("id, name, email, phone, address")
          .in("id", customerIds);

        if (customersError) throw customersError;

        // Fetch payment methods
        const { data: methodsData, error: methodsError } = await supabase
          .from("payment_methods")
          .select("id, name");

        if (methodsError) throw methodsError;
        setPaymentMethods(methodsData || []);

        // Map customers to orders
        const ordersWithCustomers = ordersData.map((order) => {
          const customer =
            customersData?.find((c) => c.id === order.customer_id) || null;
          const paymentMethod =
            methodsData?.find((p) => p.id === order.payment_method_id) || null;
          return {
            ...order,
            customer,
            payment_method: paymentMethod,
          };
        });

        setOrders(ordersWithCustomers);
        setFilteredOrders(ordersWithCustomers);
      } catch (error: any) {
        console.error("Error fetching orders:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up realtime subscription
    const ordersChannel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          console.log("Realtime order change:", payload);

          if (payload.eventType === "INSERT") {
            // Fetch customer data for new order
            const newOrder = payload.new as Order;

            if (newOrder.customer_id) {
              const { data: customerData, error } = await supabase
                .from("customers")
                .select("id, name, email, phone, address")
                .eq("id", newOrder.customer_id)
                .single();

              let paymentMethodData: PaymentMethod | null = null;

              if (newOrder.payment_method_id) {
                const { data: methodData } = await supabase
                  .from("payment_methods")
                  .select("id, name")
                  .eq("id", newOrder.payment_method_id)
                  .single();

                if (methodData) {
                  paymentMethodData = {
                    id: methodData.id,
                    name: methodData.name,
                  };
                }
              }

              // Create a properly typed order object
              const orderWithDetails: Order = {
                ...newOrder,
                customer: customerData
                  ? {
                      id: customerData.id,
                      name: customerData.name,
                      email: customerData.email,
                      phone: customerData.phone,
                      address: customerData.address,
                    }
                  : null,
                payment_method: paymentMethodData,
              };

              setOrders((prev) => [orderWithDetails, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id
                  ? { ...order, ...updatedOrder }
                  : order
              )
            );

            // If the updated order is the one being viewed, update the details
            if (selectedOrder?.id === updatedOrder.id) {
              setSelectedOrder((prev) =>
                prev ? { ...prev, ...updatedOrder } : prev
              );
            }
          } else if (payload.eventType === "DELETE") {
            const deletedOrderId = payload.old.id;
            setOrders((prev) =>
              prev.filter((order) => order.id !== deletedOrderId)
            );
          }
        }
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // Filter orders based on search, status and time period
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by time period
    if (timeFilter === "today") {
      filtered = filtered.filter((order) =>
        isToday(new Date(order.created_at))
      );
    } else if (timeFilter === "week") {
      const oneWeekAgo = subDays(new Date(), 7);
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= oneWeekAgo
      );
    } else if (timeFilter === "month") {
      const oneMonthAgo = startOfMonth(new Date());
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= oneMonthAgo
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(term) ||
          (order.customer?.name &&
            order.customer.name.toLowerCase().includes(term)) ||
          (order.customer?.phone && order.customer.phone.includes(term)) ||
          (order.customer?.email &&
            order.customer.email.toLowerCase().includes(term))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, timeFilter, searchTerm]);
  // Handle viewing order details
  const handleViewOrder = async (orderId: number) => {
    try {
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          payment_method_id,
          customer_id,
          stripe_payment_id,
          payment_status,
          payment_method_name
        `
        )
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Get payment method
      let paymentMethodName = null;
      if (orderData.payment_method_id) {
        const { data: paymentMethod } = await supabase
          .from("payment_methods")
          .select("name")
          .eq("id", orderData.payment_method_id)
          .single();

        if (paymentMethod) {
          paymentMethodName = paymentMethod.name;
        }
      }

      // Get customer info
      let customerName = "Unknown Customer";
      let customerPhone = "";
      let customerEmail = null;
      let customerAddress = null;

      if (orderData.customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("name, phone, email, address")
          .eq("id", orderData.customer_id)
          .single();

        if (customer) {
          customerName = customer.name;
          customerPhone = customer.phone;
          customerEmail = customer.email;
          customerAddress = customer.address;
        }
      }

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          id, 
          quantity, 
          unit_price,
          product_id,
          product_variant_id
        `
        )
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Get product details for items
      const formattedItems = await Promise.all(
        itemsData.map(async (item) => {
          let productName = "Unknown Product";
          let variantName;

          // Get product info
          if (item.product_id) {
            const { data: product } = await supabase
              .from("products")
              .select("name")
              .eq("id", item.product_id)
              .single();

            if (product) {
              productName = product.name;
            }
          }

          // Get variant info
          if (item.product_variant_id) {
            const { data: variant } = await supabase
              .from("product_variants")
              .select("variant_name, variant_value")
              .eq("id", item.product_variant_id)
              .single();

            if (variant) {
              variantName = `${variant.variant_name}: ${variant.variant_value}`;
            }
          }

          return {
            product_name: productName,
            variant_name: variantName,
            quantity: item.quantity,
            unit_price: item.unit_price,
          };
        })
      ); // Use payment_method_name from Stripe if available, otherwise use the standard one
      const displayPaymentMethodName =
        orderData.payment_method_name || paymentMethodName;

      setOrderDetails({
        id: orderData.id,
        total_amount: orderData.total_amount,
        status: orderData.status,
        created_at: orderData.created_at,
        payment_method_name: displayPaymentMethodName,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: customerAddress,
        stripe_payment_id: orderData.stripe_payment_id,
        payment_status: orderData.payment_status,
        items: formattedItems,
      });

      setIsViewDialogOpen(true);
    } catch (error: any) {
      console.error("Error fetching order details:", error);
    }
  };

  // Handle updating order status
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", selectedOrder.id);
      if (error) throw error;

      // Update locally as well in case realtime fails
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );

      // Show success message
      alert(
        tAdmin("orderUpdated", {
          fallback: "Order status updated successfully",
        })
      );

      setIsUpdateStatusDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
    } catch (error: any) {
      console.error("Error updating order status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            {" "}
            <div>
              <CardTitle className='text-2xl'>{tAdmin("orders")}</CardTitle>
              <CardDescription>{tAdmin("ordersDescription")}</CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row gap-2 w-full md:w-auto'>
              <div className='relative w-full sm:w-64'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                <Input
                  placeholder={tAdmin("searchOrders", {
                    fallback: "Search orders...",
                  })}
                  className='pl-8'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsNewOrderDialogOpen(true)}>
                <PlusCircle className='h-4 w-4 mr-1' />
                {tAdmin("newOrder")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className='space-y-4'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <Tabs
                value={timeFilter}
                onValueChange={setTimeFilter}
                className='w-full sm:w-auto'
              >
                {" "}
                <TabsList>
                  <TabsTrigger value='all'>
                    {tAdmin("allTime", { fallback: "All Time" })}
                  </TabsTrigger>
                  <TabsTrigger value='today'>
                    {tAdmin("today", { fallback: "Today" })}
                  </TabsTrigger>
                  <TabsTrigger value='week'>
                    {tAdmin("thisWeek", { fallback: "This Week" })}
                  </TabsTrigger>
                  <TabsTrigger value='month'>
                    {tAdmin("thisMonth", { fallback: "This Month" })}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className='flex items-center gap-2 w-full sm:w-auto'>
                {" "}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-full sm:w-40'>
                    <SelectValue
                      placeholder={tAdmin("filterByStatus", {
                        fallback: "Filter by status",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t("allOrders")}</SelectItem>
                    <SelectItem value='pending'>{t("pending")}</SelectItem>
                    <SelectItem value='completed'>{t("completed")}</SelectItem>
                    <SelectItem value='cancelled'>{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>{" "}
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                <span className='ml-3 text-gray-500'>
                  {tAdmin("loadingOrders", { fallback: "Loading orders..." })}
                </span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className='text-center py-12'>
                <Package className='mx-auto h-12 w-12 text-gray-300' />
                <h3 className='mt-4 text-lg font-medium'>
                  {t("noResults", { fallback: "No orders found" })}
                </h3>
                <p className='mt-2 text-sm text-gray-500'>
                  {tAdmin("tryAdjustingFilters", {
                    fallback: "Try adjusting your search or filters",
                  })}
                </p>
              </div>
            ) : (
              <div className='rounded-md border overflow-hidden'>
                {" "}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {tAdmin("orderId", { fallback: "Order ID" })}
                      </TableHead>
                      <TableHead>
                        {tAdmin("customer", { fallback: "Customer" })}
                      </TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>
                        {tAdmin("amount", { fallback: "Amount" })}
                      </TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className='text-right'>
                        {tAdmin("actions", { fallback: "Actions" })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className='font-medium'>
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <div className='font-medium'>
                            {order.customer?.name || "Unknown"}
                          </div>
                          {order.customer?.phone && (
                            <div className='text-xs text-gray-500'>
                              {order.customer.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          {formatCurrency(order.total_amount)}
                        </TableCell>{" "}
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(order.status) as any}
                            className='capitalize'
                          >
                            {t(order.status, { fallback: order.status })}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              {" "}
                              <DropdownMenuItem
                                onClick={() => handleViewOrder(order.id)}
                              >
                                <Eye className='h-4 w-4 mr-2' />
                                {tAdmin("viewDetails", {
                                  fallback: "View Details",
                                })}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(order.status);
                                  setIsUpdateStatusDialogOpen(true);
                                }}
                              >
                                <Edit className='h-4 w-4 mr-2' />
                                {tAdmin("updateStatus", {
                                  fallback: "Update Status",
                                })}
                              </DropdownMenuItem>{" "}
                              <DropdownMenuItem>
                                <FileText className='h-4 w-4 mr-2' />
                                {tAdmin("printInvoice", {
                                  fallback: "Print Invoice",
                                })}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={
                                  order.status === "cancelled"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(
                                    order.status === "cancelled"
                                      ? "pending"
                                      : "cancelled"
                                  );
                                  setIsUpdateStatusDialogOpen(true);
                                }}
                              >
                                {" "}
                                {order.status === "cancelled" ? (
                                  <>
                                    <Check className='h-4 w-4 mr-2' />
                                    {tAdmin("restoreOrder", {
                                      fallback: "Restore Order",
                                    })}
                                  </>
                                ) : (
                                  <>
                                    <X className='h-4 w-4 mr-2' />
                                    {tAdmin("cancelOrder", {
                                      fallback: "Cancel Order",
                                    })}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Order #{orderDetails?.id}</DialogTitle>
            <DialogDescription>
              Order placed on{" "}
              {orderDetails ? formatDate(orderDetails.created_at) : ""}
            </DialogDescription>
          </DialogHeader>

          {orderDetails && (
            <div className='grid gap-6'>
              <div className='flex flex-col md:flex-row justify-between gap-6'>
                {/* Order Info */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-500'>Order Date:</span>
                    <span className='font-medium'>
                      {formatDate(orderDetails.created_at)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={
                        getStatusBadgeVariant(orderDetails.status) as any
                      }
                      className='capitalize'
                    >
                      {orderDetails.status}
                    </Badge>
                  </div>{" "}
                  <div className='flex items-center gap-2'>
                    <Banknote className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-500'>
                      Payment Method:
                    </span>
                    <span>
                      {orderDetails.payment_method_name || "Standard Payment"}
                      {orderDetails.stripe_payment_id && (
                        <span className='ml-1 text-xs text-blue-600'>
                          (Stripe Payment)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <User className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-500'>Customer:</span>
                    <span className='font-medium'>
                      {orderDetails.customer_name}
                    </span>
                  </div>
                  {orderDetails.customer_phone && (
                    <div className='text-sm'>
                      <span className='text-gray-500'>Phone:</span>{" "}
                      {orderDetails.customer_phone}
                    </div>
                  )}
                  {orderDetails.customer_email && (
                    <div className='text-sm'>
                      <span className='text-gray-500'>Email:</span>{" "}
                      {orderDetails.customer_email}
                    </div>
                  )}
                  {orderDetails.customer_address && (
                    <div className='text-sm'>
                      <span className='text-gray-500'>Address:</span>{" "}
                      {orderDetails.customer_address}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className='border rounded-lg overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className='text-right'>Quantity</TableHead>
                      <TableHead className='text-right'>Price</TableHead>
                      <TableHead className='text-right'>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>{item.product_name}</div>
                          {item.variant_name && (
                            <div className='text-xs text-gray-500'>
                              {item.variant_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.quantity}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(item.unit_price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className='border rounded-lg p-4'>
                <div className='flex justify-between text-lg font-medium'>
                  <span>Total:</span>
                  <span>{formatCurrency(orderDetails.total_amount)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button>
              <FileText className='h-4 w-4 mr-2' />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Update Order Status Dialog */}{" "}
      <Dialog
        open={isUpdateStatusDialogOpen}
        onOpenChange={setIsUpdateStatusDialogOpen}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{tAdmin("updateOrderStatus")}</DialogTitle>
            <DialogDescription>
              {tAdmin("changeStatusForOrder", {
                fallback: "Change the status for order",
              })}{" "}
              #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='status'>{t("status")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={tAdmin("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>{t("pending")}</SelectItem>
                    <SelectItem value='processing'>
                      {t("processing")}
                    </SelectItem>
                    <SelectItem value='shipped'>{t("shipped")}</SelectItem>
                    <SelectItem value='delivered'>{t("delivered")}</SelectItem>
                    <SelectItem value='completed'>{t("completed")}</SelectItem>
                    <SelectItem value='cancelled'>{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsUpdateStatusDialogOpen(false);
                setSelectedOrder(null);
                setNewStatus("");
              }}
            >
              {t("cancel", { fallback: "Cancel" })}
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              {tAdmin("confirmStatusUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* New Order Dialog */}
      <Dialog
        open={isNewOrderDialogOpen}
        onOpenChange={setIsNewOrderDialogOpen}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Add a new customer order</DialogDescription>
          </DialogHeader>
          <div className='space-y-6'>
            {/* Customer Selection */}
            <div className='space-y-2'>
              <Label>Select Customer</Label>
              <div className='flex gap-2'>
                <div className='relative w-full'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                  <Input
                    placeholder='Search customers...'
                    className='pl-8'
                    value={searchCustomerTerm}
                    onChange={(e) => setSearchCustomerTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className='border rounded-md h-48 overflow-y-auto p-1'>
                {isCustomersLoading ? (
                  <div className='flex items-center justify-center h-full'>
                    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className='flex items-center justify-center h-full text-gray-500'>
                    No customers found
                  </div>
                ) : (
                  <div className='space-y-1'>
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-2 rounded-md cursor-pointer ${
                          selectedCustomer?.id === customer.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className='font-medium'>{customer.name}</div>
                        <div className='text-xs text-gray-500 flex items-center gap-2'>
                          <span>{customer.phone}</span>
                          {customer.email && <span>• {customer.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className='mt-2 p-3 border rounded-md bg-gray-50'>
                  <div className='font-medium'>Selected Customer:</div>
                  <div className='text-sm'>
                    <span className='font-medium'>{selectedCustomer.name}</span>{" "}
                    • {selectedCustomer.phone}
                    {selectedCustomer.email && <> • {selectedCustomer.email}</>}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className='space-y-2'>
              <Label>Payment Method</Label>
              <div className='flex items-center gap-2 mb-4'>
                <Button
                  type='button'
                  variant={!showStripePayment ? "default" : "outline"}
                  className='flex-1'
                  onClick={() => setShowStripePayment(false)}
                >
                  <Banknote className='h-4 w-4 mr-2' />
                  Standard Payment
                </Button>
                <Button
                  type='button'
                  variant={showStripePayment ? "default" : "outline"}
                  className='flex-1'
                  onClick={() => setShowStripePayment(true)}
                >
                  <CreditCard className='h-4 w-4 mr-2' />
                  Credit Card
                </Button>
              </div>
              {!showStripePayment ? (
                <Select
                  value={selectedPaymentMethod?.toString() || ""}
                  onValueChange={(val) =>
                    setSelectedPaymentMethod(val ? parseInt(val) : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select payment method' />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className='border p-4 rounded-md'>
                  {selectedCustomer ? (
                    <StripeProvider>
                      <StripePaymentForm
                        amount={calculateTotalAmount()}
                        onPaymentSuccess={(paymentId) => {
                          setPaymentError(null);
                          setIsPaymentProcessing(true);
                          handleStripePaymentSuccess(paymentId);
                        }}
                        onPaymentError={(error) => {
                          setPaymentError(error);
                          setIsPaymentProcessing(false);
                        }}
                        customerId={selectedCustomer.id}
                        metadata={{
                          customerName: selectedCustomer.name,
                          customerEmail: selectedCustomer.email || "",
                          orderItems: JSON.stringify(
                            orderItems.map((item) => ({
                              productName: item.productName,
                              quantity: item.quantity,
                              price: item.price,
                            }))
                          ),
                        }}
                      />
                    </StripeProvider>
                  ) : (
                    <div className='text-amber-600 p-2'>
                      Please select a customer before making a payment.
                    </div>
                  )}
                  {paymentError && (
                    <div className='text-red-500 mt-2 text-sm'>
                      {paymentError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label>Add Products</Label>
              </div>
              <div className='flex gap-2'>
                <div className='relative w-full'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                  <Input
                    placeholder='Search products...'
                    className='pl-8'
                    value={searchProductTerm}
                    onChange={(e) => setSearchProductTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className='border rounded-md h-48 overflow-y-auto p-1'>
                {isProductsLoading ? (
                  <div className='flex items-center justify-center h-full'>
                    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className='flex items-center justify-center h-full text-gray-500'>
                    No products found
                  </div>
                ) : (
                  <div className='space-y-1'>
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className='p-2 rounded-md border border-gray-200 hover:bg-gray-50'
                      >
                        <div className='flex justify-between items-center'>
                          <div className='font-medium'>{product.name}</div>
                          {!product.variants ? (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                addOrderItem(
                                  product.id,
                                  product.name,
                                  parseFloat(product.base_price)
                                )
                              }
                            >
                              Add (
                              {formatCurrency(parseFloat(product.base_price))})
                            </Button>
                          ) : null}
                        </div>

                        {product.variants && (
                          <div className='mt-2 pl-4 border-l-2 border-gray-200 space-y-1'>
                            {product.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className='flex justify-between items-center text-sm'
                              >
                                <div>
                                  {variant.variant_name}:{" "}
                                  {variant.variant_value}
                                </div>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => {
                                    // Calculate the full price (base + adjustment)
                                    const variantPrice =
                                      parseFloat(product.base_price) +
                                      (variant.price_adjustment
                                        ? parseFloat(variant.price_adjustment)
                                        : 0);

                                    addOrderItem(
                                      product.id,
                                      product.name,
                                      variantPrice,
                                      variant.id,
                                      `${variant.variant_name}: ${variant.variant_value}`
                                    );
                                  }}
                                >
                                  Add (
                                  {formatCurrency(
                                    parseFloat(product.base_price) +
                                      (variant.price_adjustment
                                        ? parseFloat(variant.price_adjustment)
                                        : 0)
                                  )}
                                  )
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className='space-y-2'>
              <Label>Order Items</Label>
              {orderItems.length === 0 ? (
                <div className='border rounded-md p-8 text-center text-gray-500'>
                  No items added to this order yet
                </div>
              ) : (
                <div className='border rounded-md overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>{item.productName}</div>
                            {item.variantName && (
                              <div className='text-xs text-gray-500'>
                                {item.variantName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              <Button
                                size='icon'
                                variant='outline'
                                className='h-7 w-7'
                                onClick={() =>
                                  updateItemQuantity(index, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                className='w-14 h-7 text-center p-0'
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) {
                                    updateItemQuantity(index, val);
                                  }
                                }}
                              />
                              <Button
                                size='icon'
                                variant='outline'
                                className='h-7 w-7'
                                onClick={() =>
                                  updateItemQuantity(index, item.quantity + 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(item.price * item.quantity)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size='icon'
                              variant='ghost'
                              className='h-7 w-7 text-red-500'
                              onClick={() => removeOrderItem(index)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Order Summary */}
              {orderItems.length > 0 && (
                <div className='border rounded-md p-4 bg-gray-50'>
                  <div className='flex justify-between text-lg font-medium'>
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotalAmount())}</span>
                  </div>
                </div>
              )}
            </div>
          </div>{" "}
          <DialogFooter className='gap-2 pt-4'>
            <Button
              variant='outline'
              onClick={() => setIsNewOrderDialogOpen(false)}
              disabled={isCreatingOrder || isPaymentProcessing}
            >
              Cancel
            </Button>
            {!showStripePayment && (
              <Button
                onClick={() => createOrder()}
                disabled={
                  !selectedCustomer ||
                  orderItems.length === 0 ||
                  isCreatingOrder ||
                  (showStripePayment && isPaymentProcessing)
                }
              >
                {isCreatingOrder && (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                )}
                Create Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
