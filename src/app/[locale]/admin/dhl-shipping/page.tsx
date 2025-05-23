'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Truck, Package, Search, RefreshCcw, Save, X, Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Form schema for shipment creation
const createShipmentSchema = z.object({
  recipientName: z.string().min(1, { message: "Recipient name is required" }),
  recipientStreet: z.string().min(1, { message: "Street is required" }),
  recipientCity: z.string().min(1, { message: "City is required" }),
  recipientPostalCode: z.string().min(1, { message: "Postal code is required" }),
  recipientCountry: z.string().min(2, { message: "Country is required" }),
  weight: z.string().min(1, { message: "Weight is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  height: z.string().min(1, { message: "Height is required" }),
  product: z.string().min(1, { message: "Product is required" }),
  returnLabel: z.boolean().optional(),
});

// Form schema for tracking
const trackingSchema = z.object({
  trackingNumber: z.string().min(1, { message: "Tracking number is required" }),
});

// Form schema for DHL API settings
const apiSettingsSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required" }),
  apiSecret: z.string().min(1, { message: "API Secret is required" }),
  accountNumber: z.string().min(1, { message: "Account number is required" }),
  useTestMode: z.boolean().optional(),
});

// Mock DHL products for demonstration purposes
const DHL_PRODUCTS = [
  { id: "V01PAK", name: "DHL Parcel Connect" },
  { id: "V02PAK", name: "DHL Parcel International" },
  { id: "V53WPAK", name: "DHL Packet Plus" },
  { id: "V54EPAK", name: "DHL Packet International" },
  { id: "V55PAK", name: "DHL Europaket" },
];

// Mock tracking results
const MOCK_TRACKING_EVENTS = [
  { timestamp: "2023-11-19T08:30:00Z", description: "Shipment picked up", location: "Hamburg, Germany" },
  { timestamp: "2023-11-19T14:45:00Z", description: "Processed at DHL facility", location: "Hamburg, Germany" },
  { timestamp: "2023-11-20T03:20:00Z", description: "Departed facility", location: "Hamburg, Germany" },
  { timestamp: "2023-11-20T19:10:00Z", description: "Arrived at sorting center", location: "Amsterdam, Netherlands" },
  { timestamp: "2023-11-21T06:40:00Z", description: "Out for delivery", location: "Amsterdam, Netherlands" },
  { timestamp: "2023-11-21T14:15:00Z", description: "Delivered", location: "Amsterdam, Netherlands" },
];

// Mock countries
const COUNTRIES = [
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "DK", name: "Denmark" },
  { code: "SE", name: "Sweden" },
  { code: "FI", name: "Finland" },
];

