"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  PlusIcon,
  Pencil,
  Trash2,
  ImageIcon,
  SearchIcon,
  Loader2,
  TagIcon,
  BadgeCheck,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface DeviceModel {
  id: number;
  name: string;
}

interface RefurbishedProductSpec {
  id?: number;
  spec_name: string;
  spec_value: string;
}

interface RefurbishedProductImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
}

interface RefurbishedProductVariant {
  id?: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: string;
  stock: string;
  sku?: string;
  images: string[]; // Array of image URLs for this variant
}

interface RefurbishedProduct {
  id: number;
  name: string;
  description: string;
  condition: "excellent" | "good" | "fair";
  original_price: number;
  refurbished_price: number;
  discount_percentage: number;
  brand_id: number | null;
  category_id: number | null;
  compatible_with_model_id: number | null;
  warranty_months: number;
  in_stock: number;
  is_featured: boolean;
  refurbishment_date: string;
  created_at: string;
  has_variations: boolean;
  brand?: Brand;
  category?: Category;
  compatible_with_model?: DeviceModel;
  refurbished_product_images?: RefurbishedProductImage[];
  refurbished_product_specs?: RefurbishedProductSpec[];
  variants?: RefurbishedProductVariant[];
}

export default function RefurbishedProductsPage() {
  const [products, setProducts] = useState<RefurbishedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    RefurbishedProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCondition, setFilterCondition] = useState<string>("all");
  // Edit/Create state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] =
    useState<RefurbishedProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCondition, setProductCondition] = useState<
    "excellent" | "good" | "fair"
  >("excellent");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [refurbishedPrice, setRefurbishedPrice] = useState(0);
  const [productBrandId, setProductBrandId] = useState<number | null>(null);
  const [productCategoryId, setProductCategoryId] = useState<number | null>(
    null
  );
  const [productModelId, setProductModelId] = useState<number | null>(null);
  const [warrantyMonths, setWarrantyMonths] = useState(6);
  const [inStock, setInStock] = useState(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasVariations, setHasVariations] = useState(false);
  const [productVariants, setProductVariants] = useState<
    RefurbishedProductVariant[]
  >([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantValue, setNewVariantValue] = useState("");
  const [newVariantPriceAdjustment, setNewVariantPriceAdjustment] =
    useState("0");
  const [newVariantStock, setNewVariantStock] = useState("1");
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantImages, setNewVariantImages] = useState<string[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productSpecs, setProductSpecs] = useState<RefurbishedProductSpec[]>(
    []
  );
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<RefurbishedProduct | null>(null);

  const supabase = createClient();
  

  // Fetch products data and lookup tables
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch refurbished products with related data
      const { data: productsData, error: productsError } = await supabase
        .from("refurbished_products")
        .select(
          `
          *,
          brands (id, name),
          categories (id, name),
          compatible_with_model:device_models (id, name),
          refurbished_product_images (id, image_url, is_primary),
          refurbished_product_specs (id, spec_name, spec_value)
        `
        )
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch brands for dropdown
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");

      if (brandsError) throw brandsError;

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch device models for dropdown
      const { data: modelsData, error: modelsError } = await supabase
        .from("device_models")
        .select("id, name")
        .order("name");
      if (modelsError) throw modelsError;

      // Count variants for each product
      const variantCounts = new Map();
      const { data: variantsData, error: variantsError } = await supabase
        .from("refurbished_product_variants")
        .select("refurbished_product_id, id");

      if (variantsError) throw variantsError;

      variantsData?.forEach((variant) => {
        const count = variantCounts.get(variant.refurbished_product_id) || 0;
        variantCounts.set(variant.refurbished_product_id, count + 1);
      });

      // Add variant count to products
      const productsWithCounts =
        productsData?.map((product) => ({
          ...product,
          variants_count: variantCounts.get(product.id) || 0,
        })) || [];

      setProducts(productsWithCounts);
      setFilteredProducts(productsWithCounts);
      setBrands(brandsData || []);
      setCategories(categoriesData || []);
      setDeviceModels(modelsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products when search query or condition filter changes
  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCondition !== "all") {
      filtered = filtered.filter(
        (product) => product.condition === filterCondition
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, filterCondition, products]);

  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };
  const openEditDialog = async (product: RefurbishedProduct) => {
    setIsEditing(true);
    setCurrentProduct(product);
    setProductName(product.name || "");
    setProductDescription(product.description || "");
    setProductCondition(product.condition || "excellent");
    setOriginalPrice(product.original_price || 0);
    setRefurbishedPrice(product.refurbished_price || 0);
    setProductBrandId(product.brand_id);
    setProductCategoryId(product.category_id);
    setProductModelId(product.compatible_with_model_id);
    setWarrantyMonths(product.warranty_months || 6);
    setInStock(product.in_stock || 0);
    setIsFeatured(product.is_featured || false);
    setHasVariations(product.has_variations || false);

    setProductSpecs(product.refurbished_product_specs || []);

    const images =
      product.refurbished_product_images?.map((img) => img.image_url) || [];
    setProductImages(images);

    // Fetch product variants if it has variations
    if (product.has_variations) {
      try {
        // First get the variants
        const { data: variantsData, error: variantsError } = await supabase
          .from("refurbished_product_variants")
          .select("*")
          .eq("refurbished_product_id", product.id);

        if (variantsError) throw variantsError;

        // Now get images for each variant
        const variantsWithImages = [...(variantsData || [])];

        if (variantsData && variantsData.length > 0) {
          for (const variant of variantsWithImages) {
            const { data: imagesData, error: imagesError } = await supabase
              .from("refurbished_variant_images")
              .select("image_url")
              .eq("variant_id", variant.id);

            if (imagesError) throw imagesError;

            variant.images = imagesData?.map((img) => img.image_url) || [];
          }
        }

        // Update state with the variants that have images
        setProductVariants(
          variantsWithImages.map((variant) => ({
            id: variant.id,
            variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price_adjustment: variant.price_adjustment.toString(),
            stock: variant.stock.toString(),
            sku: variant.sku || undefined,
            images: variant.images || [],
          }))
        );
      } catch (error) {
        console.error("Error fetching variants:", error);
        toast.error("Failed to load variants");
      }
    }

    setActiveTab("details");
    setIsDialogOpen(true);
  };
  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setProductCondition("excellent");
    setOriginalPrice(0);
    setRefurbishedPrice(0);
    setProductBrandId(null);
    setProductCategoryId(null);
    setProductModelId(null);
    setWarrantyMonths(6);
    setInStock(1);
    setIsFeatured(false);
    setHasVariations(false);
    setProductVariants([]);
    setNewVariantName("");
    setNewVariantValue("");
    setNewVariantPriceAdjustment("0");
    setNewVariantStock("1");
    setNewVariantSku("");
    setNewVariantImages([]);
    setSelectedVariantIndex(null);
    setProductImages([]);
    setProductSpecs([]);
    setNewSpecName("");
    setNewSpecValue("");
    setActiveTab("details");
  };

  const handleMultipleImagesUploaded = (urls: string[]) => {
    setProductImages((prevImages) => [...prevImages, ...urls]);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setProductImages((prevImages) =>
      prevImages.filter((url) => url !== urlToRemove)
    );
  };

  const handleAddSpec = () => {
    if (!newSpecName.trim() || !newSpecValue.trim()) return;

    setProductSpecs((prev) => [
      ...prev,
      {
        spec_name: newSpecName.trim(),
        spec_value: newSpecValue.trim(),
      },
    ]);

    setNewSpecName("");
    setNewSpecValue("");
  };

  const handleRemoveSpec = (index: number) => {
    setProductSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle save refurbished product
  const handleSaveProduct = async () => {
    // Basic validation
    if (!productName.trim() || refurbishedPrice <= 0 || originalPrice <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }
      const productData = {
        name: productName.trim(),
        description: productDescription.trim(),
        condition: productCondition,
        original_price: originalPrice,
        refurbished_price: refurbishedPrice,
        brand_id: productBrandId,
        category_id: productCategoryId,
        compatible_with_model_id: productModelId,
        warranty_months: warrantyMonths,
        in_stock: inStock,
        is_featured: isFeatured,
        has_variations: hasVariations,
        refurbishment_date: new Date().toISOString().split("T")[0],
        user_uid: user.user.id,
      };

      let productId = currentProduct?.id;

      if (isEditing && productId) {
        // Update existing product
        const { error } = await supabase
          .from("refurbished_products")
          .update(productData)
          .eq("id", productId);

        if (error) throw error;

        // Delete existing specs
        await supabase
          .from("refurbished_product_specs")
          .delete()
          .eq("refurbished_product_id", productId);
      } else {
        // Create new product
        const { data, error } = await supabase
          .from("refurbished_products")
          .insert([productData])
          .select();

        if (error) throw error;
        productId = data[0].id;
      }

      // Insert specs
      if (productSpecs.length > 0 && productId) {
        const specsToInsert = productSpecs.map((spec) => ({
          refurbished_product_id: productId,
          spec_name: spec.spec_name,
          spec_value: spec.spec_value,
          user_uid: user.user.id,
        }));

        const { error: specsError } = await supabase
          .from("refurbished_product_specs")
          .insert(specsToInsert);

        if (specsError) throw specsError;
      }

      // Handle images if there are new ones
      if (productId) {
        // For editing, first get existing images
        if (isEditing) {
          const { data: existingImages } = await supabase
            .from("refurbished_product_images")
            .select("image_url")
            .eq("refurbished_product_id", productId);

          const existingUrls =
            existingImages?.map((img) => img.image_url) || [];

          // Find URLs that are in productImages but not in existingUrls (new ones)
          const newUrls = productImages.filter(
            (url) => !existingUrls.includes(url)
          );

          // Find URLs that are in existingUrls but not in productImages (removed ones)
          const removedUrls = existingUrls.filter(
            (url) => !productImages.includes(url)
          );

          // Delete removed images
          if (removedUrls.length > 0) {
            await supabase
              .from("refurbished_product_images")
              .delete()
              .in("image_url", removedUrls)
              .eq("refurbished_product_id", productId);
          }

          // Insert new images
          if (newUrls.length > 0) {
            const imagesToInsert = newUrls.map((url, index) => ({
              refurbished_product_id: productId,
              image_url: url,
              is_primary: index === 0 && existingUrls.length === 0, // Only set primary if it's the first image and no existing images
              user_uid: user.user.id,
            }));

            await supabase
              .from("refurbished_product_images")
              .insert(imagesToInsert);
          }
        } else {
          // For new product, insert all images
          const imagesToInsert = productImages.map((url, index) => ({
            refurbished_product_id: productId,
            image_url: url,
            is_primary: index === 0, // First image is primary
            user_uid: user.user.id,
          }));

          if (imagesToInsert.length > 0) {
            await supabase
              .from("refurbished_product_images")
              .insert(imagesToInsert);
          }
        }
      } // Handle variants if has_variations is true
      if (hasVariations && productId) {
        // For editing, first delete all existing variants and their images
        if (isEditing) {
          // We don't need to delete variant images explicitly because of the CASCADE constraint
          const { error: deleteVariantsError } = await supabase
            .from("refurbished_product_variants")
            .delete()
            .eq("refurbished_product_id", productId);

          if (deleteVariantsError) throw deleteVariantsError;
        }

        // Insert new variants
        if (productVariants.length > 0) {
          const variantsToInsert = productVariants.map((variant) => ({
            refurbished_product_id: productId,
            variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price_adjustment: parseFloat(variant.price_adjustment),
            stock: parseInt(variant.stock),
            sku: variant.sku,
            user_uid: user.user.id,
          }));

          const { data: insertedVariants, error: variantsError } =
            await supabase
              .from("refurbished_product_variants")
              .insert(variantsToInsert)
              .select();

          if (variantsError) throw variantsError;

          // Insert variant images
          for (let i = 0; i < productVariants.length; i++) {
            const variant = productVariants[i];
            const insertedVariant = insertedVariants[i];

            if (variant.images && variant.images.length > 0) {
              const imagesToInsert = variant.images.map((imageUrl, idx) => ({
                variant_id: insertedVariant.id,
                image_url: imageUrl,
                is_primary: idx === 0, // First image is primary
                user_uid: user.user.id,
              }));

              const { error: imagesError } = await supabase
                .from("refurbished_variant_images")
                .insert(imagesToInsert);

              if (imagesError) throw imagesError;
            }
          }
        }
      }

      // Refresh products list
      fetchData();

      toast.success(`Product ${isEditing ? "updated" : "created"} successfully`);

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(
        error.message || "Failed to save product. Please try again.")
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from("refurbished_products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      // Refresh products list
      fetchData();

      toast.success("Product deleted successfully");
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(
        error.message || "Failed to delete product. Please try again.")
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return (
          <Badge variant='default' className='bg-green-600'>
            Excellent
          </Badge>
        );
      case "good":
        return (
          <Badge variant='default' className='bg-blue-600'>
            Good
          </Badge>
        );
      case "fair":
        return (
          <Badge variant='default' className='bg-amber-600'>
            Fair
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <h1 className='text-2xl font-bold tracking-tight'>
          Refurbished Products Management
        </h1>

        <Button onClick={openCreateDialog}>
          <PlusIcon className='mr-2 h-4 w-4' />
          Add Refurbished Product
        </Button>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
        <div className='relative flex-1'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search products...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Filter by condition' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Conditions</SelectItem>
            <SelectItem value='excellent'>Excellent</SelectItem>
            <SelectItem value='good'>Good</SelectItem>
            <SelectItem value='fair'>Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center py-8'>
                    <div className='flex items-center justify-center'>
                      <Loader2 className='h-6 w-6 animate-spin mr-2' />
                      Loading products...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center py-8 text-muted-foreground'
                  >
                    {searchQuery || filterCondition !== "all"
                      ? "No products found matching your search"
                      : "No refurbished products added yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    {" "}
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden'>
                          {product.refurbished_product_images?.length ? (
                            <img
                              src={
                                product.refurbished_product_images.find(
                                  (img) => img.is_primary
                                )?.image_url ||
                                product.refurbished_product_images[0].image_url
                              }
                              alt={product.name}
                              className='h-full w-full object-cover rounded-md'
                            />
                          ) : (
                            <ImageIcon className='h-6 w-6 text-muted-foreground' />
                          )}
                        </div>
                        <div>
                          <div className='font-medium'>{product.name}</div>
                          {product.has_variations && (
                            <div className='text-xs mt-0.5 flex items-center gap-1'>
                              <Badge
                                variant='outline'
                                className='text-xs border-blue-500 text-blue-500'
                              >
                                Has Variants
                              </Badge>
                              {product.variants_count > 0 && (
                                <span className='text-xs text-muted-foreground'>
                                  ({product.variants_count})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getConditionBadge(product.condition)}
                    </TableCell>
                    <TableCell>{product.brand?.name || "-"}</TableCell>
                    <TableCell>${product.original_price.toFixed(2)}</TableCell>
                    <TableCell>
                      ${product.refurbished_price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {product.discount_percentage > 0 && (
                        <Badge
                          variant='outline'
                          className='text-green-600 border-green-600'
                        >
                          {product.discount_percentage}% OFF
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.in_stock}</TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className='h-4 w-4' />
                          <span className='sr-only'>Edit</span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive hover:text-destructive'
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                          <span className='sr-only'>Delete</span>
                        </Button>
                        {product.is_featured && (
                          <div
                            className='flex items-center'
                            title='Featured Product'
                          >
                            <BadgeCheck className='h-4 w-4 text-blue-500' />
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? "Edit Refurbished Product"
                : "Add New Refurbished Product"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Make changes to the refurbished product details"
                : "Create a new refurbished product listing"}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            {" "}
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='details'>Product Details</TabsTrigger>
              <TabsTrigger value='specs'>Specifications</TabsTrigger>
              <TabsTrigger value='variations' disabled={!hasVariations}>
                Variants
              </TabsTrigger>
              <TabsTrigger value='images'>Images</TabsTrigger>
            </TabsList>
            <TabsContent value='details' className='space-y-4 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='product-name'>Product Name *</Label>
                  <Input
                    id='product-name'
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder='Enter product name'
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label htmlFor='product-condition'>Condition *</Label>
                  <Select
                    value={productCondition}
                    onValueChange={(value: "excellent" | "good" | "fair") =>
                      setProductCondition(value)
                    }
                  >
                    <SelectTrigger id='product-condition' className='mt-1'>
                      <SelectValue placeholder='Select condition' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='excellent'>Excellent</SelectItem>
                      <SelectItem value='good'>Good</SelectItem>
                      <SelectItem value='fair'>Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='original-price'>Original Price *</Label>
                  <Input
                    id='original-price'
                    type='number'
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    placeholder='0.00'
                    className='mt-1'
                    min='0'
                    step='0.01'
                  />
                </div>
                <div>
                  <Label htmlFor='refurbished-price'>Refurbished Price *</Label>
                  <Input
                    id='refurbished-price'
                    type='number'
                    value={refurbishedPrice}
                    onChange={(e) =>
                      setRefurbishedPrice(Number(e.target.value))
                    }
                    placeholder='0.00'
                    className='mt-1'
                    min='0'
                    step='0.01'
                  />
                </div>
                <div>
                  <Label htmlFor='brand'>Brand</Label>
                  <Select
                    value={productBrandId?.toString() || ""}
                    onValueChange={(value) =>
                      setProductBrandId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger id='brand' className='mt-1'>
                      <SelectValue placeholder='Select brand' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='category'>Category</Label>
                  <Select
                    value={productCategoryId?.toString() || ""}
                    onValueChange={(value) =>
                      setProductCategoryId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger id='category' className='mt-1'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='compatible-model'>Compatible Model</Label>
                  <Select
                    value={productModelId?.toString() || ""}
                    onValueChange={(value) =>
                      setProductModelId(value ? Number(value) : null)
                    }
                  >
                    <SelectTrigger id='compatible-model' className='mt-1'>
                      <SelectValue placeholder='Select compatible model' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None</SelectItem>
                      {deviceModels.map((model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='warranty'>Warranty (Months)</Label>
                  <Input
                    id='warranty'
                    type='number'
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className='mt-1'
                    min='0'
                  />
                </div>
                <div>
                  <Label htmlFor='in-stock'>In Stock *</Label>
                  <Input
                    id='in-stock'
                    type='number'
                    value={inStock}
                    onChange={(e) => setInStock(Number(e.target.value))}
                    className='mt-1'
                    min='0'
                  />
                </div>{" "}
                <div className='flex items-center space-x-2 mt-6'>
                  <input
                    type='checkbox'
                    id='is-featured'
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className='h-4 w-4'
                  />
                  <Label htmlFor='is-featured'>Feature this product</Label>
                </div>
                <div className='flex items-center space-x-2 justify-between border-t pt-4 mt-4'>
                  <div>
                    <Label htmlFor='has-variations'>
                      This product has variants
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      Enable this if your product comes in different variations
                      like colors, storage sizes, etc.
                    </p>
                  </div>
                  <Switch
                    id='has-variations'
                    checked={hasVariations}
                    onCheckedChange={(checked) => {
                      setHasVariations(checked);
                      if (checked && activeTab !== "variations") {
                        setActiveTab("variations");
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='product-description'>Description</Label>
                <Textarea
                  id='product-description'
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder='Enter product description'
                  className='mt-1'
                  rows={4}
                />
              </div>
            </TabsContent>
            <TabsContent value='specs' className='space-y-4 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='spec-name'>Specification Name</Label>
                  <Input
                    id='spec-name'
                    value={newSpecName}
                    onChange={(e) => setNewSpecName(e.target.value)}
                    placeholder='e.g. Processor, Memory, Screen Size'
                    className='mt-1'
                  />
                </div>

                <div>
                  <Label htmlFor='spec-value'>Specification Value</Label>
                  <div className='flex items-center space-x-2 mt-1'>
                    <Input
                      id='spec-value'
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      placeholder='e.g. Intel i5, 8GB, 6.1 inches'
                    />
                    <Button
                      type='button'
                      onClick={handleAddSpec}
                      disabled={!newSpecName.trim() || !newSpecValue.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className='border rounded-md mt-4'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Specification</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className='w-[100px]'>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productSpecs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className='text-center text-muted-foreground py-4'
                        >
                          No specifications added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      productSpecs.map((spec, index) => (
                        <TableRow key={index}>
                          <TableCell>{spec.spec_name}</TableCell>
                          <TableCell>{spec.spec_value}</TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleRemoveSpec(index)}
                              className='text-destructive hover:text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                              <span className='sr-only'>Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value='variations' className='space-y-4 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <Label htmlFor='variant-name'>Variant Name</Label>
                  <Input
                    id='variant-name'
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder='e.g., Color, Storage, Size'
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label htmlFor='variant-value'>Variant Value</Label>
                  <Input
                    id='variant-value'
                    value={newVariantValue}
                    onChange={(e) => setNewVariantValue(e.target.value)}
                    placeholder='e.g., Blue, 128GB, XL'
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label htmlFor='variant-price-adjustment'>
                    Price Adjustment
                  </Label>
                  <Input
                    id='variant-price-adjustment'
                    type='number'
                    value={newVariantPriceAdjustment}
                    onChange={(e) =>
                      setNewVariantPriceAdjustment(e.target.value)
                    }
                    placeholder='0.00'
                    className='mt-1'
                  />
                  <p className='text-xs text-muted-foreground mt-1'>
                    Amount to add/subtract from base price
                  </p>
                </div>
                <div>
                  <Label htmlFor='variant-stock'>Stock</Label>
                  <Input
                    id='variant-stock'
                    type='number'
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                    placeholder='1'
                    className='mt-1'
                    min='0'
                  />
                </div>
                <div>
                  <Label htmlFor='variant-sku'>SKU (Optional)</Label>
                  <Input
                    id='variant-sku'
                    value={newVariantSku}
                    onChange={(e) => setNewVariantSku(e.target.value)}
                    placeholder='Product SKU'
                    className='mt-1'
                  />
                </div>
                <div className='flex items-end'>
                  <Button
                    className='w-full'
                    onClick={() => {
                      if (!newVariantName || !newVariantValue) return;

                      if (selectedVariantIndex !== null) {
                        // Update existing variant
                        const updatedVariants = [...productVariants];
                        updatedVariants[selectedVariantIndex] = {
                          ...updatedVariants[selectedVariantIndex],
                          variant_name: newVariantName,
                          variant_value: newVariantValue,
                          price_adjustment: newVariantPriceAdjustment,
                          stock: newVariantStock,
                          sku: newVariantSku || undefined,
                        };
                        setProductVariants(updatedVariants);
                      } else {
                        // Add new variant
                        setProductVariants([
                          ...productVariants,
                          {
                            variant_name: newVariantName,
                            variant_value: newVariantValue,
                            price_adjustment: newVariantPriceAdjustment,
                            stock: newVariantStock,
                            sku: newVariantSku || undefined,
                            images: [],
                          },
                        ]);
                      }

                      // Reset form
                      setNewVariantName("");
                      setNewVariantValue("");
                      setNewVariantPriceAdjustment("0");
                      setNewVariantStock("1");
                      setNewVariantSku("");
                      setSelectedVariantIndex(null);
                    }}
                  >
                    {selectedVariantIndex !== null
                      ? "Update Variant"
                      : "Add Variant"}
                  </Button>
                </div>
              </div>

              {selectedVariantIndex !== null && (
                <div className='flex justify-end'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setNewVariantName("");
                      setNewVariantValue("");
                      setNewVariantPriceAdjustment("0");
                      setNewVariantStock("1");
                      setNewVariantSku("");
                      setSelectedVariantIndex(null);
                    }}
                  >
                    Cancel Edit
                  </Button>
                </div>
              )}

              <div className='border rounded-md mt-4'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Price Adjust</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className='w-[120px]'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productVariants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-center text-muted-foreground py-4'
                        >
                          No variants added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      productVariants.map((variant, index) => (
                        <TableRow key={index}>
                          <TableCell>{variant.variant_name}</TableCell>
                          <TableCell>{variant.variant_value}</TableCell>
                          <TableCell>
                            {Number(variant.price_adjustment) > 0
                              ? `+$${variant.price_adjustment}`
                              : Number(variant.price_adjustment) < 0
                              ? `-$${Math.abs(
                                  Number(variant.price_adjustment)
                                )}`
                              : "$0.00"}
                          </TableCell>
                          <TableCell>{variant.stock}</TableCell>
                          <TableCell>{variant.sku || "-"}</TableCell>
                          <TableCell>
                            <div className='flex gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => {
                                  // Set form for editing
                                  setNewVariantName(variant.variant_name);
                                  setNewVariantValue(variant.variant_value);
                                  setNewVariantPriceAdjustment(
                                    variant.price_adjustment
                                  );
                                  setNewVariantStock(variant.stock);
                                  setNewVariantSku(variant.sku || "");
                                  setSelectedVariantIndex(index);
                                }}
                              >
                                <Pencil className='h-4 w-4' />
                                <span className='sr-only'>Edit</span>
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='text-destructive'
                                onClick={() => {
                                  // Remove variant
                                  setProductVariants(
                                    productVariants.filter(
                                      (_, i) => i !== index
                                    )
                                  );
                                }}
                              >
                                <Trash2 className='h-4 w-4' />
                                <span className='sr-only'>Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {selectedVariantIndex !== null && (
                <div className='mt-6 border-t pt-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <div>
                      <h3 className='text-lg font-medium'>
                        Images for{" "}
                        {productVariants[selectedVariantIndex].variant_name}:{" "}
                        {productVariants[selectedVariantIndex].variant_value}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        Add specific images for this variant
                      </p>
                    </div>
                  </div>

                  <ImageUploader
                    onMultipleImagesUploaded={(urls) => {
                      const updatedVariants = [...productVariants];
                      updatedVariants[selectedVariantIndex].images = [
                        ...updatedVariants[selectedVariantIndex].images,
                        ...urls,
                      ];
                      setProductVariants(updatedVariants);
                    }}
                    existingImageUrls={
                      productVariants[selectedVariantIndex].images || []
                    }
                    folder='refurbished-variants'
                    multiple={true}
                    maxFiles={5}
                  />

                  {productVariants[selectedVariantIndex].images &&
                    productVariants[selectedVariantIndex].images.length > 0 && (
                      <div className='mt-4'>
                        <h4 className='font-medium mb-2'>
                          Current Variant Images
                        </h4>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                          {productVariants[selectedVariantIndex].images.map(
                            (url, idx) => (
                              <div key={idx} className='relative group'>
                                <div className='aspect-square bg-gray-100 rounded-md overflow-hidden'>
                                  <Image
                                    width={100}
                                    height={100}
                                    src={url}
                                    alt={`Variant image ${idx + 1}`}
                                    className='w-full h-full object-cover'
                                  />
                                </div>
                                <Button
                                  variant='destructive'
                                  size='icon'
                                  className='absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                                  onClick={() => {
                                    const updatedVariants = [
                                      ...productVariants,
                                    ];
                                    updatedVariants[
                                      selectedVariantIndex
                                    ].images = updatedVariants[
                                      selectedVariantIndex
                                    ].images.filter(
                                      (_, imgIdx) => imgIdx !== idx
                                    );
                                    setProductVariants(updatedVariants);
                                  }}
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                                {idx === 0 && (
                                  <Badge className='absolute top-1 left-1 bg-blue-500'>
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <div className='mt-4'>
                <p className='text-sm text-muted-foreground'>
                  Tip: Select a variant from the table above to add
                  variant-specific images.
                </p>
              </div>
            </TabsContent>
            <TabsContent value='images' className='space-y-4 pt-4'>
              <div>
                <Label>Product Images</Label>
                <div className='mt-2'>
                  <ImageUploader
                    onMultipleImagesUploaded={handleMultipleImagesUploaded}
                    existingImageUrls={productImages}
                    folder='refurbished-products'
                    multiple={true}
                    maxFiles={5}
                  />
                </div>

                {productImages.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='font-medium mb-2'>Current Images</h4>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      {productImages.map((url, index) => (
                        <div key={index} className='relative group'>
                          <div className='aspect-square bg-gray-100 rounded-md overflow-hidden'>
                            <Image
                              width={100}
                              height={100}
                              src={url}
                              alt={`Product image ${index + 1}`}
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <Button
                            variant='destructive'
                            size='icon'
                            className='absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                            onClick={() => handleRemoveImage(url)}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                          {index === 0 && (
                            <Badge className='absolute top-1 left-1 bg-blue-500'>
                              Primary
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className='text-xs text-muted-foreground mt-2'>
                      The first image will be used as the primary product image.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              refurbished product and all associated data including images and
              specifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
