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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  EditIcon,
  TrashIcon,
  TagIcon,
  SmartphoneIcon,
  ImageIcon,
  WandSparklesIcon,
  ImagePlusIcon,
  ScanIcon,
  WrenchIcon,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import Image from "next/image";

// Types
type Part = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  in_stock: number;
  category_name: string;
  brand_name: string;
  compatible_with: string | null;
  compatible_model_id: number | null;
  variants_count: number;
  has_variations: boolean;
  created_at: string;
};

type DeviceModelOption = {
  id: number;
  display_name: string;
};

type PartFormData = {
  name: string;
  description: string;
  compatible_with_model_id: string; // This is the only required field for device association
  image_url: string;
  base_price: string;
  in_stock: string;
  has_variations: boolean;
  variants: PartVariant[];
  // Removed category_id and brand_id as they're not required for parts
};

type PartVariant = {
  id?: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: string;
  stock: string;
  images: string[]; // Array of image URLs for this variant
};

export default function DevicePartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  // Options for dropdowns
  const [deviceModelOptions, setDeviceModelOptions] = useState<
    DeviceModelOption[]
  >([]);

  // Form state
  const [newPart, setNewPart] = useState<PartFormData>({
    name: "",
    description: "",
    compatible_with_model_id: "",
    image_url: "",
    base_price: "",
    in_stock: "0",
    has_variations: false,
    variants: [],
  });

  const supabase = createClient();
  const VariantMultipleImageUploader = ({
    variantIndex,
  }: {
    variantIndex: number;
  }) => {
    // Use a stable identifier for the variant's folder
    const variantId =
      newPart.variants[variantIndex]?.id || `new-${variantIndex}`;
    const folderPath = `repair-parts/variants/${variantId}`;

    return (
      <div className='w-full flex flex-col min-h-[400px] overflow-y-auto'>
        <ImageUploader
          onImageUploaded={(url) => handleAddVariantImage(variantIndex, url)}
          onMultipleImagesUploaded={(urls) =>
            handleAddMultipleVariantImages(variantIndex, urls)
          }
          existingImageUrls={newPart.variants[variantIndex]?.images || []}
          folder={folderPath}
          multiple={true}
          maxFiles={10}
          className='h-full w-full'
        />
      </div>
    );
  };

  // Handle opening the delete dialog
  const openDeleteDialog = (part: Part) => {
    setSelectedPart(part);
    setIsDeleteDialogOpen(true);
  };

  // Handle opening the edit dialog
  const openEditDialog = (part: Part) => {
    // Fetch full part data including variants
    fetchPartDetails(part.id);
  };

  // Fetch part details including variants for editing
  const fetchPartDetails = async (partId: number) => {
    setLoading(true);

    try {
      console.log(`Fetching part details for ID: ${partId}`);

      // Fetch the part details
      const { data: partData, error: partError } = await supabase
        .from("products")
        .select("*")
        .eq("id", partId)
        .single();

      if (partError) {
        console.error("Error fetching part data:", partError);
        throw partError;
      }

      if (!partData) {
        throw new Error("Part not found");
      }

      console.log("Part data fetched:", partData);

      // Fetch variants for this part
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", partId);

      if (variantsError) {
        console.error("Error fetching variants:", variantsError);
        throw variantsError;
      }

      console.log(
        `Found ${variantsData?.length || 0} variants for part ${partId}`
      );

      // For each variant, fetch its images
      const variants: PartVariant[] = [];

      if (variantsData && variantsData.length > 0) {
        for (const variant of variantsData) {
          console.log(`Fetching images for variant ID: ${variant.id}`);

          const { data: imagesData, error: imagesError } = await supabase
            .from("variant_images")
            .select("image_url")
            .eq("variant_id", variant.id);

          if (imagesError) {
            console.error("Error fetching variant images:", imagesError);
            throw imagesError;
          }

          console.log(
            `Found ${imagesData?.length || 0} images for variant ${variant.id}`
          );

          variants.push({
            id: variant.id,
            variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price_adjustment: variant.price_adjustment.toString(),
            stock: variant.stock.toString(),
            images: imagesData?.map((img) => img.image_url) || [],
          });
        }
      }

      // Set the form data for editing
      setNewPart({
        name: partData.name,
        description: partData.description || "",
        compatible_with_model_id: partData.compatible_with_model_id
          ? partData.compatible_with_model_id.toString()
          : "",
        image_url: partData.image_url || "",
        base_price: partData.base_price ? partData.base_price.toString() : "0",
        in_stock: partData.in_stock ? partData.in_stock.toString() : "0",
        has_variations: variants.length > 0,
        variants: variants.length > 0 ? variants : [],
      });

      // Get the compatible device model name for display
      let compatible_with = "";
      if (partData.compatible_with_model_id) {
        const { data: modelData } = await supabase
          .from("device_models")
          .select(
            `
            name,
            device_series:device_series_id(
              name,
              device_types:device_type_id(
                name,
                device_brands:brand_id(name)
              )
            )
          `
          )
          .eq("id", partData.compatible_with_model_id)
          .single();

        if (modelData) {
          compatible_with = `${
            modelData.device_series?.device_types?.device_brands?.name || ""
          } ${modelData.device_series?.device_types?.name || ""} ${
            modelData.device_series?.name || ""
          } ${modelData.name || ""}`.trim();
        }
      }

      setSelectedPart({
        ...partData,
        id: partId,
        category_name: "",
        brand_name: "",
        variants_count: variants.length,
        has_variations: variants.length > 0,
        compatible_with: compatible_with,
      });

      setIsEditDialogOpen(true);
      setActiveTab("info");

      console.log("Edit form data set successfully");
    } catch (error) {
      console.error("Error fetching part details:", error);
      alert("Error fetching part details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle updating an existing part
  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      if (!newPart.compatible_with_model_id) {
        alert("Device parts must be compatible with a specific device model");
        setSubmitting(false);
        return;
      }

      // Update the part basic information
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: newPart.name,
          description: newPart.description || null,
          compatible_with_model_id: parseInt(newPart.compatible_with_model_id),
          image_url: newPart.image_url || null,
          base_price: parseFloat(newPart.base_price || "0"),
          in_stock: parseInt(newPart.in_stock || "0"),
          has_variations: newPart.has_variations,
        })
        .eq("id", selectedPart.id);

      if (updateError) throw updateError;

      // Handle variants
      if (newPart.has_variations) {
        // Get existing variants for comparison
        const { data: existingVariants, error: existingVariantsError } =
          await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", selectedPart.id);

        if (existingVariantsError) throw existingVariantsError;

        const existingVariantIds = existingVariants?.map((v) => v.id) || [];
        const currentVariantIds = newPart.variants
          .filter((v) => v.id !== undefined)
          .map((v) => v.id);

        // Delete variants that are no longer in the form
        const variantsToDelete = existingVariantIds.filter(
          (id) => !currentVariantIds.includes(id)
        );

        if (variantsToDelete.length > 0) {
          const { error: deleteVariantsError } = await supabase
            .from("product_variants")
            .delete()
            .in("id", variantsToDelete);

          if (deleteVariantsError) throw deleteVariantsError;
        }

        // Update or insert variants
        for (const variant of newPart.variants) {
          if (variant.id) {
            // Update existing variant
            const { error: updateVariantError } = await supabase
              .from("product_variants")
              .update({
                variant_name: variant.variant_name,
                variant_value: variant.variant_value,
                price_adjustment: parseFloat(variant.price_adjustment || "0"),
                stock: parseInt(variant.stock || "0"),
              })
              .eq("id", variant.id);

            if (updateVariantError) throw updateVariantError;

            // Handle images - first get existing images
            const { data: existingImages, error: existingImagesError } =
              await supabase
                .from("variant_images")
                .select("id, image_url")
                .eq("variant_id", variant.id);

            if (existingImagesError) throw existingImagesError;

            const existingImageUrls =
              existingImages?.map((img) => img.image_url) || [];

            // Delete images that are no longer in the form
            const imagesToDelete = existingImageUrls.filter(
              (url) => !variant.images.includes(url)
            );

            if (imagesToDelete.length > 0) {
              const { error: deleteImagesError } = await supabase
                .from("variant_images")
                .delete()
                .eq("variant_id", variant.id)
                .in("image_url", imagesToDelete);

              if (deleteImagesError) throw deleteImagesError;
            }

            // Add new images
            const newImages = variant.images.filter(
              (url) => !existingImageUrls.includes(url)
            );

            if (newImages.length > 0) {
              const imagesToInsert = newImages.map((url) => ({
                variant_id: variant.id,
                image_url: url,
                user_uid: userId,
              }));

              const { error: insertImagesError } = await supabase
                .from("variant_images")
                .insert(imagesToInsert);

              if (insertImagesError) throw insertImagesError;
            }
          } else {
            // Insert new variant
            const { data: newVariant, error: insertVariantError } =
              await supabase
                .from("product_variants")
                .insert({
                  product_id: selectedPart.id,
                  variant_name: variant.variant_name,
                  variant_value: variant.variant_value,
                  price_adjustment: parseFloat(variant.price_adjustment || "0"),
                  stock: parseInt(variant.stock || "0"),
                  user_uid: userId,
                })
                .select();

            if (insertVariantError) throw insertVariantError;

            // Then insert each image for this variant
            if (
              variant.images.length > 0 &&
              newVariant &&
              newVariant.length > 0
            ) {
              const variantId = newVariant[0].id;
              console.log(
                `Saving ${variant.images.length} images for variant ID ${variantId}`
              );

              const imagesToInsert = variant.images.map((imageUrl) => ({
                variant_id: variantId,
                image_url: imageUrl,
                user_uid: userId,
              }));

              console.log("Images to insert:", JSON.stringify(imagesToInsert));

              const { data: insertedImages, error: insertImagesError } =
                await supabase
                  .from("variant_images")
                  .insert(imagesToInsert)
                  .select();

              if (insertImagesError) {
                console.error("Error inserting images:", insertImagesError);
                throw insertImagesError;
              } else {
                console.log("Successfully inserted images:", insertedImages);
              }
            }
          }
        }
      } else {
        // If no variations, delete all existing variants
        const { error: deleteVariantsError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", selectedPart.id);

        if (deleteVariantsError) throw deleteVariantsError;
      }

      // Reset form and close dialog
      setNewPart({
        name: "",
        description: "",
        compatible_with_model_id: "",
        image_url: "",
        base_price: "",
        in_stock: "0",
        has_variations: false,
        variants: [],
      });

      setIsEditDialogOpen(false);
      setSelectedPart(null);

      // Refresh the parts list
      window.location.reload();
    } catch (error) {
      console.error("Error updating part:", error);
      alert("Error updating part. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a part
  const handleDeletePart = async () => {
    if (!selectedPart) return;

    setSubmitting(true);

    try {
      // First check if the part has variants
      const { data: variants, error: variantsCheckError } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", selectedPart.id);

      if (variantsCheckError) throw variantsCheckError;

      // If there are variants, delete them first (cascade should handle variant images)
      if (variants && variants.length > 0) {
        const { error: deleteVariantsError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", selectedPart.id);

        if (deleteVariantsError) throw deleteVariantsError;
      }

      // Now delete the part itself
      const { error: deletePartError } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedPart.id);

      if (deletePartError) throw deletePartError;

      // Update the local state
      setParts(parts.filter((p) => p.id !== selectedPart.id));
      setFilteredParts(filteredParts.filter((p) => p.id !== selectedPart.id));

      setIsDeleteDialogOpen(false);
      setSelectedPart(null);
    } catch (error) {
      console.error("Error deleting part:", error);
      alert("Failed to delete part. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch device models with their full hierarchy for compatibility options
        const { data: modelsData, error: modelsError } = await supabase
          .from("device_models")
          .select(
            `
            id,
            name,
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

        // Format the device models for the dropdown with full display name
        const formattedModels =
          modelsData?.map((model) => ({
            id: model.id,
            display_name: `${
              model.device_series?.device_types?.device_brands?.name || ""
            } ${model.device_series?.device_types?.name || ""} ${
              model.device_series?.name || ""
            } ${model.name || ""}`.trim(),
          })) || [];

        setDeviceModelOptions(formattedModels);

        // Fetch products that are repair parts
        const { data: partsData, error: partsError } = await supabase
          .from("products")
          .select(
            `
            id, 
            name, 
            description, 
            image_url,
            base_price,
            in_stock,
            created_at,
            compatible_with_model_id,
            device_models:compatible_with_model_id(
              name,
              device_series:device_series_id(
                name,
                device_types:device_type_id(
                  name,
                  device_brands:brand_id(name)
                )
              )
            )
          `
          )
          .eq("is_repair_part", true) // Only get repair parts
          .order("name");

        if (partsError) throw partsError;

        // Count variants for each part
        const variantCounts = new Map();
        const { data: variantsData, error: variantsError } = await supabase
          .from("product_variants")
          .select("product_id, id");

        if (variantsError) throw variantsError;

        variantsData?.forEach((variant) => {
          const count = variantCounts.get(variant.product_id) || 0;
          variantCounts.set(variant.product_id, count + 1);
        });

        // Format the parts data
        const formattedParts =
          partsData?.map((part) => ({
            id: part.id,
            name: part.name,
            description: part.description,
            image_url: part.image_url,
            base_price: part.base_price,
            in_stock: part.in_stock,
            compatible_with: part.device_models
              ? `${
                  part.device_models.device_series?.device_types?.device_brands
                    ?.name || ""
                } ${
                  part.device_models.device_series?.device_types?.name || ""
                } ${part.device_models.device_series?.name || ""} ${
                  part.device_models.name || ""
                }`.trim()
              : null,
            compatible_model_id: part.compatible_with_model_id,
            variants_count: variantCounts.get(part.id) || 0,
            has_variations: variantCounts.get(part.id) > 0,
            created_at: part.created_at,
          })) || [];

        setParts(formattedParts);
        setFilteredParts(formattedParts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter parts when search or filters change
  useEffect(() => {
    let results = parts;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (part) =>
          part.name.toLowerCase().includes(query) ||
          (part.description &&
            part.description.toLowerCase().includes(query)) ||
          (part.compatible_with &&
            part.compatible_with.toLowerCase().includes(query))
      );
    }

    // Apply device filter
    if (deviceFilter && deviceFilter !== "all") {
      results = results.filter(
        (part) => part.compatible_model_id === parseInt(deviceFilter)
      );
    }

    setFilteredParts(results);
  }, [searchQuery, deviceFilter, parts]);

  // Handle generating part description from image
  const handleGenerateDescription = async () => {
    if (!newPart.image_url) {
      alert("Please upload a part image first");
      return;
    }

    setGeneratingDescription(true);

    try {
      // Call our secure AI API endpoint
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: newPart.image_url }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      const generatedDescription = data.description || "";
      setNewPart({ ...newPart, description: generatedDescription });
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Handle adding a variant to the form
  const handleAddVariant = () => {
    setNewPart({
      ...newPart,
      variants: [
        ...newPart.variants,
        {
          variant_name: "",
          variant_value: "",
          price_adjustment: "0",
          stock: "0",
          images: [],
        },
      ],
    });
  };

  // Handle removing a variant from the form
  const handleRemoveVariant = (index: number) => {
    const updatedVariants = [...newPart.variants];
    updatedVariants.splice(index, 1);
    setNewPart({
      ...newPart,
      variants: updatedVariants,
    });
  };

  // Handle updating a variant's fields
  const handleVariantChange = (
    index: number,
    field: keyof PartVariant,
    value: string | string[]
  ) => {
    const updatedVariants = [...newPart.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setNewPart({
      ...newPart,
      variants: updatedVariants,
    });
  };

  // Handle adding image to a variant
  const handleAddVariantImage = (variantIndex: number, imageUrl: string) => {
    console.log(`Adding image ${imageUrl} to variant ${variantIndex}`);
    const updatedVariants = [...newPart.variants];
    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      images: [...updatedVariants[variantIndex].images, imageUrl],
    };
    setNewPart({
      ...newPart,
      variants: updatedVariants,
    });
  };

  // Handle adding multiple images to a variant
  const handleAddMultipleVariantImages = (
    variantIndex: number,
    imageUrls: string[]
  ) => {
    console.log(`Adding ${imageUrls.length} images to variant ${variantIndex}`);
    const updatedVariants = [...newPart.variants];

    // Combine existing images with new ones
    const existingImages = updatedVariants[variantIndex].images || [];
    const combinedImages = [...existingImages, ...imageUrls];

    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      images: combinedImages,
    };

    console.log(
      `Variant ${variantIndex} now has ${combinedImages.length} images`
    );

    setNewPart({
      ...newPart,
      variants: updatedVariants,
    });
  };

  // Handle removing image from a variant
  const handleRemoveVariantImage = (
    variantIndex: number,
    imageIndex: number
  ) => {
    const updatedVariants = [...newPart.variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setNewPart({
      ...newPart,
      variants: updatedVariants,
    });
  };

  // Handle main part image upload
  const handleMainImageUpload = (url: string) => {
    setNewPart({ ...newPart, image_url: url });
  };

  // Handle adding a new part with variants
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      if (!newPart.compatible_with_model_id) {
        alert("Device parts must be compatible with a specific device model");
        setSubmitting(false);
        return;
      }

      const partData = {
        name: newPart.name,
        description: newPart.description || null,
        compatible_with_model_id: parseInt(newPart.compatible_with_model_id),
        image_url: newPart.image_url || null,
        base_price: parseFloat(newPart.base_price || "0"),
        in_stock: parseInt(newPart.in_stock || "0"),
        has_variations: newPart.has_variations,
        is_repair_part: true, // This is a repair part
        user_uid: userId,
      };

      // Insert the part first
      const { data, error } = await supabase
        .from("products")
        .insert([partData])
        .select();

      if (error) throw error;

      // Update the handleAddPart function's section that handles variants
      if (
        newPart.has_variations &&
        newPart.variants.length > 0 &&
        data &&
        data.length > 0
      ) {
        const partId = data[0].id;

        // Insert each variant and its images
        for (const variant of newPart.variants) {
          // Insert the variant first
          const { data: variantData, error: variantError } = await supabase
            .from("product_variants")
            .insert([
              {
                product_id: partId,
                variant_name: variant.variant_name,
                variant_value: variant.variant_value,
                price_adjustment: parseFloat(variant.price_adjustment || "0"),
                stock: parseInt(variant.stock || "0"),
                user_uid: userId,
              },
            ])
            .select();

          if (variantError) {
            console.error("Error inserting variant:", variantError);
            throw variantError;
          }

          // Then insert each image for this variant
          if (
            variant.images.length > 0 &&
            variantData &&
            variantData.length > 0
          ) {
            const variantId = variantData[0].id;
            console.log(
              `Saving ${variant.images.length} images for variant ID ${variantId}`
            );

            const imagesToInsert = variant.images.map((imageUrl) => ({
              variant_id: variantId,
              image_url: imageUrl,
              user_uid: userId,
            }));

            console.log("Images to insert:", JSON.stringify(imagesToInsert));

            const { data: insertedImages, error: insertImagesError } =
              await supabase
                .from("variant_images")
                .insert(imagesToInsert)
                .select();

            if (insertImagesError) {
              console.error("Error inserting images:", insertImagesError);
              throw insertImagesError;
            } else {
              console.log("Successfully inserted images:", insertedImages);
            }
          }
        }
      }

      setIsAddDialogOpen(false);

      // Reset form
      setNewPart({
        name: "",
        description: "",
        compatible_with_model_id: "",
        image_url: "",
        base_price: "",
        in_stock: "0",
        has_variations: false,
        variants: [],
      });

      // Refresh the parts list
      window.location.reload();
    } catch (error) {
      console.error("Error adding repair part:", error);
      alert("Error adding repair part. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (loading) {
    return (
      <div className='flex h-[80vh] items-center justify-center'>
        <Loader2Icon className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  const uniqueDeviceModels = parts
    .filter((p) => p.compatible_model_id !== null)
    .map((p) => ({
      id: p.compatible_model_id!,
      name: p.compatible_with!,
    }))
    .filter(
      (value, index, self) => self.findIndex((m) => m.id === value.id) === index
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between overflow-y-auto'>
        <h1 className='text-2xl font-bold tracking-tight'>
          Repair Parts Management
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Repair Part
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Add New Repair Part</DialogTitle>
              <DialogDescription>
                Add a new device repair part to your inventory.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='info'>Part Info</TabsTrigger>
                <TabsTrigger
                  value='variations'
                  disabled={!newPart.has_variations}
                >
                  Variations
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleAddPart}>
                <TabsContent value='info' className='space-y-4 mt-4'>
                  <div className='grid md:grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='name'>Part Name</Label>
                        <Input
                          id='name'
                          placeholder='e.g., LCD Screen Assembly, Battery'
                          value={newPart.name}
                          onChange={(e) =>
                            setNewPart({
                              ...newPart,
                              name: e.target.value,
                            })
                          }
                          required
                          className='mt-1'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='base-price'>Base Price</Label>
                          <div className='relative mt-1'>
                            <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                              $
                            </span>
                            <Input
                              id='base-price'
                              type='number'
                              step='0.01'
                              min='0'
                              className='pl-7'
                              placeholder='29.99'
                              value={newPart.base_price}
                              onChange={(e) =>
                                setNewPart({
                                  ...newPart,
                                  base_price: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor='in-stock'>Initial Stock</Label>
                          <Input
                            id='in-stock'
                            type='number'
                            min='0'
                            placeholder='5'
                            value={newPart.in_stock}
                            className='mt-1'
                            onChange={(e) =>
                              setNewPart({
                                ...newPart,
                                in_stock: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor='compatible'
                          className='text-orange-500 font-semibold'
                        >
                          Compatible Device Model (Required)
                        </Label>
                        <Select
                          value={newPart.compatible_with_model_id}
                          onValueChange={(value) =>
                            setNewPart({
                              ...newPart,
                              compatible_with_model_id: value,
                            })
                          }
                          required
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Select compatible device' />
                          </SelectTrigger>
                          <SelectContent>
                            {deviceModelOptions.map((model) => (
                              <SelectItem
                                key={model.id}
                                value={model.id.toString()}
                              >
                                {model.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <Label htmlFor='has-variations'>
                          Part Quality Variations
                        </Label>
                        <Switch
                          id='has-variations'
                          checked={newPart.has_variations}
                          onCheckedChange={(checked) => {
                            setNewPart({
                              ...newPart,
                              has_variations: checked,
                            });
                            if (checked && newPart.variants.length === 0) {
                              handleAddVariant();
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <div className='flex justify-between items-center'>
                          <Label>Primary Part Image</Label>
                        </div>
                        <div className='mt-1'>
                          <ImageUploader
                            onImageUploaded={handleMainImageUpload}
                            existingImageUrl={newPart.image_url}
                            folder='repair-parts'
                          />
                        </div>
                      </div>

                      <div>
                        <div className='flex justify-between items-center'>
                          <Label htmlFor='description'>Part Description</Label>
                          {newPart.image_url && (
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={handleGenerateDescription}
                              disabled={generatingDescription}
                            >
                              {generatingDescription ? (
                                <>
                                  <Loader2Icon className='mr-2 h-3 w-3 animate-spin' />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <WandSparklesIcon className='mr-2 h-3 w-3' />
                                  Generate with API
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <Textarea
                          id='description'
                          rows={9}
                          placeholder='Detailed description of the repair part, including compatibility and quality...'
                          value={newPart.description}
                          className='mt-1'
                          onChange={(e) =>
                            setNewPart({
                              ...newPart,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className='mt-8'>
                        <Button
                          type='button'
                          onClick={() => {
                            if (newPart.has_variations) {
                              setActiveTab("variations");
                            } else {
                              handleAddPart(new Event("submit") as any);
                            }
                          }}
                          disabled={submitting}
                          className='w-full'
                        >
                          {newPart.has_variations ? (
                            "Continue to Variations"
                          ) : submitting ? (
                            <>
                              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                              Adding...
                            </>
                          ) : (
                            "Add Part"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='variations' className='space-y-6 mt-4 h-full'>
                  <div className='space-y-4'>
                    {newPart.variants.map((variant, variantIndex) => (
                      <Card key={variantIndex}>
                        <CardHeader className='pb-2'>
                          <div className='flex justify-between'>
                            <CardTitle className='text-lg'>
                              Variation {variantIndex + 1}
                            </CardTitle>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => handleRemoveVariant(variantIndex)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                              <Label htmlFor={`variant-name-${variantIndex}`}>
                                Variation Type
                              </Label>
                              <Input
                                id={`variant-name-${variantIndex}`}
                                placeholder='e.g., Quality, Grade, Type'
                                value={variant.variant_name}
                                className='mt-1'
                                onChange={(e) =>
                                  handleVariantChange(
                                    variantIndex,
                                    "variant_name",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor={`variant-value-${variantIndex}`}>
                                Variation Value
                              </Label>
                              <Input
                                id={`variant-value-${variantIndex}`}
                                placeholder='e.g., Original, OEM, Aftermarket'
                                value={variant.variant_value}
                                className='mt-1'
                                onChange={(e) =>
                                  handleVariantChange(
                                    variantIndex,
                                    "variant_value",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                              <Label
                                htmlFor={`price-adjustment-${variantIndex}`}
                              >
                                Price Adjustment
                              </Label>
                              <div className='relative mt-1'>
                                <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                                  $
                                </span>
                                <Input
                                  id={`price-adjustment-${variantIndex}`}
                                  type='number'
                                  step='0.01'
                                  className='pl-7'
                                  placeholder='0.00'
                                  value={variant.price_adjustment}
                                  onChange={(e) =>
                                    handleVariantChange(
                                      variantIndex,
                                      "price_adjustment",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`stock-${variantIndex}`}>
                                Stock
                              </Label>
                              <Input
                                id={`stock-${variantIndex}`}
                                type='number'
                                min='0'
                                placeholder='5'
                                value={variant.stock}
                                className='mt-1'
                                onChange={(e) =>
                                  handleVariantChange(
                                    variantIndex,
                                    "stock",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <div className='flex justify-between items-center'>
                              <Label>Variation Images</Label>
                              <Badge variant='outline' className='font-normal'>
                                {variant.images.length} images
                              </Badge>
                            </div>
                            <div className='border-2 my-4 border-dashed rounded-md h-32'>
                              <VariantMultipleImageUploader
                                variantIndex={variantIndex}
                              />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3'>
                              {variant.images.map((image, imageIndex) => (
                                <div
                                  key={imageIndex}
                                  className='relative rounded-md overflow-hidden border border-border h-32'
                                >
                                  <Image
                                  width={128}
                                    height={128}

                                    src={image}
                                    alt={`${variant.variant_name} ${
                                      variant.variant_value
                                    } image ${imageIndex + 1}`}
                                    className='w-full h-full object-contain bg-muted/50'
                                  />
                                  <Button
                                    type='button'
                                    size='icon'
                                    variant='destructive'
                                    className='absolute top-2 right-2 h-6 w-6 rounded-full'
                                    onClick={() =>
                                      handleRemoveVariantImage(
                                        variantIndex,
                                        imageIndex
                                      )
                                    }
                                  >
                                    <TrashIcon className='h-3 w-3' />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleAddVariant}
                      className='w-full'
                    >
                      <PlusIcon className='mr-2 h-4 w-4' />
                      Add Another Variation
                    </Button>
                  </div>

                  <div className='flex justify-between pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setActiveTab("info")}
                    >
                      Back to Part Info
                    </Button>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        "Add Part"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex flex-col md:flex-row md:items-center gap-4'>
        <div className='relative flex-1'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search repair parts...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className='grid grid-cols-3 gap-2 md:w-auto md:flex md:gap-4'>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All devices' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All devices</SelectItem>
              {uniqueDeviceModels.map((device) => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className='p-0 min-h-full overflow-y-auto'>
          <div className='overflow-x-auto overflow-y-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Compatible With</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Variations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No repair parts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='h-10 w-10 rounded-md bg-muted flex items-center justify-center'>
                            {part.image_url ? (
                              <Image
                              width={40}
                                height={40}
                                src={part.image_url}
                                alt={part.name}
                                className='h-full w-full object-contain rounded-md'
                              />
                            ) : (
                              <WrenchIcon className='h-5 w-5 text-muted-foreground' />
                            )}
                          </div>
                          <div>
                            <div className='font-medium'>{part.name}</div>
                            {part.description && (
                              <div className='text-xs text-muted-foreground line-clamp-1'>
                                {part.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {part.compatible_with ? (
                          <div className='flex items-center gap-1'>
                            <SmartphoneIcon className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm font-medium text-orange-600'>
                              {part.compatible_with}
                            </span>
                          </div>
                        ) : (
                          <span className='text-sm text-muted-foreground'>
                            Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(part.base_price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            part.in_stock > 0 ? "default" : "destructive"
                          }
                        >
                          {part.in_stock > 0 ? part.in_stock : "Out of stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {part.variants_count} variants
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openEditDialog(part)}
                          >
                            <EditIcon className='h-4 w-4 mr-1' />
                            Edit
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive'
                            onClick={() => openDeleteDialog(part)}
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit Repair Part</DialogTitle>
            <DialogDescription>
              Update the details of the repair part.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='info'>Part Info</TabsTrigger>
              <TabsTrigger
                value='variations'
                disabled={!newPart.has_variations}
              >
                Variations
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleUpdatePart}>
              <TabsContent value='info' className='space-y-4 mt-4'>
                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>Part Name</Label>
                      <Input
                        id='name'
                        placeholder='e.g., LCD Screen Assembly, Battery'
                        value={newPart.name}
                        onChange={(e) =>
                          setNewPart({
                            ...newPart,
                            name: e.target.value,
                          })
                        }
                        required
                        className='mt-1'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='base-price'>Base Price</Label>
                        <div className='relative mt-1'>
                          <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                            $
                          </span>
                          <Input
                            id='base-price'
                            type='number'
                            step='0.01'
                            min='0'
                            className='pl-7'
                            placeholder='29.99'
                            value={newPart.base_price}
                            onChange={(e) =>
                              setNewPart({
                                ...newPart,
                                base_price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor='in-stock'>Initial Stock</Label>
                        <Input
                          id='in-stock'
                          type='number'
                          min='0'
                          placeholder='5'
                          value={newPart.in_stock}
                          className='mt-1'
                          onChange={(e) =>
                            setNewPart({
                              ...newPart,
                              in_stock: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor='compatible'
                        className='text-orange-500 font-semibold'
                      >
                        Compatible Device Model (Required)
                      </Label>
                      <Select
                        value={newPart.compatible_with_model_id}
                        onValueChange={(value) =>
                          setNewPart({
                            ...newPart,
                            compatible_with_model_id: value,
                          })
                        }
                        required
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue placeholder='Select compatible device' />
                        </SelectTrigger>
                        <SelectContent>
                          {deviceModelOptions.map((model) => (
                            <SelectItem
                              key={model.id}
                              value={model.id.toString()}
                            >
                              {model.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <Label htmlFor='has-variations'>
                        Part Quality Variations
                      </Label>
                      <Switch
                        id='has-variations'
                        checked={newPart.has_variations}
                        onCheckedChange={(checked) => {
                          setNewPart({
                            ...newPart,
                            has_variations: checked,
                          });
                          if (checked && newPart.variants.length === 0) {
                            handleAddVariant();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div>
                      <div className='flex justify-between items-center'>
                        <Label>Primary Part Image</Label>
                      </div>
                      <div className='mt-1'>
                        <ImageUploader
                          onImageUploaded={handleMainImageUpload}
                          existingImageUrl={newPart.image_url}
                          folder='repair-parts'
                        />
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between items-center'>
                        <Label htmlFor='description'>Part Description</Label>
                        {newPart.image_url && (
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={handleGenerateDescription}
                            disabled={generatingDescription}
                          >
                            {generatingDescription ? (
                              <>
                                <Loader2Icon className='mr-2 h-3 w-3 animate-spin' />
                                Generating...
                              </>
                            ) : (
                              <>
                                <WandSparklesIcon className='mr-2 h-3 w-3' />
                                Generate with API
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id='description'
                        rows={9}
                        placeholder='Detailed description of the repair part, including compatibility and quality...'
                        value={newPart.description}
                        className='mt-1'
                        onChange={(e) =>
                          setNewPart({
                            ...newPart,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className='mt-8'>
                      <Button
                        type='button'
                        onClick={() => {
                          if (newPart.has_variations) {
                            setActiveTab("variations");
                          } else {
                            handleUpdatePart(new Event("submit") as any);
                          }
                        }}
                        disabled={submitting}
                        className='w-full'
                      >
                        {newPart.has_variations ? (
                          "Continue to Variations"
                        ) : submitting ? (
                          <>
                            <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                            Updating...
                          </>
                        ) : (
                          "Update Part"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='variations' className='space-y-6 mt-4'>
                <div className='space-y-4'>
                  {newPart.variants.map((variant, variantIndex) => (
                    <Card key={variantIndex}>
                      <CardHeader className='pb-2'>
                        <div className='flex justify-between'>
                          <CardTitle className='text-lg'>
                            Variation {variantIndex + 1}
                          </CardTitle>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleRemoveVariant(variantIndex)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor={`variant-name-${variantIndex}`}>
                              Variation Type
                            </Label>
                            <Input
                              id={`variant-name-${variantIndex}`}
                              placeholder='e.g., Quality, Grade, Type'
                              value={variant.variant_name}
                              className='mt-1'
                              onChange={(e) =>
                                handleVariantChange(
                                  variantIndex,
                                  "variant_name",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`variant-value-${variantIndex}`}>
                              Variation Value
                            </Label>
                            <Input
                              id={`variant-value-${variantIndex}`}
                              placeholder='e.g., Original, OEM, Aftermarket'
                              value={variant.variant_value}
                              className='mt-1'
                              onChange={(e) =>
                                handleVariantChange(
                                  variantIndex,
                                  "variant_value",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor={`price-adjustment-${variantIndex}`}>
                              Price Adjustment
                            </Label>
                            <div className='relative mt-1'>
                              <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                                $
                              </span>
                              <Input
                                id={`price-adjustment-${variantIndex}`}
                                type='number'
                                step='0.01'
                                className='pl-7'
                                placeholder='0.00'
                                value={variant.price_adjustment}
                                onChange={(e) =>
                                  handleVariantChange(
                                    variantIndex,
                                    "price_adjustment",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`stock-${variantIndex}`}>
                              Stock
                            </Label>
                            <Input
                              id={`stock-${variantIndex}`}
                              type='number'
                              min='0'
                              placeholder='5'
                              value={variant.stock}
                              className='mt-1'
                              onChange={(e) =>
                                handleVariantChange(
                                  variantIndex,
                                  "stock",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className='flex justify-between items-center'>
                            <Label>Variation Images</Label>
                            <Badge variant='outline' className='font-normal'>
                              {variant.images.length} images
                            </Badge>
                          </div>
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3'>
                            {variant.images.map((image, imageIndex) => (
                              <div
                                key={imageIndex}
                                className='relative rounded-md overflow-hidden border border-border h-32'
                              >
                                <img
                                  src={image}
                                  alt={`${variant.variant_name} ${
                                    variant.variant_value
                                  } image ${imageIndex + 1}`}
                                  className='w-full h-full object-contain bg-muted/50'
                                />
                                <Button
                                  type='button'
                                  size='icon'
                                  variant='destructive'
                                  className='absolute top-2 right-2 h-6 w-6 rounded-full'
                                  onClick={() =>
                                    handleRemoveVariantImage(
                                      variantIndex,
                                      imageIndex
                                    )
                                  }
                                >
                                  <TrashIcon className='h-3 w-3' />
                                </Button>
                              </div>
                            ))}
                            <div className='border-2 border-dashed rounded-md h-32'>
                              <VariantMultipleImageUploader
                                variantIndex={variantIndex}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleAddVariant}
                    className='w-full'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add Another Variation
                  </Button>
                </div>

                <div className='flex justify-between pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setActiveTab("info")}
                  >
                    Back to Part Info
                  </Button>
                  <Button type='submit' disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                        Updating...
                      </>
                    ) : (
                      "Update Part"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Repair Part</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this repair part? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeletePart}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
