"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { CreditCard, DollarSign, Save, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentSettings {
  stripe_public_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;
  enable_stripe_checkout: boolean;
  enable_stripe_elements: boolean;
  allow_refunds: boolean;
  payment_currency: string;
  auto_capture_payments: boolean;
}

interface Order {
  id: number;
  created_at: string;
  total_amount: string;
  payment_status: string;
  payment_id?: string;
  payment_details?: any;
  customer?: {
    name?: string;
    email?: string;
  };
}

export default function SettingsPage() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripe_public_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    enable_stripe_checkout: true,
    enable_stripe_elements: true,
    allow_refunds: true,
    payment_currency: 'usd',
    auto_capture_payments: true,
  });
  const [refundOrders, setRefundOrders] = useState<Order[]>([]);
  const [isTestModeActive, setIsTestModeActive] = useState(true);
  const [showSecretKeyAlert, setShowSecretKeyAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch settings from DB on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      try {
        // Fetch payment settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('type', 'payment')
          .maybeSingle();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }
        
        if (settingsData?.settings) {
          setPaymentSettings(prev => ({
            ...prev,
            ...settingsData.settings,
          }));
        }
        
        // Fetch recent orders that might need refunds
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            payment_status,
            payment_id,
            payment_details,
            customer:customer_id (name, email)
          `)
          .in('payment_status', ['paid', 'partially_refunded'])
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (ordersError) {
          throw ordersError;
        }
        
        if (orders) {
          setRefundOrders(orders);
        }
        
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        setError(error.message || 'Failed to load settings');
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []); // Removed supabase from dependency array
  
  const handleSettingChange = (key: keyof PaymentSettings, value: any) => {
    setPaymentSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      // Validate required fields
      if (paymentSettings.enable_stripe_checkout || paymentSettings.enable_stripe_elements) {
        if (!paymentSettings.stripe_public_key || !paymentSettings.stripe_secret_key) {
          throw new Error('Stripe public and secret keys are required when Stripe is enabled');
        }
      }
      
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            type: 'payment',
            settings: paymentSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'type' }
        );
      
      if (error) {
        throw error;
      }
      
      toast.success("Payment settings saved successfully");
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };
  
  // Format currency with the settings currency
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: paymentSettings.payment_currency?.toUpperCase() || 'USD',
      }).format(amount);
    } catch (error) {
      // Fallback to USD if currency code is invalid
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const getPaymentIdFromOrder = (order: Order) => {
    if (order.payment_id) {
      return order.payment_id;
    }
    
    // If no direct payment_id, try to get from payment_details
    if (order.payment_details) {
      try {
        const details = typeof order.payment_details === 'string' 
          ? JSON.parse(order.payment_details)
          : order.payment_details;
          
        return details.id || details.payment_intent || '';
      } catch (error) {
        console.error('Error parsing payment details:', error);
        return '';
      }
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !paymentSettings) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load settings</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-500">{t('settings.description')}</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="payment">
        <TabsList className="mb-4">
          <TabsTrigger value="payment">{t('settings.tabs.payment')}</TabsTrigger>
          <TabsTrigger value="refunds">{t('settings.tabs.refunds')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                {t('settings.payment.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.payment.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Mode Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="test-mode">{t('settings.payment.testMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.payment.testModeDescription')}
                  </p>
                </div>
                <Switch
                  id="test-mode"
                  checked={isTestModeActive}
                  onCheckedChange={setIsTestModeActive}
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stripe Public Key */}
                  <div className="space-y-2">
                    <Label htmlFor="stripe-public-key">{t('settings.payment.publicKey')}</Label>
                    <Input
                      id="stripe-public-key"
                      placeholder="pk_test_..."
                      value={paymentSettings.stripe_public_key || ''}
                      onChange={(e) => handleSettingChange('stripe_public_key', e.target.value)}
                    />
                  </div>
                  
                  {/* Stripe Secret Key */}
                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret-key">{t('settings.payment.secretKey')}</Label>
                    <div className="relative">
                      <Input
                        id="stripe-secret-key"
                        type="password"
                        placeholder="sk_test_..."
                        value={paymentSettings.stripe_secret_key || ''}
                        onChange={(e) => handleSettingChange('stripe_secret_key', e.target.value)}
                        onClick={() => setShowSecretKeyAlert(true)}
                      />
                      <AlertTriangle 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500 cursor-pointer"
                        title="Secret keys should be stored in environment variables"
                        onClick={() => setShowSecretKeyAlert(true)}
                      />
                    </div>
                    <p className="text-xs text-amber-600">
                      {t('settings.payment.secretKeyWarning')}
                    </p>
                  </div>
                </div>

                {/* Stripe Webhook Secret */}
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook-secret">{t('settings.payment.webhookSecret')}</Label>
                  <div className="relative">
                    <Input
                      id="stripe-webhook-secret"
                      type="password"
                      placeholder="whsec_..."
                      value={paymentSettings.stripe_webhook_secret || ''}
                      onChange={(e) => handleSettingChange('stripe_webhook_secret', e.target.value)}
                      onClick={() => setShowSecretKeyAlert(true)}
                    />
                    <AlertTriangle 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500 cursor-pointer"
                      title="Webhook secrets should be stored in environment variables"
                      onClick={() => setShowSecretKeyAlert(true)}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="payment-currency">{t('settings.payment.currency')}</Label>
                  <Select
                    value={paymentSettings.payment_currency}
                    onValueChange={(value) => handleSettingChange('payment_currency', value)}
                  >
                    <SelectTrigger id="payment-currency">
                      <SelectValue placeholder={t('settings.payment.selectCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                      <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="aud">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Feature Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stripe-checkout">{t('settings.payment.enableStripeCheckout')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.payment.enableStripeCheckoutDesc')}
                      </p>
                    </div>
                    <Switch
                      id="stripe-checkout"
                      checked={paymentSettings.enable_stripe_checkout}
                      onCheckedChange={(checked) => handleSettingChange('enable_stripe_checkout', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="stripe-elements">{t('settings.payment.enableStripeElements')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.payment.enableStripeElementsDesc')}
                      </p>
                    </div>
                    <Switch
                      id="stripe-elements"
                      checked={paymentSettings.enable_stripe_elements}
                      onCheckedChange={(checked) => handleSettingChange('enable_stripe_elements', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-refunds">{t('settings.payment.allowRefunds')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.payment.allowRefundsDesc')}
                      </p>
                    </div>
                    <Switch
                      id="allow-refunds"
                      checked={paymentSettings.allow_refunds}
                      onCheckedChange={(checked) => handleSettingChange('allow_refunds', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-capture">{t('settings.payment.autoCapture')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.payment.autoCaptureDesc')}
                      </p>
                    </div>
                    <Switch
                      id="auto-capture"
                      checked={paymentSettings.auto_capture_payments}
                      onCheckedChange={(checked) => handleSettingChange('auto_capture_payments', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('settings.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('settings.saveChanges')}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                {t('settings.refunds.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.refunds.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('settings.refunds.orderId')}</TableHead>
                      <TableHead>{t('settings.refunds.date')}</TableHead>
                      <TableHead>{t('settings.refunds.customer')}</TableHead>
                      <TableHead>{t('settings.refunds.amount')}</TableHead>
                      <TableHead>{t('settings.refunds.status')}</TableHead>
                      <TableHead className="text-right">{t('settings.refunds.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          {t('settings.refunds.noOrders')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      refundOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            {order.customer?.name || 'Guest'}
                            {order.customer?.email && (
                              <div className="text-xs text-gray-500">{order.customer.email}</div>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(order.total_amount))}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.payment_status === 'paid'
                                  ? 'default'
                                  : order.payment_status === 'partially_refunded'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <RefundOrderButton 
                              order={order} 
                              paymentId={getPaymentIdFromOrder(order)} 
                              onRefunded={(refundData) => {
                                setRefundOrders(orders => 
                                  orders.map(o => o.id === order.id ? {
                                    ...o,
                                    payment_status: refundData.status,
                                  } : o)
                                );
                              }}
                              isAllowed={paymentSettings.allow_refunds}
                              currency={paymentSettings.payment_currency}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Alert Dialog for Secret Key Security */}
      <AlertDialog open={showSecretKeyAlert} onOpenChange={setShowSecretKeyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.payment.securityWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.payment.securityWarningMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t('settings.payment.securityWarningConfirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Refund Order Button Component
function RefundOrderButton({ 
  order, 
  paymentId, 
  onRefunded,
  isAllowed = true,
  currency = 'usd',
}: { 
  order: Order; 
  paymentId: string;
  onRefunded: (data: { status: string; amount: number }) => void;
  isAllowed: boolean;
  currency: string;
}) {
  const t = useTranslations("admin");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Set default refund amount to full order amount
  useEffect(() => {
    if (order?.total_amount) {
      setRefundAmount(parseFloat(order.total_amount));
    }
  }, [order]);
  
  // Process the refund
  const processRefund = async () => {
    if (!refundAmount || !paymentId) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Call your refund API
      const response = await fetch("/api/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: paymentId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: refundReason || undefined,
          orderId: order.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process refund");
      }
      
      // Success - update the UI
      onRefunded({
        status: refundAmount < parseFloat(order.total_amount) ? "partially_refunded" : "refunded",
        amount: refundAmount,
      });
      
      setIsDialogOpen(false);
      toast.success("Refund processed successfully");
    } catch (error: any) {
      console.error("Refund error:", error);
      setError(error.message || "An error occurred while processing the refund");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!isAllowed || !paymentId}
        onClick={() => setIsDialogOpen(true)}
        title={!isAllowed ? "Refunds are disabled in settings" : !paymentId ? "No payment ID found" : "Process refund"}
      >
        {t('settings.refunds.refundButton')}
      </Button>
      
      {/* Refund Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.refunds.refundOrder')} #{order.id}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.refunds.refundDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">{t('settings.refunds.refundAmount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currency === 'jpy' ? '¥' : '$'}
                </span>
                <Input
                  id="refund-amount"
                  type="number"
                  className="pl-7"
                  value={refundAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const orderTotal = parseFloat(order.total_amount);
                    if (value > orderTotal) {
                      setRefundAmount(orderTotal);
                    } else if (value < 0) {
                      setRefundAmount(0);
                    } else {
                      setRefundAmount(value);
                    }
                  }}
                  min="0.01"
                  max={parseFloat(order.total_amount)}
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.refunds.maxRefund', { amount: formatCurrency(parseFloat(order.total_amount)) })}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refund-reason">{t('settings.refunds.reason')}</Label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger id="refund-reason">
                  <SelectValue placeholder={t('settings.refunds.selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested_by_customer">{t('settings.refunds.reasons.requestedByCustomer')}</SelectItem>
                  <SelectItem value="duplicate">{t('settings.refunds.reasons.duplicate')}</SelectItem>
                  <SelectItem value="fraudulent">{t('settings.refunds.reasons.fraudulent')}</SelectItem>
                  <SelectItem value="order_change">{t('settings.refunds.reasons.orderChange')}</SelectItem>
                  <SelectItem value="product_unavailable">{t('settings.refunds.reasons.productUnavailable')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-200">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('cancel')}</AlertDialogCancel>
            <Button 
              variant="default" 
              onClick={processRefund}
              disabled={isProcessing || !refundAmount || refundAmount <= 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.refunds.processing')}
                </>
              ) : (
                t('settings.refunds.confirmRefund')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}