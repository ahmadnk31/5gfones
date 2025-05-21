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
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

// Types
type Product = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  in_stock: number;
  category_name: string;
  brand_name: string;
  compatible_with: string | null;
  variants_count: number;
  has_variations: boolean;
  created_at: string;
};

type CategoryOption = {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
};

type BrandOption = {
  id: number;
  name: string;
};

type DeviceModelOption = {
  id: number;
  display_name: string;
};

type ProductVariant = {
  id?: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: string;
  stock: string;
  discount_percentage?: string;
  discount_start_date?: string;
  discount_end_date?: string;
  images: string[]; // Array of image URLs for this variant
};

type ProductFormData = {
  name: string;
  description: string;
  category_id: string;
  brand_id: string;
  compatible_with_model_id: string;
  image_url: string;
  base_price: string;
  in_stock: string;
  discount_percentage?: string;
  discount_start_date?: string;
  discount_end_date?: string;
  has_variations: boolean;
  variants: ProductVariant[];
};

export default function AccessoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editActiveTab, setEditActiveTab] = useState("info");
  const [editProduct, setEditProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    compatible_with_model_id: "",
    image_url: "",
    base_price: "",
    in_stock: "0",
    discount_percentage: "",
    discount_start_date: "",
    discount_end_date: "",
    has_variations: false,
    variants: [],
  });
  // Options for dropdowns
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [deviceModelOptions, setDeviceModelOptions] = useState<
    DeviceModelOption[]
  >([]);
  
  // Form state
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    compatible_with_model_id: "",
    image_url: "",
    base_price: "",
    in_stock: "0",
    discount_percentage: "",
    discount_start_date: "",
    discount_end_date: "",
    has_variations: false,
    variants: [],
  });

  const supabase = createClient();

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch categories with hierarchical info
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select(
            `
            id, 
            name, 
            parent_id,
            parent:parent_id(name)
          `
          )
          .order("name");

        if (categoriesError) throw categoriesError;

        const formattedCategories =
          categoriesData?.map((category) => ({
            id: category.id,
            name: category.name,
            parent_id: category.parent_id,
            parent_name: category.parent?.name,
          })) || [];

        setCategoryOptions(formattedCategories);

        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from("brands")
          .select("*")
          .order("name");

        if (brandsError) throw brandsError;
        setBrandOptions(brandsData || []);

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
            display_name: model.name,
          })) || [];

        setDeviceModelOptions(formattedModels);

        // Fetch products that are not repair parts
        const { data: productsData, error: productsError } = await supabase
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
            categories:category_id(name),
            brands:brand_id(name),
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
          .eq("is_repair_part", false)
          .order("name");

        if (productsError) throw productsError;

        // Count variants for each product
        const variantCounts = new Map();
        const { data: variantsData, error: variantsError } = await supabase
          .from("product_variants")
          .select("product_id, id");

        if (variantsError) throw variantsError;

        variantsData?.forEach((variant) => {
          const count = variantCounts.get(variant.product_id) || 0;
          variantCounts.set(variant.product_id, count + 1);
        });

        // Format the products data
        const formattedProducts =
          productsData?.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            image_url: product.image_url,
            base_price: product.base_price,
            in_stock: product.in_stock,
            category_name: product.categories?.name || "Uncategorized",
            brand_name: product.brands?.name || "Unbranded",
            compatible_with: product.device_models
              ? `${
                  product.device_models.device_series?.device_types
                    ?.device_brands?.name || ""
                } ${
                  product.device_models.device_series?.device_types?.name || ""
                } ${product.device_models.device_series?.name || ""} ${
                  product.device_models.name || ""
                }`
              : null,
            variants_count: variantCounts.get(product.id) || 0,
            has_variations: variantCounts.get(product.id) > 0,
            created_at: product.created_at,
          })) || [];

        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products when search or filters change
  useEffect(() => {
    let results = products;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description &&
            product.description.toLowerCase().includes(query)) ||
          product.category_name.toLowerCase().includes(query) ||
          product.brand_name.toLowerCase().includes(query) ||
          (product.compatible_with &&
            product.compatible_with.toLowerCase().includes(query))
      );
    }

    // Apply brand filter
    if (brandFilter && brandFilter !== "all") {
      results = results.filter((product) => product.brand_name === brandFilter);
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== "all") {
      results = results.filter(
        (product) => product.category_name === categoryFilter
      );
    }

    setFilteredProducts(results);
  }, [searchQuery, brandFilter, categoryFilter, products]);

  // Fetch product details for editing
  const fetchProductDetails = async (productId: number) => {
    setSubmitting(true);
    try {
      // Fetch base product info
      const { data: product, error: productError } = await supabase
        .from("products")
        .select(
          `
          *,
          category:category_id(*),
          brand:brand_id(*),
          device_model:compatible_with_model_id(*)
        `
        )
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      // Fetch product variants
      const { data: variants, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId);

      if (variantsError) throw variantsError;

      // Fetch variant images for each variant
      const variantsWithImages = [...(variants || [])];
      
      if (variants && variants.length > 0) {
        for (const variant of variantsWithImages) {
          const { data: imagesData, error: imagesError } = await supabase
            .from("variant_images")
            .select("image_url")
            .eq("variant_id", variant.id);
            
          if (imagesError) throw imagesError;
          
          variant.images = imagesData?.map(img => img.image_url) || [];
        }
      }      // Format the data for the form
      setEditProduct({
        name: product.name,
        description: product.description || "",
        category_id: product.category_id?.toString() || "",
        brand_id: product.brand_id?.toString() || "",
        compatible_with_model_id:
          product.compatible_with_model_id?.toString() || "",
        image_url: product.image_url || "",
        base_price: product.base_price.toString() || "",
        in_stock: product.in_stock.toString() || "0",
        discount_percentage: product.discount_percentage ? product.discount_percentage.toString() : "",
        discount_start_date: product.discount_start_date || "",
        discount_end_date: product.discount_end_date || "",
        has_variations: variants && variants.length > 0,
        variants:
          variantsWithImages?.map((variant) => ({
            id: variant.id,          variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price_adjustment: variant.price_adjustment.toString(),
            stock: variant.stock.toString(),
            discount_percentage: variant.discount_percentage ? variant.discount_percentage.toString() : "",
            discount_start_date: variant.discount_start_date || "",
            discount_end_date: variant.discount_end_date || "",
            images: variant.images || [],
          })) || [],
      });

      setEditProductId(productId);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Failed to load product details");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle updating a product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductId) return;

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }      // Update product details
      const productData = {
        name: editProduct.name,
        description: editProduct.description || null,
        category_id: parseInt(editProduct.category_id),
        brand_id: parseInt(editProduct.brand_id),
        compatible_with_model_id: editProduct.compatible_with_model_id
          ? parseInt(editProduct.compatible_with_model_id)
          : null,
        image_url: editProduct.image_url || null,
        base_price: parseFloat(editProduct.base_price),
        in_stock: parseInt(editProduct.in_stock),
        has_variations: editProduct.has_variations,
        discount_percentage: editProduct.discount_percentage ? parseFloat(editProduct.discount_percentage) : null,
        discount_start_date: editProduct.discount_start_date || null,
        discount_end_date: editProduct.discount_end_date || null,
        user_uid: userId,
      };

      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editProductId);

      if (updateError) throw updateError;

      // Delete existing variants (cascade will also delete variant_images)
      const { error: deleteVariantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", editProductId);

      if (deleteVariantsError) throw deleteVariantsError;

      // Insert new variants if the product has variations
      if (editProduct.has_variations && editProduct.variants.length > 0) {
        for (const variant of editProduct.variants) {
          // Insert variant
          const { data: newVariant, error: insertVariantError } = await supabase
            .from("product_variants")            .insert({
              product_id: editProductId,
              variant_name: variant.variant_name,
              variant_value: variant.variant_value,
              price_adjustment: parseFloat(variant.price_adjustment),
              stock: parseInt(variant.stock),
              discount_percentage: variant.discount_percentage ? parseFloat(variant.discount_percentage) : null,
              discount_start_date: variant.discount_start_date || null,
              discount_end_date: variant.discount_end_date || null,
              user_uid: userId,
            })
            .select();

          if (insertVariantError) throw insertVariantError;

          // Insert images for this variant
          if (variant.images.length > 0 && newVariant && newVariant.length > 0) {
            const variantId = newVariant[0].id;
            const imagesToInsert = variant.images.map(imageUrl => ({
              variant_id: variantId,
              image_url: imageUrl,
              user_uid: userId,
            }));

            const { error: insertImagesError } = await supabase
              .from("variant_images")
              .insert(imagesToInsert);

            if (insertImagesError) throw insertImagesError;
          }
        }
      }

      setIsEditDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setSubmitting(true);
    try {
      // Delete the product (this will cascade delete variants due to DB constraints)
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit version of handleMainImageUpload
  const handleEditMainImageUpload = (url: string) => {
    setEditProduct({ ...editProduct, image_url: url });
  };

  // Edit version of functions for variant management
  const handleEditAddVariant = () => {
    setEditProduct({
      ...editProduct,
      variants: [
        ...editProduct.variants,
        {
          variant_name: "",
          variant_value: "",
          price_adjustment: "0",
          stock: "0",
          discount_percentage: "",
          discount_start_date: "",
          discount_end_date: "",
          images: [],
        },
      ],
    });
  };

  const handleEditRemoveVariant = (index: number) => {
    const updatedVariants = [...editProduct.variants];
    updatedVariants.splice(index, 1);
    setEditProduct({
      ...editProduct,
      variants: updatedVariants,
    });
  };

  const handleEditVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | string[]
  ) => {
    const updatedVariants = [...editProduct.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setEditProduct({
      ...editProduct,
      variants: updatedVariants,
    });
  };

  const handleEditVariantImage = (index: number, imageUrl: string) => {
    const updatedVariants = [...editProduct.variants];
    updatedVariants[index].images = [
      ...updatedVariants[index].images,
      imageUrl,
    ];
    setEditProduct({
      ...editProduct,
      variants: updatedVariants,
    });
  };

  const handleEditRemoveVariantImage = (
    variantIndex: number,
    imageIndex: number
  ) => {
    const updatedVariants = [...editProduct.variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setEditProduct({
      ...editProduct,
      variants: updatedVariants,
    });
  };

  const handleEditGenerateDescription = async () => {
    if (!editProduct.image_url) {
      alert("Please upload a product image first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: editProduct.image_url,
          prompt:
            "Describe this phone accessory product in detail for an e-commerce listing. Include key features, materials, benefits, and potential use cases. Keep it professional, engaging, and around 100 words. Focus on selling points.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      setEditProduct({ ...editProduct, description: data.description });
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Handle generating product description from image using API route
  const handleGenerateDescription = async () => {
    if (!newProduct.image_url) {
      alert("Please upload a product image first");
      return;
    }

    setGeneratingDescription(true);

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: newProduct.image_url,
          prompt:
            "Describe this phone accessory product in detail for an e-commerce listing. Include key features, materials, benefits, and potential use cases. Keep it professional, engaging, and around 100 words. Focus on selling points.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      const data = await response.json();
      setNewProduct({ ...newProduct, description: data.description });
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingDescription(false);
    }
  };
  // Handle adding a variant to the form
  const handleAddVariant = () => {
    setNewProduct({
      ...newProduct,
      variants: [
        ...newProduct.variants,
        {
          variant_name: "",
          variant_value: "",
          price_adjustment: "0",
          stock: "0",
          discount_percentage: "",
          discount_start_date: "",
          discount_end_date: "",
          images: [],
        },
      ],
    });
  };

  // Handle removing a variant from the form
  const handleRemoveVariant = (index: number) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants.splice(index, 1);
    setNewProduct({
      ...newProduct,
      variants: updatedVariants,
    });
  };

  // Handle updating a variant's fields
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | string[]
  ) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setNewProduct({
      ...newProduct,
      variants: updatedVariants,
    });
  };

  // Handle adding image to a variant
  const handleAddVariantImage = (index: number, imageUrl: string) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index].images = [
      ...updatedVariants[index].images,
      imageUrl,
    ];
    setNewProduct({
      ...newProduct,
      variants: updatedVariants,
    });
  };

  // Handle removing image from a variant
  const handleRemoveVariantImage = (
    variantIndex: number,
    imageIndex: number
  ) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setNewProduct({
      ...newProduct,
      variants: updatedVariants,
    });
  };

  // Handle main product image upload
  const handleMainImageUpload = (url: string) => {
    setNewProduct({ ...newProduct, image_url: url });
  };

  // Handle adding a new product with variants
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }      const productData = {
        name: newProduct.name,
        description: newProduct.description || null,
        category_id: parseInt(newProduct.category_id),
        brand_id: parseInt(newProduct.brand_id),
        compatible_with_model_id: newProduct.compatible_with_model_id
          ? parseInt(newProduct.compatible_with_model_id)
          : null,
        image_url: newProduct.image_url || null,
        base_price: parseFloat(newProduct.base_price),
        in_stock: parseInt(newProduct.in_stock),
        has_variations: newProduct.has_variations,
        is_repair_part: false,
        discount_percentage: newProduct.discount_percentage ? parseFloat(newProduct.discount_percentage) : null,
        discount_start_date: newProduct.discount_start_date || null,
        discount_end_date: newProduct.discount_end_date || null,
        user_uid: userId,
      };

      // Insert the product first
      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select();

      if (error) throw error;

      // If there are variants, insert them
      if (
        newProduct.has_variations &&
        newProduct.variants.length > 0 &&
        data &&
        data.length > 0
      ) {
        const productId = data[0].id;

        // Handle each variant individually to properly insert their images
        for (const variant of newProduct.variants) {
          // Insert the variant first
          const { data: variantData, error: variantError } = await supabase
            .from("product_variants")            .insert({
              product_id: productId,
              variant_name: variant.variant_name,
              variant_value: variant.variant_value,
              price_adjustment: parseFloat(variant.price_adjustment),
              stock: parseInt(variant.stock),
              discount_percentage: variant.discount_percentage ? parseFloat(variant.discount_percentage) : null,
              discount_start_date: variant.discount_start_date || null,
              discount_end_date: variant.discount_end_date || null,
              user_uid: userId,
            })
            .select();

          if (variantError) throw variantError;

          // Then insert each image for this variant into the variant_images table
          if (variant.images.length > 0 && variantData && variantData.length > 0) {
            const variantId = variantData[0].id;
            const imagesToInsert = variant.images.map(imageUrl => ({
              variant_id: variantId,
              image_url: imageUrl,
              user_uid: userId,
            }));

            const { error: imageError } = await supabase
              .from("variant_images")
              .insert(imagesToInsert);

            if (imageError) throw imageError;
          }
        }
      }

      setIsAddDialogOpen(false);      // Reset form
      setNewProduct({
        name: "",
        description: "",
        category_id: "",
        brand_id: "",
        compatible_with_model_id: "",
        image_url: "",
        base_price: "",
        in_stock: "0",
        discount_percentage: "",
        discount_start_date: "",
        discount_end_date: "",
        has_variations: false,
        variants: [],
      });

      // Refresh the products list
      window.location.reload();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
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

  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand_name))
  ).sort();
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category_name))
  ).sort();

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold tracking-tight'>
          Accessories Management
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Accessory
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Add New Accessory</DialogTitle>
              <DialogDescription>
                Add a new accessory product to your inventory.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='info'>Product Info</TabsTrigger>
                <TabsTrigger
                  value='variations'
                  disabled={!newProduct.has_variations}
                >
                  Variations
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleAddProduct}>
                <TabsContent value='info' className='space-y-4 mt-4'>
                  <div className='grid md:grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='name'>Product Name</Label>
                        <Input
                          id='name'
                          placeholder='e.g., Premium Tempered Glass Screen Protector'
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          required
                          className='mt-1'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='brand'>Brand</Label>
                          <Select
                            value={newProduct.brand_id}
                            onValueChange={(value) =>
                              setNewProduct({ ...newProduct, brand_id: value })
                            }
                            required
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue placeholder='Select a brand' />
                            </SelectTrigger>
                            <SelectContent>
                              {brandOptions.map((brand) => (
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
                        <div>
                          <Label htmlFor='category'>Category</Label>
                          <Select
                            value={newProduct.category_id}
                            onValueChange={(value) =>
                              setNewProduct({
                                ...newProduct,
                                category_id: value,
                              })
                            }
                            required
                          >
                            <SelectTrigger className='mt-1'>
                              <SelectValue placeholder='Select a category' />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.parent_name
                                    ? `${category.parent_name} > ${category.name}`
                                    : category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>                      <div className='grid grid-cols-2 gap-4'>
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
                              placeholder='19.99'
                              value={newProduct.base_price}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
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
                            placeholder='10'
                            value={newProduct.in_stock}
                            className='mt-1'
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                in_stock: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                        <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label htmlFor='discount-percentage'>Discount Percentage</Label>
                          <div className='relative mt-1'>
                            <span className='absolute inset-y-0 right-3 flex items-center text-muted-foreground'>
                              %
                            </span>
                            <Input
                              id='discount-percentage'
                              type='number'
                              step='0.1'
                              min='0'
                              max='100'
                              className='pr-8'
                              placeholder='10'
                              value={newProduct.discount_percentage || ''}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  discount_percentage: e.target.value,
                                })
                              }
                            />
                          </div>
                          <p className='text-xs text-muted-foreground mt-1'>
                            Leave empty for no discount
                          </p>
                        </div>
                        <div>
                          <Label htmlFor='discount-start-date'>Discount Start Date</Label>
                          <Input
                            id='discount-start-date'
                            type='date'
                            className='mt-1'
                            value={newProduct.discount_start_date || ''}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                discount_start_date: e.target.value,
                              })
                            }
                          />
                          <p className='text-xs text-muted-foreground mt-1'>
                            Optional, defaults to immediate start
                          </p>
                        </div>
                      </div>
                      
                      <div className='grid grid-cols-1 gap-4'>
                        <div>
                          <Label htmlFor='discount-end-date'>Discount End Date</Label>
                          <Input
                            id='discount-end-date'
                            type='date'
                            className='mt-1'
                            value={newProduct.discount_end_date || ''}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                discount_end_date: e.target.value,
                              })
                            }
                          />
                          <p className='text-xs text-muted-foreground mt-1'>
                            Optional, leave empty for no end date
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor='compatible'>
                          Compatible With (optional)
                        </Label>
                        <Select
                          value={newProduct.compatible_with_model_id}
                          onValueChange={(value) =>
                            setNewProduct({
                              ...newProduct,
                              compatible_with_model_id: value,
                            })
                          }
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Select compatible device' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='null'>
                              Not device specific
                            </SelectItem>
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
                        <Label htmlFor='has-variations'>Has Variations</Label>
                        <Switch
                          id='has-variations'
                          checked={newProduct.has_variations}
                          onCheckedChange={(checked) => {
                            setNewProduct({
                              ...newProduct,
                              has_variations: checked,
                            });
                            if (checked && newProduct.variants.length === 0) {
                              handleAddVariant();
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <div className='flex justify-between items-center'>
                          <Label>Primary Product Image</Label>
                        </div>
                        <div className='mt-1'>
                          <ImageUploader
                            onImageUploaded={handleMainImageUpload}
                            existingImageUrl={newProduct.image_url}
                            folder='accessories'
                          />
                        </div>
                      </div>

                      <div>
                        <div className='flex justify-between items-center'>
                          <Label htmlFor='description'>
                            Product Description
                          </Label>
                          {newProduct.image_url && (
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
                                  Generate with AI
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <Textarea
                          id='description'
                          rows={9}
                          placeholder='Detailed description of the product...'
                          value={newProduct.description}
                          className='mt-1'
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className='mt-8'>
                        <Button
                          type='button'
                          onClick={() => {
                            if (newProduct.has_variations) {
                              setActiveTab("variations");
                            } else {
                              handleAddProduct(new Event("submit") as any);
                            }
                          }}
                          disabled={submitting}
                          className='w-full'
                        >
                          {newProduct.has_variations ? (
                            "Continue to Variations"
                          ) : submitting ? (
                            <>
                              <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                              Adding...
                            </>
                          ) : (
                            "Add Product"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value='variations'
                  className='space-y-6 mt-4 max-h-[60vh] overflow-y-auto'
                >
                  <div className='space-y-4'>
                    {newProduct.variants.map((variant, variantIndex) => (
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
                                placeholder='e.g., Color, Size, Material'
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
                                placeholder='e.g., Red, Large, Leather'
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
                          </div>                          <div className='grid md:grid-cols-2 gap-4'>
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

                          <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                              <Label
                                htmlFor={`discount-percentage-${variantIndex}`}
                              >
                                Discount Percentage
                              </Label>
                              <div className='relative mt-1'>
                                <span className='absolute inset-y-0 right-3 flex items-center text-muted-foreground'>
                                  %
                                </span>
                                <Input
                                  id={`discount-percentage-${variantIndex}`}
                                  type='number'
                                  step='0.1'
                                  min='0'
                                  max='100'
                                  className='pr-8'
                                  placeholder='10'
                                  value={variant.discount_percentage || ''}
                                  onChange={(e) =>
                                    handleVariantChange(
                                      variantIndex,
                                      "discount_percentage",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Optional, leave empty for no discount
                              </p>
                            </div>
                            <div>
                              <Label
                                htmlFor={`discount-start-date-${variantIndex}`}
                              >
                                Discount Start Date
                              </Label>
                              <Input
                                id={`discount-start-date-${variantIndex}`}
                                type='date'
                                className='mt-1'
                                value={variant.discount_start_date || ''}
                                onChange={(e) =>
                                  handleVariantChange(
                                    variantIndex,
                                    "discount_start_date",
                                    e.target.value
                                  )
                                }
                              />
                              <p className='text-xs text-muted-foreground mt-1'>
                                Optional, defaults to immediate start
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor={`discount-end-date-${variantIndex}`}
                            >
                              Discount End Date
                            </Label>
                            <Input
                              id={`discount-end-date-${variantIndex}`}
                              type='date'
                              className='mt-1'
                              value={variant.discount_end_date || ''}
                              onChange={(e) =>
                                handleVariantChange(
                                  variantIndex,
                                  "discount_end_date",
                                  e.target.value
                                )
                              }
                            />
                            <p className='text-xs text-muted-foreground mt-1'>
                              Optional, leave empty for no end date
                            </p>
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
                              <div className='border-2 border-dashed rounded-md h-32 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors'>
                                <ImageUploader
                                  onImageUploaded={(url) =>
                                    handleAddVariantImage(variantIndex, url)
                                  }
                                  folder={`accessories/variants/${variantIndex}`}
                                  className='h-full w-full'
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

                  <div className='flex justify-between pt-4 sticky bottom-0 bg-background pb-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setActiveTab("info")}
                    >
                      Back to Product Info
                    </Button>
                    <Button type='submit' disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                          Adding...
                        </>
                      ) : (
                        "Add Product"
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
            placeholder='Search accessories...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className='grid grid-cols-2 gap-2 md:w-auto md:flex md:gap-4'>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All brands' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All brands</SelectItem>
              {uniqueBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Compatible With</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No accessories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='h-10 w-10 rounded-md bg-muted flex items-center justify-center'>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className='h-full w-full object-contain rounded-md'
                              />
                            ) : (
                              <TagIcon className='h-5 w-5 text-muted-foreground' />
                            )}
                          </div>
                          <div>
                            <div className='font-medium'>{product.name}</div>
                            
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.brand_name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>
                        {product.compatible_with ? (
                          <div className='flex items-center gap-1'>
                            <SmartphoneIcon className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm'>
                              {product.compatible_with}
                            </span>
                          </div>
                        ) : (
                          <span className='text-sm text-muted-foreground'>
                            Universal
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(product.base_price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.in_stock > 0 ? "default" : "destructive"
                          }
                        >
                          {product.in_stock > 0
                            ? product.in_stock
                            : "Out of stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {product.variants_count} variants
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => fetchProductDetails(product.id)}
                          >
                            <EditIcon className='h-4 w-4 mr-1' />
                            Edit
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive'
                            onClick={() => {
                              setProductToDelete(product);
                              setIsDeleteDialogOpen(true);
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
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Edit Accessory</DialogTitle>
            <DialogDescription>
              Update the details for this accessory.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={editActiveTab} onValueChange={setEditActiveTab}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='info'>Product Info</TabsTrigger>
              <TabsTrigger
                value='variations'
                disabled={!editProduct.has_variations}
              >
                Variations
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleUpdateProduct}>
              <TabsContent value='info' className='space-y-4 mt-4'>
                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='edit-name'>Product Name</Label>
                      <Input
                        id='edit-name'
                        placeholder='e.g., Premium Tempered Glass Screen Protector'
                        value={editProduct.name}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            name: e.target.value,
                          })
                        }
                        required
                        className='mt-1'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='edit-brand'>Brand</Label>
                        <Select
                          value={editProduct.brand_id}
                          onValueChange={(value) =>
                            setEditProduct({ ...editProduct, brand_id: value })
                          }
                          required
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Select a brand' />
                          </SelectTrigger>
                          <SelectContent>
                            {brandOptions.map((brand) => (
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
                      <div>
                        <Label htmlFor='edit-category'>Category</Label>
                        <Select
                          value={editProduct.category_id}
                          onValueChange={(value) =>
                            setEditProduct({
                              ...editProduct,
                              category_id: value,
                            })
                          }
                          required
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Select a category' />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.parent_name
                                  ? `${category.parent_name} > ${category.name}`
                                  : category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='edit-base-price'>Base Price</Label>
                        <div className='relative mt-1'>
                          <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                            $
                          </span>
                          <Input
                            id='edit-base-price'
                            type='number'
                            step='0.01'
                            min='0'
                            className='pl-7'
                            placeholder='19.99'
                            value={editProduct.base_price}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                base_price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor='edit-in-stock'>Stock</Label>
                        <Input
                          id='edit-in-stock'
                          type='number'
                          min='0'
                          placeholder='10'
                          value={editProduct.in_stock}
                          className='mt-1'
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              in_stock: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                      <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='edit-discount-percentage'>Discount Percentage</Label>
                        <div className='relative mt-1'>
                          <span className='absolute inset-y-0 right-3 flex items-center text-muted-foreground'>
                            %
                          </span>
                          <Input
                            id='edit-discount-percentage'
                            type='number'
                            step='0.1'
                            min='0'
                            max='100'
                            className='pr-8'
                            placeholder='10'
                            value={editProduct.discount_percentage || ''}
                            onChange={(e) =>
                              setEditProduct({
                                ...editProduct,
                                discount_percentage: e.target.value,
                              })
                            }
                          />
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          Leave empty for no discount
                        </p>
                      </div>
                      <div>
                        <Label htmlFor='edit-discount-start-date'>Discount Start Date</Label>
                        <Input
                          id='edit-discount-start-date'
                          type='date'
                          className='mt-1'
                          value={editProduct.discount_start_date || ''}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              discount_start_date: e.target.value,
                            })
                          }
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          Optional, defaults to immediate start
                        </p>
                      </div>
                    </div>
                    
                    <div className='grid grid-cols-1 gap-4'>
                      <div>
                        <Label htmlFor='edit-discount-end-date'>Discount End Date</Label>
                        <Input
                          id='edit-discount-end-date'
                          type='date'
                          className='mt-1'
                          value={editProduct.discount_end_date || ''}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              discount_end_date: e.target.value,
                            })
                          }
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          Optional, leave empty for no end date
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='edit-compatible'>
                        Compatible With (optional)
                      </Label>
                      <Select
                        value={editProduct.compatible_with_model_id}
                        onValueChange={(value) =>
                          setEditProduct({
                            ...editProduct,
                            compatible_with_model_id: value,
                          })
                        }
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue placeholder='Select compatible device' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='null'>
                            Not device specific
                          </SelectItem>
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
                      <Label htmlFor='edit-has-variations'>
                        Has Variations
                      </Label>
                      <Switch
                        id='edit-has-variations'
                        checked={editProduct.has_variations}
                        onCheckedChange={(checked) => {
                          setEditProduct({
                            ...editProduct,
                            has_variations: checked,
                          });
                          if (checked && editProduct.variants.length === 0) {
                            handleEditAddVariant();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div>
                      <div className='flex justify-between items-center'>
                        <Label>Primary Product Image</Label>
                      </div>
                      <div className='mt-1'>
                        <ImageUploader
                          onImageUploaded={handleEditMainImageUpload}
                          existingImageUrl={editProduct.image_url}
                          folder='accessories'
                        />
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between items-center'>
                        <Label htmlFor='edit-description'>
                          Product Description
                        </Label>
                        {editProduct.image_url && (
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={handleEditGenerateDescription}
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
                                Generate with AI
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id='edit-description'
                        rows={9}
                        placeholder='Detailed description of the product...'
                        value={editProduct.description}
                        className='mt-1'
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className='mt-8'>
                      <Button
                        type='button'
                        onClick={() => {
                          if (editProduct.has_variations) {
                            setEditActiveTab("variations");
                          } else {
                            handleUpdateProduct(new Event("submit") as any);
                          }
                        }}
                        disabled={submitting}
                        className='w-full'
                      >
                        {editProduct.has_variations ? (
                          "Continue to Variations"
                        ) : submitting ? (
                          <>
                            <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                            Updating...
                          </>
                        ) : (
                          "Update Product"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value='variations'
                className='space-y-6 mt-4 max-h-[60vh] overflow-y-auto'
              >
                <div className='space-y-4'>
                  {editProduct.variants.map((variant, variantIndex) => (
                    <Card key={variantIndex}>
                      <CardHeader className='pb-2'>
                        <div className='flex justify-between'>
                          <CardTitle className='text-lg'>
                            Variation {variantIndex + 1}
                          </CardTitle>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() =>
                              handleEditRemoveVariant(variantIndex)
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label
                              htmlFor={`edit-variant-name-${variantIndex}`}
                            >
                              Variation Type
                            </Label>
                            <Input
                              id={`edit-variant-name-${variantIndex}`}
                              placeholder='e.g., Color, Size, Material'
                              value={variant.variant_name}
                              className='mt-1'
                              onChange={(e) =>
                                handleEditVariantChange(
                                  variantIndex,
                                  "variant_name",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-variant-value-${variantIndex}`}
                            >
                              Variation Value
                            </Label>
                            <Input
                              id={`edit-variant-value-${variantIndex}`}
                              placeholder='e.g., Red, Large, Leather'
                              value={variant.variant_value}
                              className='mt-1'
                              onChange={(e) =>
                                handleEditVariantChange(
                                  variantIndex,
                                  "variant_value",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                        </div>                        <div className='grid md:grid-cols-2 gap-4'>
                          <div>
                            <Label
                              htmlFor={`edit-price-adjustment-${variantIndex}`}
                            >
                              Price Adjustment
                            </Label>
                            <div className='relative mt-1'>
                              <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                                $
                              </span>
                              <Input
                                id={`edit-price-adjustment-${variantIndex}`}
                                type='number'
                                step='0.01'
                                className='pl-7'
                                placeholder='0.00'
                                value={variant.price_adjustment}
                                onChange={(e) =>
                                  handleEditVariantChange(
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
                            <Label htmlFor={`edit-stock-${variantIndex}`}>
                              Stock
                            </Label>
                            <Input
                              id={`edit-stock-${variantIndex}`}
                              type='number'
                              min='0'
                              placeholder='5'
                              value={variant.stock}
                              className='mt-1'
                              onChange={(e) =>
                                handleEditVariantChange(
                                  variantIndex,
                                  "stock",
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
                              htmlFor={`edit-discount-percentage-${variantIndex}`}
                            >
                              Discount Percentage
                            </Label>
                            <div className='relative mt-1'>
                              <span className='absolute inset-y-0 right-3 flex items-center text-muted-foreground'>
                                %
                              </span>
                              <Input
                                id={`edit-discount-percentage-${variantIndex}`}
                                type='number'
                                step='0.1'
                                min='0'
                                max='100'
                                className='pr-8'
                                placeholder='10'
                                value={variant.discount_percentage || ''}
                                onChange={(e) =>
                                  handleEditVariantChange(
                                    variantIndex,
                                    "discount_percentage",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <p className='text-xs text-muted-foreground mt-1'>
                              Optional, leave empty for no discount
                            </p>
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-discount-start-date-${variantIndex}`}
                            >
                              Discount Start Date
                            </Label>
                            <Input
                              id={`edit-discount-start-date-${variantIndex}`}
                              type='date'
                              className='mt-1'
                              value={variant.discount_start_date || ''}
                              onChange={(e) =>
                                handleEditVariantChange(
                                  variantIndex,
                                  "discount_start_date",
                                  e.target.value
                                )
                              }
                            />
                            <p className='text-xs text-muted-foreground mt-1'>
                              Optional, defaults to immediate start
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor={`edit-discount-end-date-${variantIndex}`}
                          >
                            Discount End Date
                          </Label>
                          <Input
                            id={`edit-discount-end-date-${variantIndex}`}
                            type='date'
                            className='mt-1'
                            value={variant.discount_end_date || ''}
                            onChange={(e) =>
                              handleEditVariantChange(
                                variantIndex,
                                "discount_end_date",
                                e.target.value
                              )
                            }
                          />
                          <p className='text-xs text-muted-foreground mt-1'>
                            Optional, leave empty for no end date
                          </p>
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
                                    handleEditRemoveVariantImage(
                                      variantIndex,
                                      imageIndex
                                    )
                                  }
                                >
                                  <TrashIcon className='h-3 w-3' />
                                </Button>
                              </div>
                            ))}
                            <div className='border-2 border-dashed rounded-md h-32 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors'>
                              <ImageUploader
                                onImageUploaded={(url) =>
                                  handleEditVariantImage(variantIndex, url)
                                }
                                folder={`accessories/variants/edit-${editProductId}-${variantIndex}`}
                                className='h-full w-full'
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
                    onClick={handleEditAddVariant}
                    className='w-full'
                  >
                    <PlusIcon className='mr-2 h-4 w-4' />
                    Add Another Variation
                  </Button>
                </div>

                <div className='flex justify-between pt-4 sticky bottom-0 bg-background pb-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setEditActiveTab("info")}
                  >
                    Back to Product Info
                  </Button>
                  <Button type='submit' disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                        Updating...
                      </>
                    ) : (
                      "Update Product"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-destructive'>
              Delete Product
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className='border rounded-md p-4 my-4'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-md bg-muted flex items-center justify-center'>
                {productToDelete?.image_url ? (
                  <img
                    src={productToDelete.image_url}
                    alt={productToDelete.name}
                    className='h-full w-full object-contain rounded-md'
                  />
                ) : (
                  <TagIcon className='h-5 w-5 text-muted-foreground' />
                )}
              </div>
              <div>
                <div className='font-medium'>{productToDelete?.name}</div>
                <div className='text-sm text-muted-foreground'>
                  {productToDelete?.brand_name} •{" "}
                  {productToDelete?.category_name}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteProduct}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                "Delete Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
