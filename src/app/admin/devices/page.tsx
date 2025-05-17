"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  Smartphone,
  Trash2Icon,
} from "lucide-react";

// Define interfaces for device-related data
interface DeviceBrand {
  id: number;
  name: string;
  image_url: string | null;
}

interface DeviceType {
  id: number;
  name: string;
  brand_id: number;
  image_url: string | null;
  brand?: DeviceBrand;
}

interface DeviceSeries {
  id: number;
  name: string;
  device_type_id: number;
  image_url: string | null;
  deviceType?: DeviceType;
}

interface DeviceModel {
  id: number;
  name: string;
  device_series_id: number;
  image_url: string | null;
  deviceSeries?: DeviceSeries;
}

export default function DevicesPage() {
  const router = useRouter();
  const supabase = createClient();

  // Tab state
  const [activeTab, setActiveTab] = useState("brands");

  // Data states
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceSeries, setDeviceSeries] = useState<DeviceSeries[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isAddBrandDialogOpen, setIsAddBrandDialogOpen] = useState(false);
  const [isEditBrandDialogOpen, setIsEditBrandDialogOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<DeviceBrand | null>(null);
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    image_url: "",
  });

  const [isAddDeviceTypeDialogOpen, setIsAddDeviceTypeDialogOpen] =
    useState(false);
  const [isEditDeviceTypeDialogOpen, setIsEditDeviceTypeDialogOpen] =
    useState(false);
  const [currentDeviceType, setCurrentDeviceType] = useState<DeviceType | null>(
    null
  );
  const [deviceTypeFormData, setDeviceTypeFormData] = useState({
    name: "",
    brand_id: "",
    image_url: "",
  });

  const [isAddDeviceSeriesDialogOpen, setIsAddDeviceSeriesDialogOpen] =
    useState(false);
  const [isEditDeviceSeriesDialogOpen, setIsEditDeviceSeriesDialogOpen] =
    useState(false);
  const [currentDeviceSeries, setCurrentDeviceSeries] =
    useState<DeviceSeries | null>(null);
  const [deviceSeriesFormData, setDeviceSeriesFormData] = useState({
    name: "",
    device_type_id: "",
    image_url: "",
  });

  const [isAddDeviceModelDialogOpen, setIsAddDeviceModelDialogOpen] =
    useState(false);
  const [isEditDeviceModelDialogOpen, setIsEditDeviceModelDialogOpen] =
    useState(false);
  const [currentDeviceModel, setCurrentDeviceModel] =
    useState<DeviceModel | null>(null);
  const [deviceModelFormData, setDeviceModelFormData] = useState({
    name: "",
    device_series_id: "",
    image_url: "",
  });

  // Search states
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [deviceTypeSearchQuery, setDeviceTypeSearchQuery] = useState("");
  const [deviceSeriesSearchQuery, setDeviceSeriesSearchQuery] = useState("");
  const [deviceModelSearchQuery, setDeviceModelSearchQuery] = useState("");

  // Fetch data functions
  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("device_brands").select("*").order("name");

      if (brandSearchQuery) {
        query = query.ilike("name", `%${brandSearchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBrands(data || []);
    } catch (err: any) {
      console.error("Error fetching brands:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceTypes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("device_types")
        .select("*, brand:brand_id(*)")
        .order("name");

      if (deviceTypeSearchQuery) {
        query = query.ilike("name", `%${deviceTypeSearchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDeviceTypes(data || []);
    } catch (err: any) {
      console.error("Error fetching device types:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceSeries = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("device_series")
        .select("*, deviceType:device_type_id(id, name, brand_id)")
        .order("name");

      if (deviceSeriesSearchQuery) {
        query = query.ilike("name", `%${deviceSeriesSearchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDeviceSeries(data || []);
    } catch (err: any) {
      console.error("Error fetching device series:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceModels = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("device_models")
        .select("*, deviceSeries:device_series_id(id, name, device_type_id)")
        .order("name");

      if (deviceModelSearchQuery) {
        query = query.ilike("name", `%${deviceModelSearchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDeviceModels(data || []);
    } catch (err: any) {
      console.error("Error fetching device models:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (activeTab === "brands") {
      fetchBrands();
    } else if (activeTab === "types") {
      fetchDeviceTypes();
    } else if (activeTab === "series") {
      fetchDeviceSeries();
    } else if (activeTab === "models") {
      fetchDeviceModels();
    }
  }, [activeTab]);

  // Search handling
  const handleBrandSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBrands();
  };

  const handleDeviceTypeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeviceTypes();
  };

  const handleDeviceSeriesSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeviceSeries();
  };

  const handleDeviceModelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeviceModels();
  };

  // Brand dialog handlers
  const openAddBrandDialog = () => {
    setBrandFormData({
      name: "",
      image_url: "",
    });
    setIsAddBrandDialogOpen(true);
  };

  const openEditBrandDialog = (brand: DeviceBrand) => {
    setCurrentBrand(brand);
    setBrandFormData({
      name: brand.name,
      image_url: brand.image_url || "",
    });
    setIsEditBrandDialogOpen(true);
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("device_brands")
        .insert({
          name: brandFormData.name,
          image_url: brandFormData.image_url || null,
          user_uid: userData.user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      setBrands([...brands, data]);
      setIsAddBrandDialogOpen(false);
    } catch (err: any) {
      console.error("Error adding brand:", err);
      alert(`Failed to add brand: ${err.message}`);
    }
  };

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand) return;

    try {
      const { error } = await supabase
        .from("device_brands")
        .update({
          name: brandFormData.name,
          image_url: brandFormData.image_url || null,
        })
        .eq("id", currentBrand.id);

      if (error) throw error;

      fetchBrands();
      setIsEditBrandDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating brand:", err);
      alert(`Failed to update brand: ${err.message}`);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this brand? This will also delete all related device types, series, and models."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("device_brands")
        .delete()
        .eq("id", brandId);

      if (error) throw error;

      fetchBrands();
    } catch (err: any) {
      console.error("Error deleting brand:", err);
      alert(`Failed to delete brand: ${err.message}`);
    }
  };

  // Device Type dialog handlers
  const openAddDeviceTypeDialog = () => {
    setDeviceTypeFormData({
      name: "",
      brand_id: "",
      image_url: "",
    });
    setIsAddDeviceTypeDialogOpen(true);
  };

  const openEditDeviceTypeDialog = (deviceType: DeviceType) => {
    setCurrentDeviceType(deviceType);
    setDeviceTypeFormData({
      name: deviceType.name,
      brand_id: deviceType.brand_id.toString(),
      image_url: deviceType.image_url || "",
    });
    setIsEditDeviceTypeDialogOpen(true);
  };

  const handleAddDeviceType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("device_types")
        .insert({
          name: deviceTypeFormData.name,
          brand_id: parseInt(deviceTypeFormData.brand_id),
          image_url: deviceTypeFormData.image_url || null,
          user_uid: userData.user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      setDeviceTypes([...deviceTypes, data]);
      setIsAddDeviceTypeDialogOpen(false);
    } catch (err: any) {
      console.error("Error adding device type:", err);
      alert(`Failed to add device type: ${err.message}`);
    }
  };

  const handleEditDeviceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeviceType) return;

    try {
      const { error } = await supabase
        .from("device_types")
        .update({
          name: deviceTypeFormData.name,
          brand_id: parseInt(deviceTypeFormData.brand_id),
          image_url: deviceTypeFormData.image_url || null,
        })
        .eq("id", currentDeviceType.id);

      if (error) throw error;

      fetchDeviceTypes();
      setIsEditDeviceTypeDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating device type:", err);
      alert(`Failed to update device type: ${err.message}`);
    }
  };

  const handleDeleteDeviceType = async (deviceTypeId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this device type? This will also delete all related series and models."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("device_types")
        .delete()
        .eq("id", deviceTypeId);

      if (error) throw error;

      fetchDeviceTypes();
    } catch (err: any) {
      console.error("Error deleting device type:", err);
      alert(`Failed to delete device type: ${err.message}`);
    }
  };

  // Device Series dialog handlers
  const openAddDeviceSeriesDialog = () => {
    setDeviceSeriesFormData({
      name: "",
      device_type_id: "",
      image_url: "",
    });
    setIsAddDeviceSeriesDialogOpen(true);
  };

  const openEditDeviceSeriesDialog = (deviceSeries: DeviceSeries) => {
    setCurrentDeviceSeries(deviceSeries);
    setDeviceSeriesFormData({
      name: deviceSeries.name,
      device_type_id: deviceSeries.device_type_id.toString(),
      image_url: deviceSeries.image_url || "",
    });
    setIsEditDeviceSeriesDialogOpen(true);
  };

  const handleAddDeviceSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("device_series")
        .insert({
          name: deviceSeriesFormData.name,
          device_type_id: parseInt(deviceSeriesFormData.device_type_id),
          image_url: deviceSeriesFormData.image_url || null,
          user_uid: userData.user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      setDeviceSeries([...deviceSeries, data]);
      setIsAddDeviceSeriesDialogOpen(false);
    } catch (err: any) {
      console.error("Error adding device series:", err);
      alert(`Failed to add device series: ${err.message}`);
    }
  };

  const handleEditDeviceSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeviceSeries) return;

    try {
      const { error } = await supabase
        .from("device_series")
        .update({
          name: deviceSeriesFormData.name,
          device_type_id: parseInt(deviceSeriesFormData.device_type_id),
          image_url: deviceSeriesFormData.image_url || null,
        })
        .eq("id", currentDeviceSeries.id);

      if (error) throw error;

      fetchDeviceSeries();
      setIsEditDeviceSeriesDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating device series:", err);
      alert(`Failed to update device series: ${err.message}`);
    }
  };

  const handleDeleteDeviceSeries = async (deviceSeriesId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this device series? This will also delete all related models."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("device_series")
        .delete()
        .eq("id", deviceSeriesId);

      if (error) throw error;

      fetchDeviceSeries();
    } catch (err: any) {
      console.error("Error deleting device series:", err);
      alert(`Failed to delete device series: ${err.message}`);
    }
  };

  // Device Model dialog handlers
  const openAddDeviceModelDialog = () => {
    setDeviceModelFormData({
      name: "",
      device_series_id: "",
      image_url: "",
    });
    setIsAddDeviceModelDialogOpen(true);
  };

  const openEditDeviceModelDialog = (deviceModel: DeviceModel) => {
    setCurrentDeviceModel(deviceModel);
    setDeviceModelFormData({
      name: deviceModel.name,
      device_series_id: deviceModel.device_series_id.toString(),
      image_url: deviceModel.image_url || "",
    });
    setIsEditDeviceModelDialogOpen(true);
  };

  const handleAddDeviceModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("device_models")
        .insert({
          name: deviceModelFormData.name,
          device_series_id: parseInt(deviceModelFormData.device_series_id),
          image_url: deviceModelFormData.image_url || null,
          user_uid: userData.user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      setDeviceModels([...deviceModels, data]);
      setIsAddDeviceModelDialogOpen(false);
    } catch (err: any) {
      console.error("Error adding device model:", err);
      alert(`Failed to add device model: ${err.message}`);
    }
  };

  const handleEditDeviceModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeviceModel) return;

    try {
      const { error } = await supabase
        .from("device_models")
        .update({
          name: deviceModelFormData.name,
          device_series_id: parseInt(deviceModelFormData.device_series_id),
          image_url: deviceModelFormData.image_url || null,
        })
        .eq("id", currentDeviceModel.id);

      if (error) throw error;

      fetchDeviceModels();
      setIsEditDeviceModelDialogOpen(false);
    } catch (err: any) {
      console.error("Error updating device model:", err);
      alert(`Failed to update device model: ${err.message}`);
    }
  };

  const handleDeleteDeviceModel = async (deviceModelId: number) => {
    if (!confirm("Are you sure you want to delete this device model?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("device_models")
        .delete()
        .eq("id", deviceModelId);

      if (error) throw error;

      fetchDeviceModels();
    } catch (err: any) {
      console.error("Error deleting device model:", err);
      alert(`Failed to delete device model: ${err.message}`);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Repair Devices Management</CardTitle>
          <CardDescription>
            Manage device brands, types, series, and models for repair services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue='brands'
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className='mb-4'>
              <TabsTrigger value='brands'>Brands</TabsTrigger>
              <TabsTrigger value='types'>Device Types</TabsTrigger>
              <TabsTrigger value='series'>Series</TabsTrigger>
              <TabsTrigger value='models'>Models</TabsTrigger>
            </TabsList>

            {/* Brands Tab */}
            <TabsContent value='brands'>
              <div className='flex justify-between items-center mb-4'>
                <form onSubmit={handleBrandSearch} className='flex space-x-2'>
                  <div className='relative'>
                    <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder='Search brands...'
                      className='pl-8 w-[200px] sm:w-[300px]'
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type='submit' variant='secondary' size='sm'>
                    Search
                  </Button>
                </form>
                <Button onClick={openAddBrandDialog}>
                  <PlusIcon className='h-4 w-4 mr-1' />
                  Add Brand
                </Button>
              </div>

              {isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2Icon className='animate-spin h-6 w-6' />
                </div>
              ) : error ? (
                <div className='bg-red-50 text-red-800 p-4 rounded-md'>
                  {error}
                </div>
              ) : brands.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No brands found. Add your first brand!
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Brand Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell>{brand.id}</TableCell>
                          <TableCell>{brand.name}</TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => openEditBrandDialog(brand)}
                              >
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() => handleDeleteBrand(brand.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Device Types Tab */}
            <TabsContent value='types'>
              <div className='flex justify-between items-center mb-4'>
                <form
                  onSubmit={handleDeviceTypeSearch}
                  className='flex space-x-2'
                >
                  <div className='relative'>
                    <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder='Search device types...'
                      className='pl-8 w-[200px] sm:w-[300px]'
                      value={deviceTypeSearchQuery}
                      onChange={(e) => setDeviceTypeSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type='submit' variant='secondary' size='sm'>
                    Search
                  </Button>
                </form>
                <Button onClick={openAddDeviceTypeDialog}>
                  <PlusIcon className='h-4 w-4 mr-1' />
                  Add Device Type
                </Button>
              </div>

              {isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2Icon className='animate-spin h-6 w-6' />
                </div>
              ) : error ? (
                <div className='bg-red-50 text-red-800 p-4 rounded-md'>
                  {error}
                </div>
              ) : deviceTypes.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No device types found
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Device Type</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deviceTypes.map((deviceType) => (
                        <TableRow key={deviceType.id}>
                          <TableCell>{deviceType.id}</TableCell>
                          <TableCell>{deviceType.name}</TableCell>
                          <TableCell>{deviceType.brand?.name || "-"}</TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  openEditDeviceTypeDialog(deviceType)
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() =>
                                  handleDeleteDeviceType(deviceType.id)
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Series Tab */}
            <TabsContent value='series'>
              <div className='flex justify-between items-center mb-4'>
                <form
                  onSubmit={handleDeviceSeriesSearch}
                  className='flex space-x-2'
                >
                  <div className='relative'>
                    <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder='Search device series...'
                      className='pl-8 w-[200px] sm:w-[300px]'
                      value={deviceSeriesSearchQuery}
                      onChange={(e) =>
                        setDeviceSeriesSearchQuery(e.target.value)
                      }
                    />
                  </div>
                  <Button type='submit' variant='secondary' size='sm'>
                    Search
                  </Button>
                </form>
                <Button onClick={openAddDeviceSeriesDialog}>
                  <PlusIcon className='h-4 w-4 mr-1' />
                  Add Series
                </Button>
              </div>

              {isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2Icon className='animate-spin h-6 w-6' />
                </div>
              ) : error ? (
                <div className='bg-red-50 text-red-800 p-4 rounded-md'>
                  {error}
                </div>
              ) : deviceSeries.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No device series found
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Series Name</TableHead>
                        <TableHead>Device Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deviceSeries.map((series) => (
                        <TableRow key={series.id}>
                          <TableCell>{series.id}</TableCell>
                          <TableCell>{series.name}</TableCell>
                          <TableCell>
                            {series.deviceType?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  openEditDeviceSeriesDialog(series)
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() =>
                                  handleDeleteDeviceSeries(series.id)
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value='models'>
              <div className='flex justify-between items-center mb-4'>
                <form
                  onSubmit={handleDeviceModelSearch}
                  className='flex space-x-2'
                >
                  <div className='relative'>
                    <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      type='search'
                      placeholder='Search device models...'
                      className='pl-8 w-[200px] sm:w-[300px]'
                      value={deviceModelSearchQuery}
                      onChange={(e) =>
                        setDeviceModelSearchQuery(e.target.value)
                      }
                    />
                  </div>
                  <Button type='submit' variant='secondary' size='sm'>
                    Search
                  </Button>
                </form>
                <Button onClick={openAddDeviceModelDialog}>
                  <PlusIcon className='h-4 w-4 mr-1' />
                  Add Model
                </Button>
              </div>

              {isLoading ? (
                <div className='flex justify-center py-8'>
                  <Loader2Icon className='animate-spin h-6 w-6' />
                </div>
              ) : error ? (
                <div className='bg-red-50 text-red-800 p-4 rounded-md'>
                  {error}
                </div>
              ) : deviceModels.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No device models found
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Model Name</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deviceModels.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>{model.id}</TableCell>
                          <TableCell>{model.name}</TableCell>
                          <TableCell>
                            {model.deviceSeries?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => openEditDeviceModelDialog(model)}
                              >
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() =>
                                  handleDeleteDeviceModel(model.id)
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Brand Dialog */}
      <Dialog
        open={isAddBrandDialogOpen}
        onOpenChange={setIsAddBrandDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Add a new device brand for repair services
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBrand}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Brand Name</Label>
                <Input
                  id='name'
                  placeholder='Enter brand name'
                  value={brandFormData.name}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={brandFormData.image_url}
                  onChange={(e) =>
                    setBrandFormData({
                      ...brandFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddBrandDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Add Brand</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog
        open={isEditBrandDialogOpen}
        onOpenChange={setIsEditBrandDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update the brand information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditBrand}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Brand Name</Label>
                <Input
                  id='name'
                  placeholder='Enter brand name'
                  value={brandFormData.name}
                  onChange={(e) =>
                    setBrandFormData({ ...brandFormData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={brandFormData.image_url}
                  onChange={(e) =>
                    setBrandFormData({
                      ...brandFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditBrandDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Device Type Dialog */}
      <Dialog
        open={isAddDeviceTypeDialogOpen}
        onOpenChange={setIsAddDeviceTypeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device Type</DialogTitle>
            <DialogDescription>
              Add a new device type for a brand
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeviceType}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='brand_id'>Brand</Label>
                <select
                  id='brand_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceTypeFormData.brand_id}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      brand_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Device Type Name</Label>
                <Input
                  id='name'
                  placeholder='Enter device type name'
                  value={deviceTypeFormData.name}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceTypeFormData.image_url}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddDeviceTypeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Add Device Type</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Type Dialog */}
      <Dialog
        open={isEditDeviceTypeDialogOpen}
        onOpenChange={setIsEditDeviceTypeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device Type</DialogTitle>
            <DialogDescription>
              Update the device type information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDeviceType}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='brand_id'>Brand</Label>
                <select
                  id='brand_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceTypeFormData.brand_id}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      brand_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Device Type Name</Label>
                <Input
                  id='name'
                  placeholder='Enter device type name'
                  value={deviceTypeFormData.name}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceTypeFormData.image_url}
                  onChange={(e) =>
                    setDeviceTypeFormData({
                      ...deviceTypeFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDeviceTypeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Device Series Dialog */}
      <Dialog
        open={isAddDeviceSeriesDialogOpen}
        onOpenChange={setIsAddDeviceSeriesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Series</DialogTitle>
            <DialogDescription>
              Add a new device series for a device type
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeviceSeries}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='device_type_id'>Device Type</Label>
                <select
                  id='device_type_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceSeriesFormData.device_type_id}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      device_type_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Device Type</option>
                  {deviceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.brand?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Series Name</Label>
                <Input
                  id='name'
                  placeholder='Enter series name'
                  value={deviceSeriesFormData.name}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceSeriesFormData.image_url}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddDeviceSeriesDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Add Series</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Series Dialog */}
      <Dialog
        open={isEditDeviceSeriesDialogOpen}
        onOpenChange={setIsEditDeviceSeriesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Series</DialogTitle>
            <DialogDescription>
              Update the device series information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDeviceSeries}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='device_type_id'>Device Type</Label>
                <select
                  id='device_type_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceSeriesFormData.device_type_id}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      device_type_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Device Type</option>
                  {deviceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.brand?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Series Name</Label>
                <Input
                  id='name'
                  placeholder='Enter series name'
                  value={deviceSeriesFormData.name}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceSeriesFormData.image_url}
                  onChange={(e) =>
                    setDeviceSeriesFormData({
                      ...deviceSeriesFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDeviceSeriesDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Device Model Dialog */}
      <Dialog
        open={isAddDeviceModelDialogOpen}
        onOpenChange={setIsAddDeviceModelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Model</DialogTitle>
            <DialogDescription>
              Add a new device model for a series
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeviceModel}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='device_series_id'>Device Series</Label>
                <select
                  id='device_series_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceModelFormData.device_series_id}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      device_series_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Series</option>
                  {deviceSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name} ({series.deviceType?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Model Name</Label>
                <Input
                  id='name'
                  placeholder='Enter model name'
                  value={deviceModelFormData.name}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceModelFormData.image_url}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddDeviceModelDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Add Model</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Model Dialog */}
      <Dialog
        open={isEditDeviceModelDialogOpen}
        onOpenChange={setIsEditDeviceModelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update the device model information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditDeviceModel}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='device_series_id'>Device Series</Label>
                <select
                  id='device_series_id'
                  className='w-full border border-input bg-background px-3 py-2 text-sm rounded-md'
                  value={deviceModelFormData.device_series_id}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      device_series_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value=''>Select Series</option>
                  {deviceSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name} ({series.deviceType?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Model Name</Label>
                <Input
                  id='name'
                  placeholder='Enter model name'
                  value={deviceModelFormData.name}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image_url'>Image URL (Optional)</Label>
                <Input
                  id='image_url'
                  placeholder='Enter image URL'
                  value={deviceModelFormData.image_url}
                  onChange={(e) =>
                    setDeviceModelFormData({
                      ...deviceModelFormData,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDeviceModelDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
