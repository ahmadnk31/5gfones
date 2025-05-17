"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addRefurbishedToCart } from "@/lib/cart";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ShoppingCartIcon,
  BadgeCheck,
  Shield,
  CheckCircle,
} from "lucide-react";

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
  id: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock: number;
  sku?: string;
  variant_images?: {
    id: number;
    image_url: string;
    is_primary: boolean;
  }[];
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
  refurbished_product_variants?: RefurbishedProductVariant[];
}

export default function RefurbishedProductDetailPage() {
  const [product, setProduct] = useState<RefurbishedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] =
    useState<RefurbishedProductVariant | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RefurbishedProduct[]>(
    []
  );

  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  const supabase = createClient();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Fetch refurbished product with related data
        const { data: productData, error: productError } = await supabase
          .from("refurbished_products")
          .select(
            `
            *,
            brands (id, name),
            categories (id, name),
            compatible_with_model:device_models (id, name),
            refurbished_product_images (id, image_url, is_primary),
            refurbished_product_specs (id, spec_name, spec_value),
            refurbished_product_variants (id, variant_name, variant_value, price_adjustment, stock, sku)
          `
          )
          .eq("id", productId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");

        setProduct(productData);

        // Fetch variants if product has variations
        if (productData.has_variations) {
          const { data: variantsData, error: variantsError } = await supabase
            .from("refurbished_product_variants")
            .select("*")
            .eq("refurbished_product_id", productData.id);

          if (variantsError) throw variantsError;

          if (variantsData && variantsData.length > 0) {
            // Get images for each variant
            for (let variant of variantsData) {
              const { data: variantImagesData, error: variantImagesError } =
                await supabase
                  .from("refurbished_variant_images")
                  .select("*")
                  .eq("variant_id", variant.id);

              if (variantImagesError) throw variantImagesError;
              variant.variant_images = variantImagesData || [];
            }

            // Set the first variant as selected by default
            setSelectedVariant(variantsData[0]);
          }
        }

        // Set selected image to primary image or first image
        if (
          productData.refurbished_product_images &&
          productData.refurbished_product_images.length > 0
        ) {
          const primaryImage = productData.refurbished_product_images.find(
            (img) => img.is_primary
          );
          setSelectedImage(
            primaryImage
              ? primaryImage.image_url
              : productData.refurbished_product_images[0].image_url
          );
        }

        // Fetch related products
        if (productData) {
          let query = supabase
            .from("refurbished_products")
            .select(
              `
              *,
              brands (id, name),
              categories (id, name),
              compatible_with_model:device_models (id, name),
              refurbished_product_images (id, image_url, is_primary)
            `
            )
            .neq("id", productId)
            .eq("in_stock", true)
            .gt("in_stock", 0)
            .limit(4);

          // Filter by same brand if available
          if (productData.brand_id) {
            query = query.eq("brand_id", productData.brand_id);
          }
          // Or by same category if available
          else if (productData.category_id) {
            query = query.eq("category_id", productData.category_id);
          }

          const { data: relatedData, error: relatedError } = await query;

          if (relatedError) throw relatedError;
          setRelatedProducts(relatedData || []);
        }
      } catch (error: any) {
        console.error("Error fetching product:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, supabase]);
  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    // Check if product has variations and a variant is selected
    if (product) {
      const stockLimit = selectedVariant
        ? selectedVariant.stock
        : product.in_stock;

      if (newQuantity >= 1 && newQuantity <= stockLimit) {
        setQuantity(newQuantity);
      }
    }
  };

  // Add to cart function
  const handleAddToCart = () => {
    if (!product) return;

    let finalPrice = product.refurbished_price;
    let imageUrl: string | undefined;
    let stockLimit = product.in_stock;
    let productName = product.name;
    let variantInfo: Record<string, string> | undefined;

    // If we have a selected variant, use its data
    if (selectedVariant) {
      finalPrice += selectedVariant.price_adjustment;
      stockLimit = selectedVariant.stock;

      const primaryImage = selectedVariant.variant_images?.find(
        (img) => img.is_primary
      );
      imageUrl = primaryImage
        ? primaryImage.image_url
        : selectedVariant.variant_images &&
          selectedVariant.variant_images.length > 0
        ? selectedVariant.variant_images[0].image_url
        : undefined;

      productName = `${product.name} - ${selectedVariant.variant_value}`;
      variantInfo = {
        variant_name: selectedVariant.variant_name,
        variant_value: selectedVariant.variant_value,
      };
    } else {
      // Get primary image if available (for products without variants)
      const primaryImage = product.refurbished_product_images?.find(
        (img) => img.is_primary
      );
      imageUrl = primaryImage
        ? primaryImage.image_url
        : product.refurbished_product_images &&
          product.refurbished_product_images.length > 0
        ? product.refurbished_product_images[0].image_url
        : undefined;
    }

    // Update the addRefurbishedToCart function to handle variants
    addRefurbishedToCart(
      product.id,
      productName,
      finalPrice,
      quantity,
      imageUrl,
      product.condition,
      selectedVariant?.id,
      variantInfo
    );

    toast({
      title: "Added to Cart",
      description: `${quantity} ${
        quantity === 1 ? "unit" : "units"
      } of ${productName} added to your cart`,
      duration: 3000,
    });
  };

  // Get condition badge
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return (
          <Badge variant='default' className='bg-green-600'>
            Excellent Condition
          </Badge>
        );
      case "good":
        return (
          <Badge variant='default' className='bg-blue-600'>
            Good Condition
          </Badge>
        );
      case "fair":
        return (
          <Badge variant='default' className='bg-amber-600'>
            Fair Condition
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Get primary image URL for related products
  const getPrimaryImage = (product: RefurbishedProduct) => {
    if (
      !product.refurbished_product_images ||
      product.refurbished_product_images.length === 0
    ) {
      return "/placeholder-image.jpg"; // Replace with your placeholder image
    }

    const primaryImage = product.refurbished_product_images.find(
      (img) => img.is_primary
    );
    return primaryImage
      ? primaryImage.image_url
      : product.refurbished_product_images[0].image_url;
  };

  // Condition description based on condition value
  const getConditionDescription = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "Like new with minimal to no signs of wear. Fully functional with battery health above 90%.";
      case "good":
        return "Minor cosmetic imperfections not visible at arm's length. Fully functional with battery health above 80%.";
      case "fair":
        return "Noticeable signs of use such as scratches or scuffs. Fully functional with battery health above 70%.";
      default:
        return "Condition details not available.";
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-12 flex justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='container mx-auto py-12'>
        <Card>
          <CardContent className='flex flex-col items-center py-12'>
            <h2 className='text-xl font-semibold mb-4'>Product Not Found</h2>
            <p className='text-muted-foreground mb-6'>
              {error || "The requested product could not be found."}
            </p>
            <Link href='/refurbished'>
              <Button>
                <ChevronLeft className='mr-2 h-4 w-4' />
                Back to Refurbished Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      {/* Breadcrumbs */}
      <div className='flex items-center text-sm text-muted-foreground mb-6'>
        <Link href='/' className='hover:text-primary'>
          Home
        </Link>
        <span className='mx-2'>/</span>
        <Link href='/refurbished' className='hover:text-primary'>
          Refurbished Products
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-foreground'>{product.name}</span>
      </div>

      {/* Back Button */}
      <div className='mb-6'>
        <Button variant='outline' onClick={() => router.back()}>
          <ChevronLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
        {/* Product Images */}
        <div className='space-y-4'>
          <div className='aspect-square bg-muted rounded-lg overflow-hidden border'>
            <img
              src={selectedImage || "/placeholder-image.jpg"}
              alt={product.name}
              className='w-full h-full object-contain'
            />
          </div>

          {/* Thumbnail Images */}
          {product.refurbished_product_images &&
            product.refurbished_product_images.length > 1 && (
              <div className='grid grid-cols-5 gap-2'>
                {product.refurbished_product_images.map((image, index) => (
                  <div
                    key={image.id || index}
                    className={`aspect-square rounded-md overflow-hidden border cursor-pointer transition-all ${
                      selectedImage === image.image_url
                        ? "ring-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedImage(image.image_url)}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} - Image ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Product Details */}
        <div className='space-y-6'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              {getConditionBadge(product.condition)}
              {product.is_featured && (
                <Badge
                  variant='outline'
                  className='border-blue-500 text-blue-500'
                >
                  <BadgeCheck className='mr-1 h-4 w-4' />
                  Featured
                </Badge>
              )}
            </div>
            <h1 className='text-3xl font-bold'>{product.name}</h1>
            <div className='flex items-center gap-2 mt-2 text-muted-foreground'>
              {product.brand && <span>{product.brand.name}</span>}
              {product.brand && product.compatible_with_model && (
                <span> • </span>
              )}
              {product.compatible_with_model && (
                <span>{product.compatible_with_model.name}</span>
              )}
            </div>
          </div>{" "}
          {/* Price Information */}
          <div className='pt-4 border-t'>
            <div className='flex items-end gap-2'>
              <span className='text-3xl font-bold'>
                {formatPrice(
                  selectedVariant
                    ? product.refurbished_price +
                        selectedVariant.price_adjustment
                    : product.refurbished_price
                )}
              </span>
              {product.discount_percentage > 0 && (
                <span className='text-lg text-muted-foreground line-through mb-1'>
                  {formatPrice(product.original_price)}
                </span>
              )}
              {product.discount_percentage > 0 && (
                <Badge variant='destructive' className='ml-2 mb-1'>
                  {product.discount_percentage}% OFF
                </Badge>
              )}
            </div>
            <div className='flex items-center mt-2'>
              <Shield className='h-4 w-4 mr-1 text-primary' />
              <span className='text-sm'>
                {product.warranty_months} month warranty included
              </span>
            </div>
          </div>{" "}
          {/* Availability */}
          <div className='pt-4 border-t'>
            <div className='flex items-center gap-2'>
              <span className='font-medium'>Availability:</span>
              {product.has_variations ? (
                selectedVariant ? (
                  selectedVariant.stock > 0 ? (
                    <span className='text-green-600 flex items-center'>
                      <CheckCircle className='h-4 w-4 mr-1' />
                      In Stock ({selectedVariant.stock} available)
                    </span>
                  ) : (
                    <span className='text-red-500'>Out of Stock</span>
                  )
                ) : (
                  <span className='text-amber-500'>Select a variant</span>
                )
              ) : product.in_stock > 0 ? (
                <span className='text-green-600 flex items-center'>
                  <CheckCircle className='h-4 w-4 mr-1' />
                  In Stock ({product.in_stock} available)
                </span>
              ) : (
                <span className='text-red-500'>Out of Stock</span>
              )}
            </div>
          </div>
          {/* Condition Description */}
          <div className='pt-4 border-t'>
            <h3 className='font-medium mb-2'>Condition Details</h3>
            <p className='text-muted-foreground'>
              {getConditionDescription(product.condition)}
            </p>
          </div>
          {/* Variant Selection (if product has variants) */}
          {product.has_variations && (
            <div className='pt-4 border-t'>
              <h3 className='font-medium mb-3'>
                {product.refurbished_product_variants?.[0]?.variant_name ||
                  "Options"}
              </h3>
              <div className='flex flex-wrap gap-2 mb-3'>
                {product.refurbished_product_variants?.map((variant, index) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);

                      // Update selected image to variant's primary image if available
                      if (
                        variant.variant_images &&
                        variant.variant_images.length > 0
                      ) {
                        const primaryImage = variant.variant_images.find(
                          (img) => img.is_primary
                        );
                        setSelectedImage(
                          primaryImage
                            ? primaryImage.image_url
                            : variant.variant_images[0].image_url
                        );
                      }

                      // Reset quantity if needed
                      if (quantity > variant.stock) {
                        setQuantity(variant.stock > 0 ? 1 : 0);
                      }
                    }}
                    className={`px-4 py-2 border rounded-md transition-all ${
                      selectedVariant?.id === variant.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:border-primary/50"
                    } ${
                      variant.stock <= 0
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    disabled={variant.stock <= 0}
                  >
                    <div className='flex flex-col items-start'>
                      <span>{variant.variant_value}</span>
                      {variant.price_adjustment !== 0 && (
                        <span className='text-xs text-muted-foreground'>
                          {variant.price_adjustment > 0 ? "+" : ""}
                          {formatPrice(variant.price_adjustment)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <div className='text-sm'>
                  <span
                    className={
                      selectedVariant.stock > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} in stock`
                      : "Out of stock"}
                  </span>
                  {selectedVariant.sku && (
                    <span className='text-muted-foreground ml-2'>
                      SKU: {selectedVariant.sku}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}{" "}
          {/* Add to Cart Section */}
          <div className='pt-4 border-t'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='flex items-center border rounded-md'>
                <button
                  className='px-3 py-1 border-r hover:bg-muted'
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className='px-4 py-1 min-w-[40px] text-center'>
                  {quantity}
                </span>
                <button
                  className='px-3 py-1 border-l hover:bg-muted'
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    selectedVariant
                      ? quantity >= selectedVariant.stock
                      : quantity >= product.in_stock
                  }
                >
                  +
                </button>
              </div>
              <Button
                className='flex-1'
                onClick={handleAddToCart}
                disabled={
                  selectedVariant
                    ? selectedVariant.stock <= 0
                    : product.in_stock <= 0 ||
                      (product.has_variations && !selectedVariant)
                }
              >
                <ShoppingCartIcon className='mr-2 h-4 w-4' />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <Tabs defaultValue='description' className='mb-12'>
        <TabsList>
          <TabsTrigger value='description'>Description</TabsTrigger>
          <TabsTrigger value='specifications'>Specifications</TabsTrigger>
          <TabsTrigger value='warranty'>Warranty Information</TabsTrigger>
        </TabsList>
        <TabsContent value='description' className='p-4 border rounded-md mt-2'>
          <div className='prose max-w-none'>
            <p>{product.description}</p>
            <h3>What is a refurbished device?</h3>
            <p>
              Our refurbished devices are pre-owned products that have been
              professionally inspected, repaired, and tested to ensure they meet
              our quality standards. Each device undergoes a thorough
              refurbishment process, including:
            </p>
            <ul>
              <li>Full functional testing</li>
              <li>Replacement of defective parts (if any)</li>
              <li>Thorough cleaning and sanitization</li>
              <li>Software updates to the latest compatible version</li>
              <li>Fresh factory reset</li>
            </ul>
            <p>
              Refurbished products are an environmentally friendly and
              cost-effective alternative to buying new devices while still
              receiving a high-quality product with warranty coverage.
            </p>
          </div>
        </TabsContent>
        <TabsContent
          value='specifications'
          className='p-4 border rounded-md mt-2'
        >
          {product.refurbished_product_specs &&
          product.refurbished_product_specs.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {product.refurbished_product_specs.map((spec, index) => (
                <div key={spec.id || index} className='flex border-b pb-2'>
                  <div className='font-medium min-w-[150px]'>
                    {spec.spec_name}
                  </div>
                  <div className='text-muted-foreground'>{spec.spec_value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground'>
              No specifications available for this product.
            </p>
          )}
        </TabsContent>
        <TabsContent value='warranty' className='p-4 border rounded-md mt-2'>
          <div className='prose max-w-none'>
            <h3>Warranty Information</h3>
            <p>
              This refurbished product comes with a {product.warranty_months}
              -month warranty from the date of purchase.
            </p>
            <h4>What's Covered:</h4>
            <ul>
              <li>Manufacturing defects</li>
              <li>Hardware malfunctions not caused by user damage</li>
              <li>
                Battery issues (if battery health drops below 70% within
                warranty period)
              </li>
            </ul>
            <h4>What's Not Covered:</h4>
            <ul>
              <li>Physical damage from drops, spills or accidents</li>
              <li>Water or liquid damage</li>
              <li>Unauthorized repairs or modifications</li>
              <li>Normal wear and tear</li>
              <li>Software issues not related to hardware defects</li>
            </ul>
            <p>
              To make a warranty claim, please contact our customer service
              department with your proof of purchase and a description of the
              issue.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>Related Products</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className='overflow-hidden group'>
                <div className='aspect-square relative overflow-hidden'>
                  <img
                    src={getPrimaryImage(relatedProduct)}
                    alt={relatedProduct.name}
                    className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                  <div className='absolute top-2 right-2'>
                    {getConditionBadge(relatedProduct.condition)}
                  </div>
                  {relatedProduct.discount_percentage > 0 && (
                    <Badge
                      variant='destructive'
                      className='absolute top-2 left-2'
                    >
                      {relatedProduct.discount_percentage}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className='p-4'>
                  <h3 className='font-semibold line-clamp-1'>
                    {relatedProduct.name}
                  </h3>
                  <p className='text-sm text-muted-foreground line-clamp-1 mb-2'>
                    {relatedProduct.brand?.name}{" "}
                    {relatedProduct.compatible_with_model?.name
                      ? `- ${relatedProduct.compatible_with_model.name}`
                      : ""}
                  </p>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold'>
                      {formatPrice(relatedProduct.refurbished_price)}
                    </span>
                    {relatedProduct.discount_percentage > 0 && (
                      <span className='text-sm text-muted-foreground line-through'>
                        {formatPrice(relatedProduct.original_price)}
                      </span>
                    )}
                  </div>
                  <div className='mt-3'>
                    <Link href={`/refurbished/${relatedProduct.id}`}>
                      <Button className='w-full' variant='outline'>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
