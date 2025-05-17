"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PlusCircle, Pencil, Save } from "lucide-react";
import {AdminLayout} from "@/components/admin-layout";

// Types for our data
type PricingParameter = {
  id: number;
  parameter_name: string;
  parameter_value: number;
  description: string;
};

type StoragePriceAdjustment = {
  id: number;
  device_model_id: number;
  storage_capacity: string;
  price_adjustment: number;
  device_model?: {
    name: string;
    device_series?: {
      name: string;
      device_types?: {
        name: string;
        device_brands?: {
          name: string;
        };
      };
    };
  };
};

type ColorPriceAdjustment = {
  id: number;
  device_model_id: number;
  color: string;
  price_adjustment: number;
  device_model?: {
    name: string;
    device_series?: {
      name: string;
      device_types?: {
        name: string;
        device_brands?: {
          name: string;
        };
      };
    };
  };
};

type AccessoryPriceAdjustment = {
  id: number;
  accessory_type: string;
  device_brand_id: number;
  price_adjustment: number;
  device_brand?: {
    name: string;
  };
};

type DeviceModel = {
  id: number;
  name: string;
  device_series_id: number;
  device_series?: {
    name: string;
    device_type_id: number;
    device_types?: {
      name: string;
      brand_id: number;
      device_brands?: {
        name: string;
      };
    };
  };
};

type DeviceBrand = {
  id: number;
  name: string;
};

