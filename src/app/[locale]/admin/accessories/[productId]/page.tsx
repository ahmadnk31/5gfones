"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OpenAI from "openai";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use server-side API calls
});

// Types
type ProductVariant = {
  id?: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: string;
  stock: string;
  images: string[];
  is_new?: boolean;
  is_deleted?: boolean;
};

type ProductFormData = {
  id?: number;
  name: string;
  description: string;
  category_id: string;
  brand_id: string;
  compatible_with_model_id: string;
  image_url: string;
  base_price: string;
  in_stock: string;
  has_variations: boolean;
  variants: ProductVariant[];
};

type Brand = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name?: string;
};

type DeviceModel = {
  id: number;
  name: string;
  display_name: string;
};

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    compatible_with_model_id: "",
    image_url: "",
    base_price: "",
    in_stock: "",
    has_variations: false,
    variants: [],
  });

  const [originalVariants, setOriginalVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);

  const router = useRouter();
  const supabase = createClient();

  // Fetch product and reference data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch the product details
        const { data: productData, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", params.productId)
          .single();

        if (error) throw error;

        // Fetch the variants if any
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", params.productId);

        if (variantError) throw variantError;

        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from("device_brands")
          .select("id, name")
          .order("name");

        if (brandsError) throw brandsError;
        setBrands(brandsData || []);

        // Fetch categories with parent information
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select(`
            id, name, parent_id,
            parent:parent_id(name)
          `)
          .order("name");

        if (categoriesError) throw categoriesError;

        const formattedCategories = categoriesData?.map((category) => ({
          id: category.id,
          name: category.name,
          parent_id: category.parent_id,
          parent_name: category.parent?.name,
        }));
        setCategories(formattedCategories || []);

        // Fetch device models with formatting
        const { data: modelsData, error: modelsError } = await supabase
          .from("device_models")
          .select(`
            id, name,
            device_series:device_series_id(
              name,
              device_types:device_type_id(
                name,
                device_brands:brand_id(name)
              )
            )
          `)
          .order("name");

        if (modelsError) throw modelsError;

        const formattedModels =
          modelsData?.map((model) => ({
            id: model.id,
            name: model.name,
            display_name: `${model.device_series?.device_types?.device_brands?.name || ""} ${
              model.device_series?.device_types?.name || ""
            } ${model.device_series?.name || ""} ${model.name}`.trim(),
          })) || [];

        setDeviceModels(formattedModels);

        // Format the variants
        const formattedVariants = variantData?.map((variant) => ({
          id: variant.id,
          variant_name: variant.variant_name,
          variant_value: variant.variant_value,
          price_adjustment: variant.price_adjustment.toString(),
          stock: variant.stock.toString(),
          images: variant.images || [],
        })) || [];

        setOriginalVariants(formattedVariants);

        // Set the product form data
        setProduct({
          id: productData.id,
          name: productData.name || "",
          description: productData.description || "",
          category_id: productData.category_id?.toString() || "",
          brand_id: productData.brand_id?.toString() || "",
          compatible_with_model_id: productData.compatible_with_model_id?.toString() || "",
          image_url: productData.image_url || "",
          base_price: productData.base_price?.toString() || "",
          in_stock: productData.in_stock?.toString() || "0",
          has_variations: productData.has_variations || false,
          variants: formattedVariants,
        });

      } catch (error) {
        console.error("Error fetching product data:", error);
        alert("Error loading product data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.productId]);

  // Handle main product image upload
  const handleMainImageUpload = (url: string) => {
    setProduct({ ...product, image_url: url });
  };

  // Handle generating product description from image
  const handleGenerateDescription = async () => {
    if (!product.image_url) {
      alert("Please upload a product image first");
      return;
    }

    setGeneratingDescription(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Describe this phone accessory product in detail for an e-commerce listing. Include key features, materials, benefits, and potential use cases. Keep it professional, engaging, and around 100 words. Focus on selling points." 
              },
              {
                type: "image_url",
                image_url: { url: product.image_url },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const generatedDescription = response.choices[0]?.message?.content || "";
      setProduct({ ...product, description: generatedDescription });
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Handle adding a variant to the form
  const handleAddVariant = () => {
    setProduct({
      ...product,
      variants: [
        ...product.variants,
        {
          variant_name: "",
          variant_value: "",
          price_adjustment: "0",
          stock: "0",
          images: [],
          is_new: true,
        },
      ],
    });
  };

  // Handle removing a variant
  const handleRemoveVariant = (index: number) => {
    const updatedVariants = [...product.variants];
    
    // If the variant has an ID (exists in database), mark it for deletion
    if (updatedVariants[index].id) {
      updatedVariants[index] = {
        ...updatedVariants[index],
        is_deleted: true,
      };
      setProduct({
        ...product,
        variants: updatedVariants,
      });
    } else {
      // Otherwise just remove it from the array
      updatedVariants.splice(index, 1);
      setProduct({
        ...product,
        variants: updatedVariants,
      });
    }
  };

  // Handle updating a variant's fields
  const handleVariantChange = (
    index: number,
    field: keyof ProductVariant,
    value: string | string[]
  ) => {
    const updatedVariants = [...product.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };
    setProduct({
      ...product,
      variants: updatedVariants,
    });
  };

  // Handle adding image to a variant
  const handleAddVariantImage = (index: number, imageUrl: string) => {
    const updatedVariants = [...product.variants];
    const currentImages = updatedVariants[index].images || [];
    updatedVariants[index].images = [...currentImages, imageUrl];
    setProduct({
      ...product,
      variants: updatedVariants,
    });
  };

  // Handle removing image from a variant
  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].images.splice(imageIndex, 1);
    setProduct({
      ...product,
      variants: updatedVariants,
    });
  };

  // Handle save product changes
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update the product data
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: product.name,
          description: product.description || null,
          category_id: parseInt(product.category_id),
          brand_id: parseInt(product.brand_id),
          compatible_with_model_id: product.compatible_with_model_id
            ? parseInt(product.compatible_with_model_id)
            : null,
          image_url: product.image_url || null,
          base_price: parseFloat(product.base_price),
          in_stock: parseInt(product.in_stock),
          has_variations: product.has_variations,
        })
        .eq("id", params.productId);

      if (productError) throw productError;

      // Handle variants
      if (product.has_variations) {
        // Process existing variants
        for (const variant of product.variants) {
          if (variant.is_deleted && variant.id) {
            // Delete variant
            const { error: deleteError } = await supabase
              .from("product_variants")
              .delete()
              .eq("id", variant.id);

            if (deleteError) throw deleteError;
          } else if (variant.id) {
            // Update existing variant
            const { error: updateError } = await supabase
              .from("product_variants")
              .update({
                variant_name: variant.variant_name,
                variant_value: variant.variant_value,
                price_adjustment: parseFloat(variant.price_adjustment),
                stock: parseInt(variant.stock),
                images: variant.images,
              })
              .eq("id", variant.id);

            if (updateError) throw updateError;
          } else if (!variant.is_deleted) {
            // Add new variant
            const { error: insertError } = await supabase
              .from("product_variants")
              .insert({
                product_id: parseInt(params.productId),
                variant_name: variant.variant_name,
                variant_value: variant.variant_value,
                price_adjustment: parseFloat(variant.price_adjustment),
                stock: parseInt(variant.stock),
                images: variant.images,
              });

            if (insertError) throw insertError;
          }
        }
      } else {
        // If product no longer has variations, delete all existing variants
        const existingVariants = product.variants.filter(v => v.id);
        if (existingVariants.length > 0) {
          const variantIds = existingVariants.map(v => v.id);
          const { error: deleteAllError } = await supabase
            .from("product_variants")
            .delete()
            .in("id", variantIds as number[]);

          if (deleteAllError) throw deleteAllError;
        }
      }

      alert("Product updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    try {
      // Delete all product variants first
      const { error: variantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", params.productId);

      if (variantsError) throw variantsError;

      // Then delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", params.productId);

      if (productError) throw productError;

      alert("Product deleted successfully!");
      router.push("/admin/accessories");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter out variants marked for deletion for UI display
  const activeVariants = product.variants.filter(v => !v.is_deleted);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/accessories")}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Accessory</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSaveProduct} disabled={saving}>
            {saving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Product Info</TabsTrigger>
          <TabsTrigger value="variations" disabled={!product.has_variations}>
            Variations {activeVariants.length > 0 ? `(${activeVariants.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSaveProduct}>
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Premium Tempered Glass Screen Protector"
                    value={product.name}
                    onChange={(e) =>
                      setProduct({ ...product, name: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Select
                      value={product.brand_id}
                      onValueChange={(value) =>
                        setProduct({ ...product, brand_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={product.category_id}
                      onValueChange={(value) =>
                        setProduct({ ...product, category_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base-price">Base Price</Label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="base-price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        placeholder="19.99"
                        value={product.base_price}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            base_price: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="in-stock">Stock</Label>
                    <Input
                      id="in-stock"
                      type="number"
                      min="0"
                      placeholder="10"
                      value={product.in_stock}
                      className="mt-1"
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          in_stock: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="compatible">Compatible With (optional)</Label>
                  <Select
                    value={product.compatible_with_model_id}
                    onValueChange={(value) =>
                      setProduct({
                        ...product,
                        compatible_with_model_id: value,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select compatible device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not device specific</SelectItem>
                      {deviceModels.map((model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          {model.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="has-variations">Has Variations</Label>
                  <Switch
                    id="has-variations"
                    checked={product.has_variations}
                    onCheckedChange={(checked) => {
                      setProduct({ ...product, has_variations: checked });
                      if (checked && activeVariants.length === 0) {
                        handleAddVariant();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <Label>Primary Product Image</Label>
                  </div>
                  <div className="mt-1">
                    <ImageUploader
                      onImageUploaded={handleMainImageUpload}
                      existingImageUrl={product.image_url}
                      folder="accessories"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Product Description</Label>
                    {product.image_url && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription}
                      >
                        {generatingDescription ? (
                          <>
                            <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <WandSparklesIcon className="mr-2 h-3 w-3" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    rows={9}
                    placeholder="Detailed description of the product..."
                    value={product.description}
                    className="mt-1"
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="mt-8">
                  <Button
                    type="button"
                    onClick={() => {
                      if (product.has_variations) {
                        setActiveTab("variations");
                      } else {
                        handleSaveProduct(new Event('submit') as any);
                      }
                    }}
                    disabled={saving}
                    className="w-full"
                  >
                    {product.has_variations ? "Go to Variations" : (
                      saving ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Product"
                      )
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variations" className="space-y-6 mt-4">
            <div className="space-y-4">
              {activeVariants.map((variant, variantIndex) => (
                <Card key={variant.id || `new-${variantIndex}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">
                        Variation {variantIndex + 1}
                      </CardTitle>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveVariant(
                          product.variants.findIndex(v => 
                            (v.id && v.id === variant.id) || 
                            (!v.id && v === variant)
                          )
                        )}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`variant-name-${variantIndex}`}>Variation Type</Label>
                        <Input
                          id={`variant-name-${variantIndex}`}
                          placeholder="e.g., Color, Size, Material"
                          value={variant.variant_name}
                          className="mt-1"
                          onChange={(e) => {
                            const index = product.variants.findIndex(v => 
                              (v.id && v.id === variant.id) || 
                              (!v.id && v === variant)
                            );
                            handleVariantChange(index, "variant_name", e.target.value);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`variant-value-${variantIndex}`}>Variation Value</Label>
                        <Input
                          id={`variant-value-${variantIndex}`}
                          placeholder="e.g., Red, Large, Leather"
                          value={variant.variant_value}
                          className="mt-1"
                          onChange={(e) => {
                            const index = product.variants.findIndex(v => 
                              (v.id && v.id === variant.id) || 
                              (!v.id && v === variant)
                            );
                            handleVariantChange(index, "variant_value", e.target.value);
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`price-adjustment-${variantIndex}`}>Price Adjustment</Label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id={`price-adjustment-${variantIndex}`}
                            type="number"
                            step="0.01"
                            className="pl-7"
                            placeholder="0.00"
                            value={variant.price_adjustment}
                            onChange={(e) => {
                              const index = product.variants.findIndex(v => 
                                (v.id && v.id === variant.id) || 
                                (!v.id && v === variant)
                              );
                              handleVariantChange(index, "price_adjustment", e.target.value);
                            }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`stock-${variantIndex}`}>Stock</Label>
                        <Input
                          id={`stock-${variantIndex}`}
                          type="number"
                          min="0"
                          placeholder="5"
                          value={variant.stock}
                          className="mt-1"
                          onChange={(e) => {
                            const index = product.variants.findIndex(v => 
                              (v.id && v.id === variant.id) || 
                              (!v.id && v === variant)
                            );
                            handleVariantChange(index, "stock", e.target.value);
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <Label>Variation Images</Label>
                        <Badge variant="outline" className="font-normal">
                          {variant.images.length} images
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                        {variant.images.map((image, imageIndex) => (
                          <div key={imageIndex} className="relative rounded-md overflow-hidden border border-border h-32">
                            <img 
                              src={image} 
                              alt={`${variant.variant_name} ${variant.variant_value} image ${imageIndex + 1}`} 
                              className="w-full h-full object-contain bg-muted/50"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-6 w-6 rounded-full"
                              onClick={() => {
                                const index = product.variants.findIndex(v => 
                                  (v.id && v.id === variant.id) || 
                                  (!v.id && v === variant)
                                );
                                handleRemoveVariantImage(index, imageIndex);
                              }}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="border-2 border-dashed rounded-md h-32 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                          <ImageUploader
                            onImageUploaded={(url) => {
                              const index = product.variants.findIndex(v => 
                                (v.id && v.id === variant.id) || 
                                (!v.id && v === variant)
                              );
                              handleAddVariantImage(index, url);
                            }}
                            folder={`accessories/variants/${variant.id || `new-${variantIndex}`}`}
                            className="h-full w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVariant}
                className="w-full"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Another Variation
              </Button>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab("info")}
              >
                Back to Product Info
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Product"
                )}
              </Button>
            </div>
          </TabsContent>
        </form>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