export default function DHLShippingPage() {
  const t = useTranslations('dhl');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResults, setTrackingResults] = useState<any>(null);
  const [shipmentCreated, setShipmentCreated] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Form for creating shipment
  const createShipmentForm = useForm<z.infer<typeof createShipmentSchema>>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      recipientName: '',
      recipientStreet: '',
      recipientCity: '',
      recipientPostalCode: '',
      recipientCountry: 'DE',
      weight: '1.0',
      length: '20',
      width: '15',
      height: '10',
      product: 'V01PAK',
      returnLabel: false,
    },
  });

  // Form for tracking shipment
  const trackingForm = useForm<z.infer<typeof trackingSchema>>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingNumber: '',
    },
  });

  // Form for API settings
  const apiSettingsForm = useForm<z.infer<typeof apiSettingsSchema>>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      apiKey: process.env.NEXT_PUBLIC_DHL_API_KEY || '',
      apiSecret: '',
      accountNumber: '',
      useTestMode: true,
    },
  });

  // Function to simulate creating a shipment
  const onCreateShipment = async (data: z.infer<typeof createShipmentSchema>) => {
    try {
      setIsLoading(true);
      
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock successful response
      const mockResponse = {
        success: true,
        trackingNumber: '123456789DE',
        labelUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', // Dummy base64 image
      };
      
      if (mockResponse.success) {
        setTrackingNumber(mockResponse.trackingNumber);
        setShippingLabel(mockResponse.labelUrl);
        setShipmentCreated(true);
        toast.success("Shipment created successfully!");
      } else {
        throw new Error("Failed to create shipment");
      }
    } catch (error: any) {
      console.error("Error creating shipment:", error);
      toast.error("Failed to create shipment: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to simulate tracking a shipment
  const onTrackShipment = async (data: z.infer<typeof trackingSchema>) => {
    try {
      setIsLoading(true);
      
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Use mock data
      setTrackingResults({
        trackingNumber: data.trackingNumber,
        status: "Delivered",
        events: MOCK_TRACKING_EVENTS,
      });
      
      toast.success("Tracking information retrieved!");
    } catch (error: any) {
      console.error("Error tracking shipment:", error);
      toast.error("Failed to track shipment: " + (error.message || "Unknown error"));
      setTrackingResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save API settings
  const onSaveApiSettings = async (data: z.infer<typeof apiSettingsSchema>) => {
    try {
      setIsLoading(true);
      
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // In a real implementation, this would save to your database
      toast.success("API settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving API settings:", error);
      toast.error("Failed to save API settings: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('title', { defaultValue: 'DHL eCommerce Europe API Testing' })}</h1>
      <p className="text-muted-foreground">
        {t('description', { defaultValue: 'Experimental page for testing DHL eCommerce Europe API functions. Use this page to create shipments, generate labels, and track packages.' })}
      </p>

      <Tabs defaultValue="create">
        <TabsList className="mb-4">
          <TabsTrigger value="create">
            <Package className="mr-2 h-4 w-4" />
            {t('createShipment', { defaultValue: 'Create Shipment' })}
          </TabsTrigger>
          <TabsTrigger value="track">
            <Search className="mr-2 h-4 w-4" />
            {t('trackShipment', { defaultValue: 'Track Shipment' })}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('apiSettings', { defaultValue: 'API Settings' })}
          </TabsTrigger>
        </TabsList>
        
        {/* Create Shipment Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('createShipmentTitle', { defaultValue: 'Create DHL Shipment' })}</CardTitle>
              <CardDescription>
                {t('createShipmentDesc', { defaultValue: 'Fill in the details to create a new shipment and generate a shipping label.' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createShipmentForm}>
                <form onSubmit={createShipmentForm.handleSubmit(onCreateShipment)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t('recipientInfo', { defaultValue: 'Recipient Information' })}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createShipmentForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('recipientName', { defaultValue: 'Recipient Name' })}</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="recipientStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('street', { defaultValue: 'Street' })}</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="recipientCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('city', { defaultValue: 'City' })}</FormLabel>
                            <FormControl>
                              <Input placeholder="Berlin" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="recipientPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('postalCode', { defaultValue: 'Postal Code' })}</FormLabel>
                            <FormControl>
                              <Input placeholder="10115" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="recipientCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('country', { defaultValue: 'Country' })}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <h3 className="text-lg font-semibold">{t('packageInfo', { defaultValue: 'Package Information' })}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createShipmentForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('weight', { defaultValue: 'Weight (kg)' })}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0.1" placeholder="1.0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="product"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('product', { defaultValue: 'DHL Product' })}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DHL_PRODUCTS.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('length', { defaultValue: 'Length (cm)' })}</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('width', { defaultValue: 'Width (cm)' })}</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('height', { defaultValue: 'Height (cm)' })}</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createShipmentForm.control}
                        name="returnLabel"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-y-0 p-4 border rounded-md">
                            <div className="space-y-0.5">
                              <FormLabel>{t('returnLabel', { defaultValue: 'Include Return Label' })}</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                {t('returnLabelDesc', { defaultValue: 'Generate a return shipping label with the shipment' })}
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('creating', { defaultValue: 'Creating...' })}
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        {t('createShipmentAction', { defaultValue: 'Create Shipment' })}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {shipmentCreated && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-700 dark:text-green-300 flex items-center">
                    <Check className="mr-2 h-5 w-5" />
                    {t('shipmentCreated', { defaultValue: 'Shipment Created Successfully!' })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShipmentCreated(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {t('trackingNumber', { defaultValue: 'Tracking Number' })}: {trackingNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shippingLabel && (
                  <div className="flex flex-col items-center">
                    <p className="mb-2">{t('shippingLabel', { defaultValue: 'Shipping Label:' })}</p>
                    <div className="border border-gray-200 p-4 bg-white">
                      <img src={shippingLabel} alt="Shipping Label" width={300} height={400} />
                    </div>
                    <Button className="mt-4" variant="outline" onClick={() => window.open(shippingLabel)}>
                      {t('download', { defaultValue: 'Download Label' })}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Track Shipment Tab */}
        <TabsContent value="track" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('trackShipmentTitle', { defaultValue: 'Track Shipment' })}</CardTitle>
              <CardDescription>
                {t('trackShipmentDesc', { defaultValue: 'Enter a tracking number to get the current status and delivery information.' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...trackingForm}>
                <form onSubmit={trackingForm.handleSubmit(onTrackShipment)} className="space-y-4">
                  <FormField
                    control={trackingForm.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('trackingNumber', { defaultValue: 'Tracking Number' })}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123456789DE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('tracking', { defaultValue: 'Tracking...' })}
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        {t('trackPackage', { defaultValue: 'Track Package' })}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {trackingResults && (
            <Card>
              <CardHeader>
                <CardTitle>{t('trackingInfo', { defaultValue: 'Tracking Information' })}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{t('status', { defaultValue: 'Status' })}:</span> 
                  <Badge variant={trackingResults.status === "Delivered" ? "success" : "default"}>
                    {trackingResults.status}
                  </Badge>
                </div>
                <CardDescription>
                  {t('trackingNumber', { defaultValue: 'Tracking Number' })}: {trackingResults.trackingNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('timestamp', { defaultValue: 'Date & Time' })}</TableHead>
                        <TableHead>{t('description', { defaultValue: 'Description' })}</TableHead>
                        <TableHead>{t('location', { defaultValue: 'Location' })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackingResults.events.map((event: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{event.description}</TableCell>
                          <TableCell>{event.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* API Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('apiSettings', { defaultValue: 'DHL API Settings' })}</CardTitle>
              <CardDescription>
                {t('apiSettingsDesc', { defaultValue: 'Configure your DHL eCommerce Europe API credentials.' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiSettingsForm}>
                <form onSubmit={apiSettingsForm.handleSubmit(onSaveApiSettings)} className="space-y-4">
                  <FormField
                    control={apiSettingsForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apiKey', { defaultValue: 'API Key' })}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiSettingsForm.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('apiSecret', { defaultValue: 'API Secret' })}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiSettingsForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('accountNumber', { defaultValue: 'DHL Account Number' })}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiSettingsForm.control}
                    name="useTestMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 p-4 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel>{t('testMode', { defaultValue: 'Test Mode' })}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t('testModeDesc', { defaultValue: 'Use DHL sandbox environment for testing' })}
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('saving', { defaultValue: 'Saving...' })}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t('saveSettings', { defaultValue: 'Save Settings' })}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