export default function AdminTradePricingPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const supabase = createClient();
  
  // State for parameters
  const [parameters, setParameters] = useState<PricingParameter[]>([]);
  const [storageAdjustments, setStorageAdjustments] = useState<StoragePriceAdjustment[]>([]);
  const [colorAdjustments, setColorAdjustments] = useState<ColorPriceAdjustment[]>([]);
  const [accessoryAdjustments, setAccessoryAdjustments] = useState<AccessoryPriceAdjustment[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  
  // Edit states
  const [editingParameter, setEditingParameter] = useState<PricingParameter | null>(null);
  const [editingStorageAdjustment, setEditingStorageAdjustment] = useState<StoragePriceAdjustment | null>(null);
  const [editingColorAdjustment, setEditingColorAdjustment] = useState<ColorPriceAdjustment | null>(null);
  const [editingAccessoryAdjustment, setEditingAccessoryAdjustment] = useState<AccessoryPriceAdjustment | null>(null);
  
  // Dialog states
  const [isParameterDialogOpen, setIsParameterDialogOpen] = useState(false);
  const [isStorageDialogOpen, setIsStorageDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isAccessoryDialogOpen, setIsAccessoryDialogOpen] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch device models (with brand info)
      const { data: modelsData, error: modelsError } = await supabase
        .from("device_models")
        .select(`
          id, 
          name, 
          device_series_id,
          device_series (
            name,
            device_type_id,
            device_types: device_type_id (
              name,
              brand_id,
              device_brands: brand_id (name)
            )
          )
        `)
        .order("name", { ascending: true });
      
      if (modelsError) throw modelsError;
      setDeviceModels(modelsData || []);
      
      // Fetch device brands
      const { data: brandsData, error: brandsError } = await supabase
        .from("device_brands")
        .select("id, name")
        .order("name", { ascending: true });
      
      if (brandsError) throw brandsError;
      setDeviceBrands(brandsData || []);
      
      // Fetch pricing parameters
      const { data: paramsData, error: paramsError } = await supabase
        .from("price_prediction_parameters")
        .select("*")
        .order("parameter_name", { ascending: true });
      
      if (paramsError) throw paramsError;
      setParameters(paramsData || []);
      
      // Fetch storage price adjustments
      const { data: storageData, error: storageError } = await supabase
        .from("storage_price_adjustments")
        .select(`
          id,
          device_model_id,
          storage_capacity,
          price_adjustment,
          device_model: device_model_id (
            name,
            device_series (
              name,
              device_types: device_type_id (
                name,
                device_brands: brand_id (name)
              )
            )
          )
        `)
        .order("device_model_id", { ascending: true });
      
      if (storageError) throw storageError;
      setStorageAdjustments(storageData || []);
      
      // Fetch color price adjustments
      const { data: colorData, error: colorError } = await supabase
        .from("color_price_adjustments")
        .select(`
          id,
          device_model_id,
          color,
          price_adjustment,
          device_model: device_model_id (
            name,
            device_series (
              name,
              device_types: device_type_id (
                name,
                device_brands: brand_id (name)
              )
            )
          )
        `)
        .order("device_model_id", { ascending: true });
      
      if (colorError) throw colorError;
      setColorAdjustments(colorData || []);
      
      // Fetch accessory price adjustments
      const { data: accessoryData, error: accessoryError } = await supabase
        .from("accessory_price_adjustments")
        .select(`
          id,
          accessory_type,
          device_brand_id,
          price_adjustment,
          device_brand: device_brand_id (name)
        `)
        .order("accessory_type", { ascending: true });
      
      if (accessoryError) throw accessoryError;
      setAccessoryAdjustments(accessoryData || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load pricing data");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving a parameter
  const handleSaveParameter = async () => {
    if (!editingParameter) return;
    
    setIsLoading(true);
    
    try {
      const { id, parameter_name, parameter_value, description } = editingParameter;
      
      if (id) {
        // Update existing parameter
        const { error } = await supabase
          .from("price_prediction_parameters")
          .update({
            parameter_value,
            description,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Create new parameter
        const { error } = await supabase
          .from("price_prediction_parameters")
          .insert({
            parameter_name,
            parameter_value,
            description,
            user_uid: (await supabase.auth.getUser()).data.user?.id
          });
          
        if (error) throw error;
      }
      
      toast.success("Parameter saved successfully");
      setIsParameterDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving parameter:", error);
      toast.error("Failed to save parameter");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving a storage price adjustment
  const handleSaveStorageAdjustment = async () => {
    if (!editingStorageAdjustment) return;
    
    setIsLoading(true);
    
    try {
      const { id, device_model_id, storage_capacity, price_adjustment } = editingStorageAdjustment;
      
      if (id) {
        // Update existing adjustment
        const { error } = await supabase
          .from("storage_price_adjustments")
          .update({
            price_adjustment,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Create new adjustment
        const { error } = await supabase
          .from("storage_price_adjustments")
          .insert({
            device_model_id,
            storage_capacity,
            price_adjustment,
            user_uid: (await supabase.auth.getUser()).data.user?.id
          });
          
        if (error) throw error;
      }
      
      toast.success("Storage price adjustment saved successfully");
      setIsStorageDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving storage adjustment:", error);
      toast.error("Failed to save storage adjustment");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving a color price adjustment
  const handleSaveColorAdjustment = async () => {
    if (!editingColorAdjustment) return;
    
    setIsLoading(true);
    
    try {
      const { id, device_model_id, color, price_adjustment } = editingColorAdjustment;
      
      if (id) {
        // Update existing adjustment
        const { error } = await supabase
          .from("color_price_adjustments")
          .update({
            price_adjustment,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Create new adjustment
        const { error } = await supabase
          .from("color_price_adjustments")
          .insert({
            device_model_id,
            color,
            price_adjustment,
            user_uid: (await supabase.auth.getUser()).data.user?.id
          });
          
        if (error) throw error;
      }
      
      toast.success("Color price adjustment saved successfully");
      setIsColorDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving color adjustment:", error);
      toast.error("Failed to save color adjustment");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving an accessory price adjustment
  const handleSaveAccessoryAdjustment = async () => {
    if (!editingAccessoryAdjustment) return;
    
    setIsLoading(true);
    
    try {
      const { id, accessory_type, device_brand_id, price_adjustment } = editingAccessoryAdjustment;
      
      if (id) {
        // Update existing adjustment
        const { error } = await supabase
          .from("accessory_price_adjustments")
          .update({
            price_adjustment,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
          
        if (error) throw error;
      } else {
        // Create new adjustment
        const { error } = await supabase
          .from("accessory_price_adjustments")
          .insert({
            accessory_type,
            device_brand_id,
            price_adjustment,
            user_uid: (await supabase.auth.getUser()).data.user?.id
          });
          
        if (error) throw error;
      }
      
      toast.success("Accessory price adjustment saved successfully");
      setIsAccessoryDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving accessory adjustment:", error);
      toast.error("Failed to save accessory adjustment");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format model name with brand
  const formatModelName = (model: DeviceModel) => {
    const brand = model.device_series?.device_types?.device_brands?.name || '';
    const deviceType = model.device_series?.device_types?.name || '';
    const series = model.device_series?.name || '';
    return `${brand} ${deviceType} ${series} ${model.name}`;
  };

  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Trade-in Price Prediction</h1>
        
        <Tabs defaultValue="parameters" className="w-full">
          <TabsList>
            <TabsTrigger value="parameters">Global Parameters</TabsTrigger>
            <TabsTrigger value="storage">Storage Adjustments</TabsTrigger>
            <TabsTrigger value="colors">Color Adjustments</TabsTrigger>
            <TabsTrigger value="accessories">Accessory Adjustments</TabsTrigger>
          </TabsList>
          
          {/* Parameters Tab */}
          <TabsContent value="parameters">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Price Prediction Parameters</CardTitle>
                  <CardDescription>
                    Configure global parameters for the trade-in price prediction system.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingParameter({
                      id: 0,
                      parameter_name: '',
                      parameter_value: 0,
                      description: ''
                    });
                    setIsParameterDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Parameter
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parameters.map((param) => (
                      <TableRow key={param.id}>
                        <TableCell>{param.parameter_name}</TableCell>
                        <TableCell>{param.parameter_value}</TableCell>
                        <TableCell>{param.description}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingParameter(param);
                              setIsParameterDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {parameters.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No parameters found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Parameter Dialog */}
            <Dialog open={isParameterDialogOpen} onOpenChange={setIsParameterDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingParameter?.id ? 'Edit Parameter' : 'Add Parameter'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure pricing parameter for the trade-in system.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parameter-name">Parameter Name</Label>
                    <Input
                      id="parameter-name"
                      value={editingParameter?.parameter_name || ''}
                      onChange={(e) => setEditingParameter(prev => 
                        prev ? {...prev, parameter_name: e.target.value} : null
                      )}
                      disabled={!!editingParameter?.id}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parameter-value">Value</Label>
                    <Input
                      id="parameter-value"
                      type="number"
                      step="0.01"
                      value={editingParameter?.parameter_value || 0}
                      onChange={(e) => setEditingParameter(prev => 
                        prev ? {...prev, parameter_value: parseFloat(e.target.value)} : null
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parameter-description">Description</Label>
                    <Input
                      id="parameter-description"
                      value={editingParameter?.description || ''}
                      onChange={(e) => setEditingParameter(prev => 
                        prev ? {...prev, description: e.target.value} : null
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsParameterDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveParameter} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Storage Adjustments Tab */}
          <TabsContent value="storage">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Storage Capacity Adjustments</CardTitle>
                  <CardDescription>
                    Configure price adjustments based on device storage capacity.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingStorageAdjustment({
                      id: 0,
                      device_model_id: 0,
                      storage_capacity: '',
                      price_adjustment: 0
                    });
                    setIsStorageDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Model</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Price Adjustment</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storageAdjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          {adj.device_model ? formatModelName(adj.device_model as unknown as DeviceModel) : 'Unknown'}
                        </TableCell>
                        <TableCell>{adj.storage_capacity}</TableCell>
                        <TableCell>${adj.price_adjustment.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingStorageAdjustment(adj);
                              setIsStorageDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {storageAdjustments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No storage adjustments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Storage Dialog */}
            <Dialog open={isStorageDialogOpen} onOpenChange={setIsStorageDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStorageAdjustment?.id ? 'Edit Storage Adjustment' : 'Add Storage Adjustment'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure price adjustment for specific storage capacity.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-model">Device Model</Label>
                    <select
                      id="device-model"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editingStorageAdjustment?.device_model_id || ''}
                      onChange={(e) => setEditingStorageAdjustment(prev => 
                        prev ? {...prev, device_model_id: parseInt(e.target.value)} : null
                      )}
                      disabled={!!editingStorageAdjustment?.id}
                    >
                      <option value="">Select Device Model</option>
                      {deviceModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {formatModelName(model)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storage-capacity">Storage Capacity</Label>
                    <select
                      id="storage-capacity"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editingStorageAdjustment?.storage_capacity || ''}
                      onChange={(e) => setEditingStorageAdjustment(prev => 
                        prev ? {...prev, storage_capacity: e.target.value} : null
                      )}
                      disabled={!!editingStorageAdjustment?.id}
                    >
                      <option value="">Select Storage</option>
                      <option value="16GB">16GB</option>
                      <option value="32GB">32GB</option>
                      <option value="64GB">64GB</option>
                      <option value="128GB">128GB</option>
                      <option value="256GB">256GB</option>
                      <option value="512GB">512GB</option>
                      <option value="1TB">1TB</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price-adjustment">Price Adjustment ($)</Label>
                    <Input
                      id="price-adjustment"
                      type="number"
                      step="0.01"
                      value={editingStorageAdjustment?.price_adjustment || 0}
                      onChange={(e) => setEditingStorageAdjustment(prev => 
                        prev ? {...prev, price_adjustment: parseFloat(e.target.value)} : null
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsStorageDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStorageAdjustment} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Colors Tab */}
          <TabsContent value="colors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Color Adjustments</CardTitle>
                  <CardDescription>
                    Configure price adjustments based on device color.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingColorAdjustment({
                      id: 0,
                      device_model_id: 0,
                      color: '',
                      price_adjustment: 0
                    });
                    setIsColorDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Model</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Price Adjustment</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colorAdjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>
                          {adj.device_model ? formatModelName(adj.device_model as unknown as DeviceModel) : 'Unknown'}
                        </TableCell>
                        <TableCell>{adj.color}</TableCell>
                        <TableCell>${adj.price_adjustment.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingColorAdjustment(adj);
                              setIsColorDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {colorAdjustments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No color adjustments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Color Dialog */}
            <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingColorAdjustment?.id ? 'Edit Color Adjustment' : 'Add Color Adjustment'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure price adjustment for specific device color.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-model-color">Device Model</Label>
                    <select
                      id="device-model-color"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editingColorAdjustment?.device_model_id || ''}
                      onChange={(e) => setEditingColorAdjustment(prev => 
                        prev ? {...prev, device_model_id: parseInt(e.target.value)} : null
                      )}
                      disabled={!!editingColorAdjustment?.id}
                    >
                      <option value="">Select Device Model</option>
                      {deviceModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {formatModelName(model)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={editingColorAdjustment?.color || ''}
                      onChange={(e) => setEditingColorAdjustment(prev => 
                        prev ? {...prev, color: e.target.value} : null
                      )}
                      disabled={!!editingColorAdjustment?.id}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color-price-adjustment">Price Adjustment ($)</Label>
                    <Input
                      id="color-price-adjustment"
                      type="number"
                      step="0.01"
                      value={editingColorAdjustment?.price_adjustment || 0}
                      onChange={(e) => setEditingColorAdjustment(prev => 
                        prev ? {...prev, price_adjustment: parseFloat(e.target.value)} : null
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsColorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveColorAdjustment} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Accessories Tab */}
          <TabsContent value="accessories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Accessory Value Adjustments</CardTitle>
                  <CardDescription>
                    Configure price adjustments for included accessories by brand.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingAccessoryAdjustment({
                      id: 0,
                      accessory_type: '',
                      device_brand_id: 0,
                      price_adjustment: 0
                    });
                    setIsAccessoryDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Accessory Type</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Price Adjustment</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessoryAdjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>{adj.accessory_type}</TableCell>
                        <TableCell>{adj.device_brand?.name || 'Unknown'}</TableCell>
                        <TableCell>${adj.price_adjustment.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAccessoryAdjustment(adj);
                              setIsAccessoryDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {accessoryAdjustments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No accessory adjustments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Accessory Dialog */}
            <Dialog open={isAccessoryDialogOpen} onOpenChange={setIsAccessoryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAccessoryAdjustment?.id ? 'Edit Accessory Value' : 'Add Accessory Value'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure price adjustment for accessory by brand.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessory-type">Accessory Type</Label>
                    <select
                      id="accessory-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editingAccessoryAdjustment?.accessory_type || ''}
                      onChange={(e) => setEditingAccessoryAdjustment(prev => 
                        prev ? {...prev, accessory_type: e.target.value} : null
                      )}
                      disabled={!!editingAccessoryAdjustment?.id}
                    >
                      <option value="">Select Accessory Type</option>
                      <option value="charger">Charger</option>
                      <option value="box">Original Box</option>
                      <option value="earphones">Earphones/Headphones</option>
                      <option value="case">Case</option>
                      <option value="screen_protector">Screen Protector</option>
                      <option value="accessories">Other Accessories</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device-brand">Brand</Label>
                    <select
                      id="device-brand"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={editingAccessoryAdjustment?.device_brand_id || ''}
                      onChange={(e) => setEditingAccessoryAdjustment(prev => 
                        prev ? {...prev, device_brand_id: parseInt(e.target.value)} : null
                      )}
                      disabled={!!editingAccessoryAdjustment?.id}
                    >
                      <option value="">Select Brand</option>
                      {deviceBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accessory-price-adjustment">Price Adjustment ($)</Label>
                    <Input
                      id="accessory-price-adjustment"
                      type="number"
                      step="0.01"
                      value={editingAccessoryAdjustment?.price_adjustment || 0}
                      onChange={(e) => setEditingAccessoryAdjustment(prev => 
                        prev ? {...prev, price_adjustment: parseFloat(e.target.value)} : null
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAccessoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAccessoryAdjustment} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
