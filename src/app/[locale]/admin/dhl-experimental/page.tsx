'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Truck,
  PackageSearch,
  Settings,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DHLExperimentalPage() {
  const t = useTranslations('dhl');
  const supabase = createClient();
  const locale = useParams()?.locale || 'en';
  
  // API Settings state
  const [apiSettings, setApiSettings] = useState({
    apiKey: '',
    apiSecret: '',
    accountNumber: '',
    testMode: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Create Shipment state
  const [shipmentData, setShipmentData] = useState({
    recipientName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'BE',
    weight: '1',
    length: '20',
    width: '15',
    height: '10',
    product: 'PARCEL',
    includeReturnLabel: false
  });
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  
  // Tracking state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [tracking, setTracking] = useState(false);
  
  // Handle API settings form changes
  const handleSettingsChange = (key: string, value: any) => {
    setApiSettings({
      ...apiSettings,
      [key]: value
    });
  };

  // Handle Create Shipment form changes
  const handleShipmentChange = (key: string, value: any) => {
    setShipmentData({
      ...shipmentData,
      [key]: value
    });
  };

  // Save API Settings
  const saveAPISettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'dhl',
          settings: {
            apiKey: apiSettings.apiKey,
            apiSecret: apiSettings.apiSecret,
            accountNumber: apiSettings.accountNumber,
            testMode: apiSettings.testMode
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'type' });

      if (error) throw error;
      toast.success('DHL API settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save DHL API settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Create a shipment
  const createShipment = async () => {
    setCreatingShipment(true);
    setShipmentResult(null);
    
    try {
      const response = await fetch('/api/dhl/create-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create shipment');
      }
      
      setShipmentResult(result);
      toast.success('Shipment created successfully!');
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error(error.message || 'Error creating shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  // Track a shipment
  const trackPackage = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    
    setTracking(true);
    setTrackingResult(null);
    
    try {
      const response = await fetch(`/api/dhl/track-shipment?trackingNumber=${encodeURIComponent(trackingNumber)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to track shipment');
      }
      
      setTrackingResult(result);
    } catch (error: any) {
      console.error('Error tracking shipment:', error);
      toast.error(error.message || 'Error tracking shipment');
    } finally {
      setTracking(false);
    }
  };

  // Load settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('settings')
          .eq('type', 'dhl')
          .single();
          
        if (data?.settings) {
          setApiSettings({
            apiKey: data.settings.apiKey || '',
            apiSecret: data.settings.apiSecret || '',
            accountNumber: data.settings.accountNumber || '',
            testMode: data.settings.testMode !== false
          });
        }
      } catch (error) {
        console.error('Error loading DHL settings:', error);
      }
    };
    
    loadSettings();
  }, [supabase]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-gray-500">{t('description')}</p>
      </div>
      
      <Tabs defaultValue="auth-test">
        <TabsList className="mb-4">
          <TabsTrigger value="auth-test">
            <Truck className="h-4 w-4 mr-2" />
            Test Authentication
          </TabsTrigger>
          <TabsTrigger value="create">
            <Truck className="h-4 w-4 mr-2" />
            {t('createShipment')}
          </TabsTrigger>
          <TabsTrigger value="track">
            <PackageSearch className="h-4 w-4 mr-2" />
            {t('trackShipment')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            {t('apiSettings')}
          </TabsTrigger>
        </TabsList>
        
        {/* Auth Test Tab */}
        <TabsContent value="auth-test">
          <Card>
            <CardHeader>
              <CardTitle>DHL Authentication</CardTitle>
              <CardDescription>Test authentication with DHL eCommerce Europe API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p>You can use our dedicated authentication test tool which provides the following features:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Test with the original sample code</li>
                  <li>Test with your custom credentials</li>
                  <li>View detailed API responses</li>
                </ul>
              </div>              <div>
                <Button asChild>
                  <a href={`/${locale}/admin/dhl-auth-test`}>
                    Go to Authentication Test Page
                  </a>
                </Button>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  You can also use our API endpoint to test authentication with your stored credentials
                </p>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/dhl/test-auth');
                      const result = await response.json();
                      
                      if (result.success) {
                        toast.success('Authentication successful!');
                      } else {
                        toast.error('Authentication failed');
                      }
                      
                      console.log('Authentication test result:', result);
                    } catch (error) {
                      console.error('Error testing authentication:', error);
                      toast.error('Error testing authentication');
                    }
                  }}
                  className="mt-2"
                >
                  Test Saved Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Create Shipment Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{t('createShipmentTitle')}</CardTitle>
              <CardDescription>{t('createShipmentDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!shipmentResult ? (
                <div className="space-y-6">
                  {/* Recipient Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('recipientInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">{t('recipientName')}</Label>
                        <Input
                          id="recipientName"
                          value={shipmentData.recipientName}
                          onChange={(e) => handleShipmentChange('recipientName', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street">{t('street')}</Label>
                        <Input
                          id="street"
                          value={shipmentData.street}
                          onChange={(e) => handleShipmentChange('street', e.target.value)}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('city')}</Label>
                        <Input
                          id="city"
                          value={shipmentData.city}
                          onChange={(e) => handleShipmentChange('city', e.target.value)}
                          placeholder="Brussels"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{t('postalCode')}</Label>
                        <Input
                          id="postalCode"
                          value={shipmentData.postalCode}
                          onChange={(e) => handleShipmentChange('postalCode', e.target.value)}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{t('country')}</Label>
                        <Select
                          value={shipmentData.country}
                          onValueChange={(value) => handleShipmentChange('country', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BE">Belgium</SelectItem>
                            <SelectItem value="NL">Netherlands</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="LU">Luxembourg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Package Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('packageInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">{t('weight')}</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={shipmentData.weight}
                          onChange={(e) => handleShipmentChange('weight', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product">{t('product')}</Label>
                        <Select
                          value={shipmentData.product}
                          onValueChange={(value) => handleShipmentChange('product', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PARCEL">DHL Parcel</SelectItem>
                            <SelectItem value="PARCEL_INTERNATIONAL">DHL Parcel International</SelectItem>
                            <SelectItem value="PARCEL_PLUS">DHL Parcel Plus</SelectItem>
                            <SelectItem value="EXPRESS">DHL Express</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="length">{t('length')}</Label>
                        <Input
                          id="length"
                          type="number"
                          min="1"
                          value={shipmentData.length}
                          onChange={(e) => handleShipmentChange('length', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="width">{t('width')}</Label>
                        <Input
                          id="width"
                          type="number"
                          min="1"
                          value={shipmentData.width}
                          onChange={(e) => handleShipmentChange('width', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">{t('height')}</Label>
                        <Input
                          id="height"
                          type="number"
                          min="1"
                          value={shipmentData.height}
                          onChange={(e) => handleShipmentChange('height', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="includeReturnLabel"
                          checked={shipmentData.includeReturnLabel}
                          onCheckedChange={(checked) => handleShipmentChange('includeReturnLabel', checked)}
                        />
                        <div>
                          <Label htmlFor="includeReturnLabel">{t('returnLabel')}</Label>
                          <p className="text-sm text-muted-foreground">{t('returnLabelDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-md bg-green-50">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium text-green-800">{t('shipmentCreated')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('trackingNumber')}</p>
                      <p className="font-medium">{shipmentResult.trackingNumber}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t('shippingLabel')}</p>
                    <Button variant="outline" onClick={() => window.open(shipmentResult.labelUrl, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('download')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {!shipmentResult && (
              <CardFooter className="flex justify-end">
                <Button onClick={createShipment} disabled={creatingShipment}>
                  {creatingShipment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    t('createShipmentAction')
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Track Shipment Tab */}
        <TabsContent value="track">
          <Card>
            <CardHeader>
              <CardTitle>{t('trackShipmentTitle')}</CardTitle>
              <CardDescription>{t('trackShipmentDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="e.g., 123456789"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={trackPackage} disabled={tracking}>
                    {tracking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('tracking')}
                      </>
                    ) : (
                      t('trackPackage')
                    )}
                  </Button>
                </div>
                
                {trackingResult && (
                  <div className="mt-6 border rounded-md p-4">
                    <h3 className="text-lg font-medium mb-4">{t('trackingInfo')}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-2 text-left">{t('status')}</th>
                            <th className="p-2 text-left">{t('timestamp')}</th>
                            <th className="p-2 text-left">{t('description')}</th>
                            <th className="p-2 text-left">{t('location')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trackingResult.events.map((event: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{event.status}</td>
                              <td className="p-2">{new Date(event.timestamp).toLocaleString()}</td>
                              <td className="p-2">{event.description}</td>
                              <td className="p-2">{event.location}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('apiSettingsTitle')}</CardTitle>
              <CardDescription>{t('apiSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t('apiKey')}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiSettings.apiKey}
                    onChange={(e) => handleSettingsChange('apiKey', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">{t('apiSecret')}</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={apiSettings.apiSecret}
                    onChange={(e) => handleSettingsChange('apiSecret', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">{t('accountNumber')}</Label>
                  <Input
                    id="accountNumber"
                    value={apiSettings.accountNumber}
                    onChange={(e) => handleSettingsChange('accountNumber', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="testMode"
                    checked={apiSettings.testMode}
                    onCheckedChange={(checked) => handleSettingsChange('testMode', checked)}
                  />
                  <div>
                    <Label htmlFor="testMode">{t('testMode')}</Label>
                    <p className="text-sm text-muted-foreground">{t('testModeDesc')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={saveAPISettings} disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveSettings')
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
