"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  SmartphoneIcon,
  LucideMonitorSmartphone,
  SettingsIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

// Types for our device entities
type DeviceBrand = {
  id: number;
  name: string;
  image_url: string | null;
};

type DeviceType = {
  id: number;
  brand_id: number;
  name: string;
  image_url: string | null;
  brand_name?: string;
};

type DeviceSeries = {
  id: number;
  device_type_id: number;
  name: string;
  image_url: string | null;
  type_name?: string;
  brand_name?: string;
};

type DeviceModel = {
  id: number;
  device_series_id: number;
  name: string;
  image_url: string | null;
  series_name?: string;
  type_name?: string;
  brand_name?: string;
};

export default function DevicesPage() {
  // State for each level of the device hierarchy
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [series, setSeries] = useState<DeviceSeries[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);

  // Edit states
  const [editingBrand, setEditingBrand] = useState<DeviceBrand | null>(null);
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [editingSeries, setEditingSeries] = useState<DeviceSeries | null>(null);
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
  const [deleteBrandId, setDeleteBrandId] = useState<number | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);
  const [deleteSeriesId, setDeleteSeriesId] = useState<number | null>(null);
  const [deleteModelId, setDeleteModelId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [newBrand, setNewBrand] = useState({ name: "", image_url: "" });
  const [newType, setNewType] = useState({
    brand_id: "",
    name: "",
    image_url: "",
  });
  const [newSeries, setNewSeries] = useState({
    device_type_id: "",
    name: "",
    image_url: "",
  });
  const [newModel, setNewModel] = useState({
    device_series_id: "",
    name: "",
    image_url: "",
  });

  // Search states
  const [brandSearch, setBrandSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  // Filtered states
  const [filteredBrands, setFilteredBrands] = useState<DeviceBrand[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<DeviceType[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<DeviceSeries[]>([]);
  const [filteredModels, setFilteredModels] = useState<DeviceModel[]>([]);

  const supabase = createClient();

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch device brands
        const { data: brandsData, error: brandsError } = await supabase
          .from("device_brands")
          .select("*")
          .order("name");

        if (brandsError) throw brandsError;
        setBrands(brandsData || []);
        setFilteredBrands(brandsData || []);

        // Fetch device types with brand info
        const { data: typesData, error: typesError } = await supabase
          .from("device_types")
          .select(
            `
            *,
            device_brands:brand_id(name)
          `
          )
          .order("name");

        if (typesError) throw typesError;

        const formattedTypes =
          typesData?.map((type) => ({
            ...type,
            brand_name: type.device_brands?.name,
          })) || [];

        setTypes(formattedTypes);
        setFilteredTypes(formattedTypes);

        // Fetch device series with type and brand info
        const { data: seriesData, error: seriesError } = await supabase
          .from("device_series")
          .select(
            `
            *,
            device_types:device_type_id(
              name,
              device_brands:brand_id(name)
            )
          `
          )
          .order("name");

        if (seriesError) throw seriesError;

        const formattedSeries =
          seriesData?.map((series) => ({
            ...series,
            type_name: series.device_types?.name,
            brand_name: series.device_types?.device_brands?.name,
          })) || [];

        setSeries(formattedSeries);
        setFilteredSeries(formattedSeries);

        // Fetch device models with series, type and brand info
        const { data: modelsData, error: modelsError } = await supabase
          .from("device_models")
          .select(
            `
            *,
            device_series:device_series_id(
              name,
              device_types:device_type_id(
                name,
                device_brands:brand_id(name)
              )
            )
          `
          )
          .order("name");

        if (modelsError) throw modelsError;

        const formattedModels =
          modelsData?.map((model) => ({
            ...model,
            series_name: model.device_series?.name,
            type_name: model.device_series?.device_types?.name,
            brand_name: model.device_series?.device_types?.device_brands?.name,
          })) || [];

        setModels(formattedModels);
        setFilteredModels(formattedModels);
      } catch (error) {
        console.error("Error fetching device data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter brands when search changes
  useEffect(() => {
    if (!brandSearch) {
      setFilteredBrands(brands);
      return;
    }

    const query = brandSearch.toLowerCase();
    const filtered = brands.filter((brand) =>
      brand.name.toLowerCase().includes(query)
    );
    setFilteredBrands(filtered);
  }, [brandSearch, brands]);

  // Filter types when search changes
  useEffect(() => {
    if (!typeSearch) {
      setFilteredTypes(types);
      return;
    }

    const query = typeSearch.toLowerCase();
    const filtered = types.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        (type.brand_name && type.brand_name.toLowerCase().includes(query))
    );
    setFilteredTypes(filtered);
  }, [typeSearch, types]);

  // Filter series when search changes
  useEffect(() => {
    if (!seriesSearch) {
      setFilteredSeries(series);
      return;
    }

    const query = seriesSearch.toLowerCase();
    const filtered = series.filter(
      (series) =>
        series.name.toLowerCase().includes(query) ||
        (series.type_name && series.type_name.toLowerCase().includes(query)) ||
        (series.brand_name && series.brand_name.toLowerCase().includes(query))
    );
    setFilteredSeries(filtered);
  }, [seriesSearch, series]);

  // Filter models when search changes
  useEffect(() => {
    if (!modelSearch) {
      setFilteredModels(models);
      return;
    }

    const query = modelSearch.toLowerCase();
    const filtered = models.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        (model.series_name &&
          model.series_name.toLowerCase().includes(query)) ||
        (model.type_name && model.type_name.toLowerCase().includes(query)) ||
        (model.brand_name && model.brand_name.toLowerCase().includes(query))
    );
    setFilteredModels(filtered);
  }, [modelSearch, models]);

  // Brand form handling
  const handleOpenBrandDialog = (brand?: DeviceBrand) => {
    if (brand) {
      setEditingBrand(brand);
      setNewBrand({
        name: brand.name,
        image_url: brand.image_url || "",
      });
    } else {
      setEditingBrand(null);
      setNewBrand({ name: "", image_url: "" });
    }
    setBrandDialogOpen(true);
  };

  const handleBrandImageUpload = (url: string) => {
    setNewBrand({ ...newBrand, image_url: url });
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Updating brand with image URL:", newBrand.image_url);

      if (editingBrand) {
        // Update existing brand
        const { data, error } = await supabase
          .from("device_brands")
          .update({
            name: newBrand.name,
            image_url: newBrand.image_url || null,
          })
          .eq("id", editingBrand.id)
          .select();

        if (error) {
          console.error("Error updating brand:", error);
          throw error;
        }

        console.log("Server response after update:", data);

        // Create an updated brand object with image URL preserved from local state if needed
        if (data && data.length > 0) {
          // If the server response doesn't include the image_url but we have one in the local state, use the local state
          const updatedBrand = {
            ...data[0],
            image_url: data[0].image_url || newBrand.image_url || null,
          };
          console.log("Updated brand with preserved image URL:", updatedBrand);

          // Update the brand in the state
          setBrands(
            brands.map((b) => (b.id === editingBrand.id ? updatedBrand : b))
          );
        }
      } else {
        // Add new brand
        const { data, error } = await supabase
          .from("device_brands")
          .insert([
            {
              name: newBrand.name,
              image_url: newBrand.image_url || null,
              user_uid: userId,
            },
          ])
          .select();

        if (error) throw error;

        // Add the new brand to the state
        if (data && data.length > 0) {
          // Ensure image URL is preserved
          const newBrandWithImage = {
            ...data[0],
            image_url: data[0].image_url || newBrand.image_url || null,
          };
          setBrands([...brands, newBrandWithImage]);
        }
      }

      setBrandDialogOpen(false);
      setNewBrand({ name: "", image_url: "" });
      setEditingBrand(null);
    } catch (error) {
      console.error("Error saving brand:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrandClick = (brandId: number) => {
    setDeleteBrandId(brandId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBrand = async () => {
    if (!deleteBrandId) return;

    try {
      // Check if brand is used by any device types
      const { data: usedTypes, error: checkError } = await supabase
        .from("device_types")
        .select("id")
        .eq("brand_id", deleteBrandId);

      if (checkError) throw checkError;

      if (usedTypes && usedTypes.length > 0) {
        alert("Cannot delete this brand because it's used by device types");
        return;
      }

      // Delete the brand
      const { error } = await supabase
        .from("device_brands")
        .delete()
        .eq("id", deleteBrandId);

      if (error) throw error;

      // Remove from state
      setBrands(brands.filter((b) => b.id !== deleteBrandId));

      setDeleteDialogOpen(false);
      setDeleteBrandId(null);
    } catch (error) {
      console.error("Error deleting brand:", error);
    }
  };

  // Handle opening the type edit dialog
  const handleOpenTypeDialog = (deviceType?: DeviceType) => {
    if (deviceType) {
      setEditingType(deviceType);
      setNewType({
        brand_id: deviceType.brand_id.toString(),
        name: deviceType.name,
        image_url: deviceType.image_url || "",
      });
    } else {
      setEditingType(null);
      setNewType({ brand_id: "", name: "", image_url: "" });
    }
    setTypeDialogOpen(true);
  };

  // Handle opening the series edit dialog
  const handleOpenSeriesDialog = (deviceSeries?: DeviceSeries) => {
    if (deviceSeries) {
      setEditingSeries(deviceSeries);
      setNewSeries({
        device_type_id: deviceSeries.device_type_id.toString(),
        name: deviceSeries.name,
        image_url: deviceSeries.image_url || "",
      });
    } else {
      setEditingSeries(null);
      setNewSeries({ device_type_id: "", name: "", image_url: "" });
    }
    setSeriesDialogOpen(true);
  };

  // Handle opening the model edit dialog
  const handleOpenModelDialog = (deviceModel?: DeviceModel) => {
    if (deviceModel) {
      setEditingModel(deviceModel);
      setNewModel({
        device_series_id: deviceModel.device_series_id.toString(),
        name: deviceModel.name,
        image_url: deviceModel.image_url || "",
      });
    } else {
      setEditingModel(null);
      setNewModel({ device_series_id: "", name: "", image_url: "" });
    }
    setModelDialogOpen(true);
  };

  // Form submit handlers
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Updating type with image URL:", newType.image_url);

      if (editingType) {
        // Update existing device type
        const { data, error } = await supabase
          .from("device_types")
          .update({
            brand_id: parseInt(newType.brand_id),
            name: newType.name,
            image_url: newType.image_url || null,
          })
          .eq("id", editingType.id)
          .select();

        if (error) {
          console.error("Error updating device type:", error);
          throw error;
        }

        console.log("Server response after device type update:", data);

        // Update the type in the state
        if (data && data.length > 0) {
          // Need to get the updated type with brand info
          const { data: updatedType, error: refreshError } = await supabase
            .from("device_types")
            .select(
              `
              *,
              device_brands:brand_id(name)
            `
            )
            .eq("id", editingType.id)
            .single();

          if (refreshError) throw refreshError;

          // Preserve the image_url from local state if needed
          const formattedType = {
            ...updatedType,
            brand_name: updatedType.device_brands?.name,
            image_url: updatedType.image_url || newType.image_url || null,
          };

          console.log("Updated type with preserved image URL:", formattedType);

          setTypes(
            types.map((t) => (t.id === editingType.id ? formattedType : t))
          );
        }
      } else {
        // Add new device type
        const { data, error } = await supabase
          .from("device_types")
          .insert([
            {
              brand_id: parseInt(newType.brand_id),
              name: newType.name,
              image_url: newType.image_url || null,
              user_uid: userId,
            },
          ])
          .select();

        if (error) throw error;

        // Refresh the types list
        const { data: refreshedTypes, error: refreshError } = await supabase
          .from("device_types")
          .select(
            `
            *,
            device_brands:brand_id(name)
          `
          )
          .order("name");

        if (refreshError) throw refreshError;

        const formattedTypes =
          refreshedTypes?.map((type) => ({
            ...type,
            brand_name: type.device_brands?.name,
            // Ensure image URL is preserved for newly added types
            image_url:
              type.image_url ||
              (type.id === data[0].id ? newType.image_url : null),
          })) || [];

        setTypes(formattedTypes);
      }

      setTypeDialogOpen(false);
      setNewType({ brand_id: "", name: "", image_url: "" });
      setEditingType(null);
    } catch (error) {
      console.error("Error saving device type:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Updating series with image URL:", newSeries.image_url);

      if (editingSeries) {
        // Update existing series
        const { data, error } = await supabase
          .from("device_series")
          .update({
            device_type_id: parseInt(newSeries.device_type_id),
            name: newSeries.name,
            image_url: newSeries.image_url || null,
          })
          .eq("id", editingSeries.id)
          .select();

        if (error) {
          console.error("Error updating device series:", error);
          throw error;
        }

        console.log("Server response after series update:", data);

        // Need to get the updated series with all joined data
        const { data: updatedSeries, error: refreshError } = await supabase
          .from("device_series")
          .select(
            `
            *,
            device_types:device_type_id(
              name,
              device_brands:brand_id(name)
            )
          `
          )
          .eq("id", editingSeries.id)
          .single();

        if (refreshError) throw refreshError;

        // Preserve the image_url from local state if needed
        const formattedSeries = {
          ...updatedSeries,
          type_name: updatedSeries.device_types?.name,
          brand_name: updatedSeries.device_types?.device_brands?.name,
          image_url: updatedSeries.image_url || newSeries.image_url || null,
        };

        console.log(
          "Updated series with preserved image URL:",
          formattedSeries
        );

        // Update the series in state
        setSeries(
          series.map((s) => (s.id === editingSeries.id ? formattedSeries : s))
        );
      } else {
        // Add new series
        const { data, error } = await supabase
          .from("device_series")
          .insert([
            {
              device_type_id: parseInt(newSeries.device_type_id),
              name: newSeries.name,
              image_url: newSeries.image_url || null,
              user_uid: userId,
            },
          ])
          .select();

        if (error) throw error;

        // Refresh the series list
        const { data: refreshedSeries, error: refreshError } = await supabase
          .from("device_series")
          .select(
            `
            *,
            device_types:device_type_id(
              name,
              device_brands:brand_id(name)
            )
          `
          )
          .order("name");

        if (refreshError) throw refreshError;

        const formattedSeries =
          refreshedSeries?.map((series) => ({
            ...series,
            type_name: series.device_types?.name,
            brand_name: series.device_types?.device_brands?.name,
            // Ensure image URL is preserved for newly added series
            image_url:
              series.image_url ||
              (data[0] && series.id === data[0].id
                ? newSeries.image_url
                : null),
          })) || [];

        setSeries(formattedSeries);
      }

      setSeriesDialogOpen(false);
      setNewSeries({ device_type_id: "", name: "", image_url: "" });
      setEditingSeries(null);
    } catch (error) {
      console.error("Error saving device series:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      console.log("Updating model with image URL:", newModel.image_url);

      if (editingModel) {
        // Update existing model
        const { data, error } = await supabase
          .from("device_models")
          .update({
            device_series_id: parseInt(newModel.device_series_id),
            name: newModel.name,
            image_url: newModel.image_url || null,
          })
          .eq("id", editingModel.id)
          .select();

        if (error) {
          console.error("Error updating device model:", error);
          throw error;
        }

        console.log("Server response after model update:", data);

        // Need to get the updated model with all joined data
        const { data: updatedModel, error: refreshError } = await supabase
          .from("device_models")
          .select(
            `
            *,
            device_series:device_series_id(
              name,
              device_types:device_type_id(
                name,
                device_brands:brand_id(name)
              )
            )
          `
          )
          .eq("id", editingModel.id)
          .single();

        if (refreshError) throw refreshError;

        // Preserve the image_url from local state if needed
        const formattedModel = {
          ...updatedModel,
          series_name: updatedModel.device_series?.name,
          type_name: updatedModel.device_series?.device_types?.name,
          brand_name:
            updatedModel.device_series?.device_types?.device_brands?.name,
          image_url: updatedModel.image_url || newModel.image_url || null,
        };

        console.log("Updated model with preserved image URL:", formattedModel);

        // Update the model in state
        setModels(
          models.map((m) => (m.id === editingModel.id ? formattedModel : m))
        );
      } else {
        // Add new model
        const { data, error } = await supabase
          .from("device_models")
          .insert([
            {
              device_series_id: parseInt(newModel.device_series_id),
              name: newModel.name,
              image_url: newModel.image_url || null,
              user_uid: userId,
            },
          ])
          .select();

        if (error) throw error;

        // Refresh the models list
        const { data: refreshedModels, error: refreshError } = await supabase
          .from("device_models")
          .select(
            `
            *,
            device_series:device_series_id(
              name,
              device_types:device_type_id(
                name,
                device_brands:brand_id(name)
              )
            )
          `
          )
          .order("name");

        if (refreshError) throw refreshError;

        const formattedModels =
          refreshedModels?.map((model) => ({
            ...model,
            series_name: model.device_series?.name,
            type_name: model.device_series?.device_types?.name,
            brand_name: model.device_series?.device_types?.device_brands?.name,
            // Ensure image URL is preserved for newly added models
            image_url:
              model.image_url ||
              (data[0] && model.id === data[0].id ? newModel.image_url : null),
          })) || [];

        setModels(formattedModels);
      }

      setModelDialogOpen(false);
      setNewModel({ device_series_id: "", name: "", image_url: "" });
      setEditingModel(null);
    } catch (error) {
      console.error("Error saving device model:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-[80vh] items-center justify-center'>
        <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold tracking-tight'>Device Management</h1>
      </div>

      <Tabs defaultValue='brands' className='w-full'>
        <TabsList className='grid grid-cols-4 mb-4'>
          <TabsTrigger value='brands'>Brands</TabsTrigger>
          <TabsTrigger value='types'>Device Types</TabsTrigger>
          <TabsTrigger value='series'>Series</TabsTrigger>
          <TabsTrigger value='models'>Models</TabsTrigger>
        </TabsList>

        {/* Brands Tab */}
        <TabsContent value='brands'>
          <div className='flex items-center justify-between mb-4'>
            <div className='relative flex-1 max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search brands...'
                className='pl-10'
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenBrandDialog()}>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Brand
            </Button>
          </div>

          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-center py-8 text-muted-foreground'
                      >
                        No brands found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>{brand.id}</TableCell>
                        <TableCell className='font-medium'>
                          {brand.name}
                        </TableCell>
                        <TableCell>
                          {brand.image_url ? (
                            <div className='h-12 w-12 rounded-md bg-muted/50'>
                              <img
                                src={brand.image_url}
                                alt={brand.name}
                                className='h-full w-full object-contain rounded-md'
                              />
                            </div>
                          ) : (
                            <div className='h-12 w-12 rounded-md bg-muted/50 flex items-center justify-center'>
                              <TagIcon className='h-5 w-5 text-muted-foreground' />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleOpenBrandDialog(brand)}
                            >
                              <PencilIcon className='h-4 w-4 mr-1' />
                              Edit
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive'
                              onClick={() => handleDeleteBrandClick(brand.id)}
                            >
                              <TrashIcon className='h-4 w-4 mr-1' />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Types Tab */}
        <TabsContent value='types'>
          <div className='flex items-center justify-between mb-4'>
            <div className='relative flex-1 max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search device types...'
                className='pl-10'
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
              />
            </div>
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className='mr-2 h-4 w-4' />
                  Add Device Type
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-md'>
                <DialogHeader>
                  <DialogTitle>Add New Device Type</DialogTitle>
                  <DialogDescription>
                    Add a new device type like iPhone, Galaxy, etc.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddType}>
                  <div className='grid gap-4 py-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='brand-select'>Brand</Label>
                      <Select
                        value={newType.brand_id}
                        onValueChange={(value) =>
                          setNewType({ ...newType, brand_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select brand' />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem
                              key={brand.id}
                              value={brand.id.toString()}
                            >
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='type-name'>Type Name</Label>
                      <Input
                        id='type-name'
                        placeholder='e.g., iPhone, Galaxy'
                        value={newType.name}
                        onChange={(e) =>
                          setNewType({ ...newType, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='type-image'>Type Image</Label>
                      <ImageUploader
                        onImageUploaded={(url) =>
                          setNewType({ ...newType, image_url: url })
                        }
                        existingImageUrl={newType.image_url}
                        folder='types'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        "Add Device Type"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center py-8 text-muted-foreground'
                      >
                        No device types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>{type.id}</TableCell>
                        <TableCell className='font-medium'>
                          {type.name}
                        </TableCell>
                        <TableCell>{type.brand_name}</TableCell>
                        <TableCell>
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className='h-8 w-8 object-contain'
                            />
                          ) : (
                            <LucideMonitorSmartphone className='h-5 w-5 text-muted-foreground' />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleOpenTypeDialog(type)}
                            >
                              <PencilIcon className='h-4 w-4 mr-1' />
                              Edit
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive'
                              onClick={() => {
                                setDeleteTypeId(type.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className='h-4 w-4 mr-1' />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value='series'>
          <div className='flex items-center justify-between mb-4'>
            <div className='relative flex-1 max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search series...'
                className='pl-10'
                value={seriesSearch}
                onChange={(e) => setSeriesSearch(e.target.value)}
              />
            </div>
            <Dialog open={seriesDialogOpen} onOpenChange={setSeriesDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className='mr-2 h-4 w-4' />
                  Add Series
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-md'>
                <DialogHeader>
                  <DialogTitle>Add New Device Series</DialogTitle>
                  <DialogDescription>
                    Add a new device series like iPhone 14, Galaxy S23, etc.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSeries}>
                  <div className='grid gap-4 py-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='type-select'>Device Type</Label>
                      <Select
                        value={newSeries.device_type_id}
                        onValueChange={(value) =>
                          setNewSeries({ ...newSeries, device_type_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select device type' />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={type.id.toString()}
                            >
                              {type.brand_name} {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='series-name'>Series Name</Label>
                      <Input
                        id='series-name'
                        placeholder='e.g., iPhone 14, Galaxy S23'
                        value={newSeries.name}
                        onChange={(e) =>
                          setNewSeries({ ...newSeries, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='series-image'>Series Image</Label>
                      <ImageUploader
                        onImageUploaded={(url) =>
                          setNewSeries({ ...newSeries, image_url: url })
                        }
                        existingImageUrl={newSeries.image_url}
                        folder='series'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        "Add Series"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Series Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center py-8 text-muted-foreground'
                      >
                        No device series found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSeries.map((series) => (
                      <TableRow key={series.id}>
                        <TableCell>{series.id}</TableCell>
                        <TableCell className='font-medium'>
                          {series.name}
                        </TableCell>
                        <TableCell>{series.type_name}</TableCell>
                        <TableCell>{series.brand_name}</TableCell>
                        <TableCell>
                          {series.image_url ? (
                            <img
                              src={series.image_url}
                              alt={series.name}
                              className='h-8 w-8 object-contain'
                            />
                          ) : (
                            <SmartphoneIcon className='h-5 w-5 text-muted-foreground' />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleOpenSeriesDialog(series)}
                            >
                              <PencilIcon className='h-4 w-4 mr-1' />
                              Edit
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive'
                              onClick={() => {
                                setDeleteSeriesId(series.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className='h-4 w-4 mr-1' />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value='models'>
          <div className='flex items-center justify-between mb-4'>
            <div className='relative flex-1 max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search models...'
                className='pl-10'
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
            </div>
            <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className='mr-2 h-4 w-4' />
                  Add Model
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-md'>
                <DialogHeader>
                  <DialogTitle>Add New Device Model</DialogTitle>
                  <DialogDescription>
                    Add a new device model like iPhone 14 Pro Max, Galaxy S23
                    Ultra, etc.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddModel}>
                  <div className='grid gap-4 py-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='series-select'>Device Series</Label>
                      <Select
                        value={newModel.device_series_id}
                        onValueChange={(value) =>
                          setNewModel({ ...newModel, device_series_id: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select device series' />
                        </SelectTrigger>
                        <SelectContent>
                          {series.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.brand_name} {s.type_name} {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='model-name'>Model Name</Label>
                      <Input
                        id='model-name'
                        placeholder='e.g., Pro Max, Ultra'
                        value={newModel.name}
                        onChange={(e) =>
                          setNewModel({ ...newModel, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='model-image'>Model Image</Label>
                      <ImageUploader
                        onImageUploaded={(url) =>
                          setNewModel({ ...newModel, image_url: url })
                        }
                        existingImageUrl={newModel.image_url}
                        folder='models'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        "Add Model"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Series</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-center py-8 text-muted-foreground'
                      >
                        No device models found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>{model.id}</TableCell>
                        <TableCell className='font-medium'>
                          {model.name}
                        </TableCell>
                        <TableCell>{model.series_name}</TableCell>
                        <TableCell>{model.type_name}</TableCell>
                        <TableCell>{model.brand_name}</TableCell>
                        <TableCell>
                          {model.image_url ? (
                            <img
                              src={model.image_url}
                              alt={model.name}
                              className='h-8 w-8 object-contain'
                            />
                          ) : (
                            <SettingsIcon className='h-5 w-5 text-muted-foreground' />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleOpenModelDialog(model)}
                            >
                              <PencilIcon className='h-4 w-4 mr-1' />
                              Edit
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive'
                              onClick={() => {
                                setDeleteModelId(model.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <TrashIcon className='h-4 w-4 mr-1' />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Brand Dialog - Edit or Add */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Add New Device Brand"}
            </DialogTitle>
            <DialogDescription>
              {editingBrand
                ? "Update the brand details"
                : "Add a new device brand like Apple, Samsung, etc."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBrand}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='brand-name'>Brand Name</Label>
                <Input
                  id='brand-name'
                  placeholder='e.g., Apple, Samsung'
                  value={newBrand.name}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='brand-image'>Brand Image</Label>
                <ImageUploader
                  onImageUploaded={handleBrandImageUpload}
                  existingImageUrl={newBrand.image_url}
                  folder='brands'
                />
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                    {editingBrand ? "Saving..." : "Adding..."}
                  </>
                ) : editingBrand ? (
                  "Save Changes"
                ) : (
                  "Add Brand"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              brand and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              className='bg-destructive hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
