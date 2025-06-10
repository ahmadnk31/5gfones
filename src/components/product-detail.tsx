"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { ReactQuillEditor } from "@/components/react-quill-editor";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add mobile-friendly styles for product description
const productDetailStyles = `
  .product-detail-editor .ql-container.ql-snow {
    border: none;
  }
  
  .product-detail-editor .ql-toolbar.ql-snow {
    display: none;
  }
  
  @media (max-width: 640px) {
    .product-description-content {
      padding: 0;
      margin: 0;
    }
    
    .product-detail-editor .ql-container {
      font-size: 15px;
      overflow-x: auto;
    }
    
    .product-detail-editor .ql-editor {
      padding-left: 0;
      padding-right: 0;
    }
  }
`;

import useEmblaCarousel from "embla-carousel-react";
import {
  getRelatedProducts,
  getFrequentlyBoughtTogether,
  getRecentlyViewedProducts,
} from "@/lib/recommendation";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { calculateDiscountedPrice, getEffectiveDiscountPercentage } from "@/lib/discount";

interface ProductDetailProps {
  product: any;
  variants: any[];
  relatedProducts: any[];
  variantImages: any[];
  categoryDiscount?: number; // Add category discount prop
}

const ProductDetail = ({
  product,
  variants,
  relatedProducts,
  variantImages,
  categoryDiscount = 0, // Default to 0 if not provided
}: ProductDetailProps) => {
  // Add style tag for mobile-friendly product descriptions
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = productDetailStyles;
    style.id = 'product-detail-mobile-styles';
    
    if (!document.getElementById('product-detail-mobile-styles')) {
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.getElementById('product-detail-mobile-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const t = useTranslations("product");
  const locale = useLocale();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentImage, setCurrentImage] = useState<string>(
    product.image_url || "/placeholder.svg"
  );
  const [thumbnails, setThumbnails] = useState<string[]>([
    product.image_url || "/placeholder.svg",
  ]);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);

  // Setup Embla Carousel
  const [mainCarouselRef, mainCarouselApi] = useEmblaCarousel({ loop: true });
  const [thumbCarouselRef, thumbCarouselApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  // Group variants by variant name
  const variantGroups = variants.reduce((groups: any, variant: any) => {
    if (!groups[variant.variant_name]) {
      groups[variant.variant_name] = [];
    }
    groups[variant.variant_name].push(variant);
    return groups;
  }, {});

  // Store variant images map for quick lookup
  const [variantImageMap, setVariantImageMap] = useState<
    Record<number, string>
  >({});
  // Next and previous buttons for carousel
  const scrollPrev = useCallback(() => {
    if (mainCarouselApi) mainCarouselApi.scrollPrev();
  }, [mainCarouselApi]);

  const scrollNext = useCallback(() => {
    if (mainCarouselApi) mainCarouselApi.scrollNext();
  }, [mainCarouselApi]);

  // Sync main carousel with thumbnails
  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainCarouselApi || !thumbCarouselApi) return;
      mainCarouselApi.scrollTo(index);
      setSelectedThumbIndex(index);

      // Find variant by image if exists
      const thumbImage = thumbnails[index];

      // Find variant ID from the variantImageMap that matches this image
      const entries = Object.entries(variantImageMap);
      for (const [variantId, imageUrl] of entries) {
        if (imageUrl === thumbImage) {
          const variant = variants.find((v) => v.id === parseInt(variantId));
          if (variant) {
            setSelectedVariant(variant);
            return;
          }
        }
      }

      // If no matching variant, just keep the image selected
      setCurrentImage(thumbImage);
    },
    [mainCarouselApi, thumbCarouselApi, thumbnails, variantImageMap, variants]
  );
  // Handle main carousel scroll and sync thumbnails
  useEffect(() => {
    if (!mainCarouselApi || !thumbCarouselApi) return;

    const onSelect = () => {
      const index = mainCarouselApi.selectedScrollSnap();
      setSelectedThumbIndex(index);
      thumbCarouselApi.scrollTo(index);

      const selectedThumbImage =
        thumbnails[index] || product.image_url || "/placeholder.svg";
      setCurrentImage(selectedThumbImage);

      // When carousel changes, also try to select the corresponding variant if one exists
      const entries = Object.entries(variantImageMap);
      for (const [variantId, imageUrl] of entries) {
        if (imageUrl === selectedThumbImage) {
          const variant = variants.find((v) => v.id === parseInt(variantId));
          if (variant && variant.id !== selectedVariant?.id) {
            setSelectedVariant(variant);

            // Show a subtle toast notification for better UX
            try {
              window.dispatchEvent(
                new CustomEvent("toast", {
                  detail: {
                    title: t("variantSelected"),
                    description: variant.variant_value,
                    variant: "default",
                    duration: 2000,
                  }
                })
              );
            } catch (err) {
              if (err instanceof Error) {
                console.error("Error showing toast notification:", err.message);
              } else {
                console.error("Error showing toast notification");
              }
            }

            return;
          }
        }
      }
    };

    mainCarouselApi.on("select", onSelect);
    return () => {
      mainCarouselApi.off("select", onSelect);
    };
  }, [
    mainCarouselApi,
    thumbCarouselApi,
    thumbnails,
    product.image_url,
    variantImageMap,
    variants,
    selectedVariant,
    t,
  ]);

  // Handle variant selection
  useEffect(() => {
    if (selectedVariant) {
      // Find variant image if exists
      const variantImage = variantImages.find(
        (img) => img.variant_id === selectedVariant.id
      );

      if (variantImage) {
        setCurrentImage(variantImage.image_url);

        // Find the index of this image in thumbnails
        const index = thumbnails.findIndex(
          (thumb) => thumb === variantImage.image_url
        );
        if (index >= 0 && mainCarouselApi) {
          mainCarouselApi.scrollTo(index);
          setSelectedThumbIndex(index);
        }
      }
    }
  }, [selectedVariant, variantImages, thumbnails, mainCarouselApi]);

  // Initialize thumbnails and variant image map
  useEffect(() => {
    const images = [product.image_url || "/placeholder.svg"];
    const variantMap: Record<number, string> = {};

    // Add variant images to thumbnails
    if (variantImages && variantImages.length > 0) {
      const uniqueImages = new Set(images);
      variantImages.forEach((img: any) => {
        if (img.image_url) {
          uniqueImages.add(img.image_url);
          variantMap[img.variant_id] = img.image_url;
        }
      });
      setThumbnails(Array.from(uniqueImages) as string[]);
      setVariantImageMap(variantMap);
    } else {
      setThumbnails(images);
    }
  }, [product, variantImages]);
  // Calculate final price based on selected variant and discounts
  const calculatePrice = () => {
    const basePrice = selectedVariant
      ? product.base_price + selectedVariant.price_adjustment
      : product.base_price;

    // Use variant-specific discount if available, otherwise use product discount
    const discountPercentage = selectedVariant && selectedVariant.discount_percentage
      ? selectedVariant.discount_percentage
      : product.discount_percentage || 0;

    // Get the discount dates (variant-specific or product-level)
    const discountStartDate = selectedVariant && selectedVariant.discount_start_date
      ? selectedVariant.discount_start_date
      : product.discount_start_date;
      
    const discountEndDate = selectedVariant && selectedVariant.discount_end_date
      ? selectedVariant.discount_end_date 
      : product.discount_end_date;

    // Apply the higher of product or category discount, considering discount dates
    return calculateDiscountedPrice(
      basePrice,
      discountPercentage,
      categoryDiscount,
      discountStartDate,
      discountEndDate
    );
  };

  // Get the effective discount percentage (higher of product or category discount)
  const effectiveDiscountPercentage = getEffectiveDiscountPercentage(
    product.discount_percentage || 0,
    categoryDiscount,
    product.discount_start_date,
    product.discount_end_date
  );

  // Format price as currency
  const formattedPrice = formatCurrency(calculatePrice());

  // Original price without discount for comparison display
  const originalPrice = selectedVariant
    ? product.base_price + selectedVariant.price_adjustment
    : product.base_price;

  const formattedOriginalPrice = formatCurrency(originalPrice);

  // Check stock status
  const inStock = selectedVariant
    ? selectedVariant.stock > 0
    : product.in_stock > 0;
  const stockAmount = selectedVariant
    ? selectedVariant.stock
    : product.in_stock;

  // Handle add to cart
  const handleAddToCart = () => {
    const finalPrice = calculatePrice();

    addItem({
      id: Date.now(), // Unique ID for cart item
      product_id: product.id,
      variant_id: selectedVariant?.id,
      name: product.name,
      price: finalPrice,
      image_url: currentImage,
      quantity,
      variant_name: selectedVariant?.variant_name,
      variant_value: selectedVariant?.variant_value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images with Carousel */}
        <div className="space-y-4">
          {/* Main Carousel */}
          <div
            className="embla relative bg-gray-50 rounded-xl shadow-sm"
            ref={mainCarouselRef}
          >
            <div className="embla__container">
              {thumbnails.map((thumb, index) => (
                <div key={index} className="embla__slide">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={thumb || "/placeholder.svg"}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-4"
                      priority={index === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
            {thumbnails.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg z-10 hover:bg-gray-50 focus:bg-gray-50 transition-all duration-200 border border-gray-100"
                  aria-label="Previous image"
                  tabIndex={0}
                  disabled={
                    selectedThumbIndex === 0 &&
                    !mainCarouselApi?.canScrollPrev()
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span className="sr-only">{t("previousProductImage")}</span>
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg z-10 hover:bg-gray-50 focus:bg-gray-50 transition-all duration-200 border border-gray-100"
                  aria-label="Next image"
                  tabIndex={0}
                  disabled={
                    selectedThumbIndex === thumbnails.length - 1 &&
                    !mainCarouselApi?.canScrollNext()
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span className="sr-only">{t("nextProductImage")}</span>
                </button>
              </>
            )}
          </div>
          {/* Thumbnails Carousel */}
          {thumbnails.length > 1 && (
            <div className="embla embla-thumbs mt-4" ref={thumbCarouselRef}>
              <div className="embla__container">
                {thumbnails.map((thumb, index) => {
                  const hasVariant = Object.entries(variantImageMap).some(
                    ([_, imageUrl]) => imageUrl === thumb
                  );
                  const isSelected = index === selectedThumbIndex;

                  return (
                    <div
                      key={index}
                      className={`embla__slide embla__slide-thumb px-1 ${
                        isSelected ? "is-selected" : ""
                      }`}
                      style={{ flex: "0 0 20%" }}
                    >
                      <button
                        type="button"
                        className={`relative w-full aspect-square rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-30 shadow-md transform scale-105"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => onThumbClick(index)}
                        aria-label={`View product image ${index + 1}`}
                      >
                        <Image
                          src={thumb || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          sizes="100px"
                          className={`object-cover rounded-md transition-all ${
                            isSelected ? "scale-110" : "scale-100"
                          }`}
                        />
                        {hasVariant && (
                          <div
                            className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 flex items-center justify-center rounded-tl-md"
                            title="This color/variant has a dedicated image"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Product Information */}
        <div className="space-y-6">
          {/* Product name */}
          <h1 className="text-3xl font-semibold text-gray-900">
            {product.name}
          </h1>
          {/* Price */}
          <div>
            <div className="text-3xl font-bold text-black">
              {formattedPrice}
            </div>
            {effectiveDiscountPercentage > 0 && (
              <div className="text-sm text-gray-500">
                <span className="line-through">{formattedOriginalPrice}</span>{" "}
                <span className="text-green-600">
                  {t("discount", { percentage: effectiveDiscountPercentage })}
                </span>
              </div>
            )}
          </div>
          {/* Description */}
          <div className="prose prose-sm text-gray-600 max-w-none">
            {product.short_description ? (
              typeof product.short_description === "object" ? (
                <p>
                  {product.short_description[locale] ||
                    product.short_description.en ||
                    ""}
                </p>
              ) : (
                <p>{String(product.short_description)}</p>
              )
            ) : null}
          </div>
          {/* Stock Status */}
          {inStock ? (
            <div className="flex items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
              <span className="font-medium text-green-700">
                {stockAmount > 10
                  ? t("inStock")
                  : `${stockAmount} ${t("leftInStock")}`}
              </span>
            </div>
          ) : (
            <p className="text-red-600 font-medium">{t("outOfStock")}</p>
          )}
          {/* Display all variants grouped by type */}
          {Object.keys(variantGroups).length > 0 &&
            Object.entries(variantGroups).map(([variantName, values]) => {
              const variantValues = values as any[];
              return (
                <div key={variantName} className="mt-6">
                  <h3 className="text-base font-medium mb-3">
                    {t(`variantTypes.${variantName.toLowerCase()}`) ||
                      variantName}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {variantValues.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantImage = variantImages.find(
                        (img) => img.variant_id === variant.id
                      );
                      const hasImage = !!variantImage;

                      // For colors, show color buttons
                      if (variantName.toLowerCase().includes("color")) {
                        const colorName = variant.variant_value.toLowerCase();

                        // Try to map the color name to an actual CSS color
                        const colorMap: Record<string, string> = {
                          black: "#000000",
                          white: "#FFFFFF",
                          red: "#FF0000",
                          blue: "#0000FF",
                          green: "#00FF00",
                          silver: "#C0C0C0",
                          gold: "#FFD700",
                        };

                        const bgColor = colorMap[colorName] || colorName;

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            className={`relative h-10 w-10 rounded-full ${
                              isSelected
                                ? "ring-2 ring-black ring-offset-2"
                                : "border border-gray-300 hover:border-gray-600"
                            } transition-all duration-200 overflow-hidden`}
                            onClick={() => setSelectedVariant(variant)}
                            title={
                              t(
                                `variantValues.${variant.variant_value.toLowerCase()}`
                              ) || variant.variant_value
                            }
                            style={{
                              backgroundColor: hasImage ? undefined : bgColor,
                            }}
                          >
                            {hasImage ? (
                              <Image
                                src={
                                  variantImage.image_url || "/placeholder.svg"
                                }
                                alt={
                                  t(
                                    `variantValues.${variant.variant_value.toLowerCase()}`
                                  ) || variant.variant_value
                                }
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="sr-only">
                                {t(
                                  `variantValues.${variant.variant_value.toLowerCase()}`
                                ) || variant.variant_value}
                              </span>
                            )}
                          </button>
                        );
                      }
                      // For other variants (like size, material, etc.) show text buttons
                      else {
                        return (
                          <button
                            key={variant.id}
                            className={`h-10 min-w-[60px] px-4 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "border-black bg-black text-white"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <span className="text-sm font-medium">
                              {" "}
                              {t(
                                `variantValues.${variant.variant_value.toLowerCase()}`
                              ) || variant.variant_value}
                            </span>
                          </button>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          {/* Quantity & Add to cart */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex border border-gray-300 rounded-md">
              <button
                className="w-10 h-10 flex items-center justify-center border-r border-gray-300 hover:bg-gray-100 transition-colors"
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                <svg
                  width="12"
                  height="2"
                  viewBox="0 0 12 2"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1H11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-12 h-10 text-center border-0"
              />
              <button
                className="w-10 h-10 flex items-center justify-center border-l border-gray-300 hover:bg-gray-100 transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 1V11M1 6H11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock || (variants.length > 0 && !selectedVariant)}
              className="px-12 py-2.5 bg-black hover:bg-gray-800 text-white rounded-md transition-colors flex-grow sm:flex-grow-0"
              size="lg"
            >
              {t("addToCart")}
            </Button>
          </div>
        </div>
      </div>
      {/* Product Tabs */}
      <div className="mt-16 border-t pt-8">
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="border-b w-full bg-transparent">
            <TabsTrigger
              value="description"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black pb-3 data-[state=active]:shadow-none bg-transparent text-base font-medium data-[state=active]:text-black text-gray-500"
            >
              {t("description")}
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-black pb-3 data-[state=active]:shadow-none bg-transparent text-base font-medium data-[state=active]:text-black text-gray-500"
            >
              {t("details")}
            </TabsTrigger>
          </TabsList>          <TabsContent value="description" className="pt-6">
            <div className="prose max-w-none product-description-content">
              {product.description ? (
                <ReactQuillEditor
                  value={
                    typeof product.description === "object"
                      ? product.description[locale] || product.description.en || ""
                      : String(product.description)
                  }
                  setValue={() => {}}
                  isEditable={false}
                  className="bg-background product-detail-editor"
                />
              ) : (
                <p className="text-gray-500">{t("noDescription")}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-semibold mb-4 text-lg">{t("specifications")}</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    {product.brands && (
                      <tr className="border-b">
                        <td className="py-3 pr-8 text-gray-600">{t("brand")}</td>
                        <td className="py-3 font-medium">{product.brands.name}</td>
                      </tr>
                    )}
                    {product.categories && (
                      <tr className="border-b">
                        <td className="py-3 pr-8 text-gray-600">{t("category")}</td>
                        <td className="py-3 font-medium">{product.categories.name}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="py-3 pr-8 text-gray-600">{t("availability")}</td>
                      <td className="py-3 font-medium">
                        {inStock ? t("inStock") : t("outOfStock")}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-8 text-gray-600">{t("sku")}</td>
                      <td className="py-3 font-medium">
                        {selectedVariant?.sku || `PROD-${product.id}`}
                      </td>
                    </tr>
                    {product.attributes &&
                      Object.entries(product.attributes).map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="py-3 pr-8 text-gray-600">
                            {t(`attributeLabels.${key.toLowerCase()}`) || key}
                          </td>
                          <td className="py-3 font-medium">
                            {typeof value === "string"
                              ? t(`attributeValues.${value.toLowerCase()}`) || value
                              : String(value)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg">{t("shippingAndReturns")}</h3>
                <div className="space-y-4 text-gray-600">
                  <p>{t("freeShippingPolicy")}</p>
                  <p>{t("returnPolicy")}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>{" "}
      {/* Related Products Sections */}
      {relatedProducts && relatedProducts.length > 0 && (
        <>
          {/* Similar Products / You May Also Like Section */}{" "}
          <section className='mt-16 pt-12 border-t'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl font-semibold'>{t("similarProducts")}</h2>
              <Link
                href='/products'
                className='text-gray-700 hover:underline flex items-center gap-1 text-sm font-medium'
              >
                {t("viewAll")}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M5 12h14M12 5l7 7-7 7' />
                </svg>
              </Link>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6'>
              {/* Get enhanced recommendations using our algorithm */}
              {getRelatedProducts(product, relatedProducts, 5).map(
                (relatedProduct) => (
                  <div key={relatedProduct.id} className='group'>
                    <Link
                      href={`/products/${relatedProduct.id}`}
                      className='block'
                    >
                      <div className='aspect-square relative bg-gray-50 rounded-lg mb-3 overflow-hidden'>
                        <Image
                          src={relatedProduct.image_url || "/placeholder.svg"}
                          alt={relatedProduct.name}
                          fill
                          sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                          className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
                        />
                        {relatedProduct.in_stock < 5 &&
                          relatedProduct.in_stock > 0 && (
                            <div className='absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md font-medium'>
                              {String(
                                t("onlyLeft", {
                                  count: relatedProduct.in_stock,
                                })
                              )}
                            </div>
                          )}
                        {relatedProduct.in_stock === 0 && (
                          <div className='absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-medium'>
                            {t("outOfStock")}
                          </div>
                        )}
                      </div>
                      <h3 className='text-sm font-medium line-clamp-2 group-hover:text-gray-700'>
                        {relatedProduct.name}
                      </h3>
                      <div className='flex flex-wrap items-end justify-between mt-1'>
                        <p className='text-sm font-bold'>
                          {formatCurrency(relatedProduct.base_price)}
                        </p>
                        {relatedProduct.brands?.name && (
                          <span className='text-xs text-gray-500'>
                            {relatedProduct.brands?.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                )
              )}
            </div>
          </section>
          {/* Frequently Bought Together Section */}
          <section className='mt-16 pt-12 border-t'>
            <h2 className='text-2xl font-semibold mb-8'>
              {t("completeTheLook")}
            </h2>
            <div className='flex flex-wrap sm:flex-nowrap gap-6'>
              {/* Current Product + Recommended Products */}
              <div className='basis-full sm:basis-3/4'>
                <div className='flex items-center flex-wrap md:flex-nowrap gap-6'>
                  {/* Current Product */}
                  <div className='w-full md:w-1/3 bg-gray-50 rounded-lg p-6'>
                    <div className='relative aspect-square mb-3'>
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes='33vw'
                        className='object-contain p-4'
                      />
                    </div>
                    <div className='border-t pt-3 mt-3'>
                      <p className='text-sm text-gray-500 mb-1'>
                        {t("currentItem")}
                      </p>
                      <h3 className='font-medium line-clamp-2'>
                        {product.name}
                      </h3>
                      <p className='font-bold mt-2'>
                        {formatCurrency(calculatePrice())}
                      </p>
                    </div>
                  </div>

                  {/* Plus */}
                  <div className='hidden md:flex items-center justify-center'>
                    <span className='text-2xl font-bold text-gray-400'>+</span>
                  </div>

                  {/* Recommended Products Grid */}
                  <div className='w-full md:w-2/3'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {getFrequentlyBoughtTogether(
                        product.id,
                        relatedProducts,
                        2
                      ).map((item) => (
                        <div
                          key={item.id}
                          className='bg-gray-50 rounded-lg p-4'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='relative w-20 h-20 flex-shrink-0'>
                              <Image
                                src={item.image_url || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                sizes='80px'
                                className='object-contain'
                              />
                            </div>
                            <div className='flex-1'>
                              <h4 className='text-sm font-medium line-clamp-2'>
                                {item.name}
                              </h4>
                              <p className='font-bold mt-1'>
                                {formatCurrency(item.base_price)}
                              </p>{" "}
                              <Button
                                variant='outline'
                                size='sm'
                                className='mt-2 text-xs h-8 border-gray-300 hover:bg-gray-50'
                                onClick={() => {
                                  addItem({
                                    id: Date.now() + item.id,
                                    product_id: item.id,
                                    name: item.name,
                                    price: item.base_price,
                                    image_url:
                                      item.image_url || "/placeholder.svg",
                                    quantity: 1,
                                  });

                                  try {
                                    window.dispatchEvent(
                                      new CustomEvent("toast", {
                                        detail: {
                                          title: t("addedToCart"),
                                          description: `1x ${item.name}`,
                                          variant: "default",
                                          duration: 2000,
                                        }
                                      })
                                    );
                                  } catch (err) {
                                    if (err instanceof Error) {
                                      console.error("Error showing toast notification:", err.message);
                                    } else {
                                      console.error("Error showing toast notification");
                                    }
                                  }
                                }}
                              >
                                {t("addToCart")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bundle Price and Action */}
              <div className='basis-full sm:basis-1/4 bg-gray-900 text-white rounded-lg p-6'>
                {" "}
                <h3 className='font-medium mb-4'>{t("buyTheBundle")}</h3>
                <p className='text-sm text-gray-300 mb-1'>{t("totalPrice")}</p>
                <p className='text-xl font-bold mb-4'>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "EUR",
                  }).format(
                    calculatePrice() +
                      getFrequentlyBoughtTogether(
                        product.id,
                        relatedProducts,
                        2
                      ).reduce((total, item) => total + item.base_price, 0)
                  )}
                </p>
                <Button
                  className='w-full bg-white hover:bg-gray-100 text-gray-900 rounded-md'
                  onClick={() => {
                    // Add current product to cart
                    handleAddToCart();

                    // Add frequently bought together products
                    getFrequentlyBoughtTogether(
                      product.id,
                      relatedProducts,
                      2
                    ).forEach((item) => {
                      addItem({
                        id: Date.now() + item.id,
                        product_id: item.id,
                        name: item.name,
                        price: item.base_price,
                        image_url: item.image_url || "/placeholder.svg",
                        quantity: 1,
                      });
                    });

                    // Show success notification
                    try {
                      window.dispatchEvent(
                        new CustomEvent("toast", {
                          detail: {
                            title: t("bundleAddedToCart"),
                            description: t("product.allItemsAddedToCart"),
                            variant: "default",
                            duration: 3000,
                          }
                        })
                      );
                    } catch (err) {
                      if (err instanceof Error) {
                        console.error("Error showing toast notification:", err.message);
                      } else {
                        console.error("Error showing toast notification");
                      }
                    }
                  }}
                >
                  {t("addAllToCart")}
                </Button>
                <div className='mt-4 text-xs text-gray-300'>
                  <p>{t("bundleDiscount")}</p>
                </div>
              </div>
            </div>
          </section>{" "}
          {/* You Might Need Section - Accessories/Add-ons */}
          <section className='mt-16 pt-12 border-t'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl font-semibold'>{t("youMightNeed")}</h2>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
              {relatedProducts
                .filter(
                  (item) =>
                    // Filter for likely accessories - typically lower priced items in the same brand or compatible with same model
                    (item.brand_id === product.brand_id &&
                      item.base_price < product.base_price * 0.7) ||
                    (item.compatible_with_model_id ===
                      product.compatible_with_model_id &&
                      item.id !== product.id)
                )
                .slice(0, 4)
                .map((accessory) => (
                  <div
                    key={accessory.id}
                    className='bg-gray-50 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow'
                  >
                    <div className='relative w-20 h-20 flex-shrink-0 bg-white rounded-md'>
                      <Image
                        src={accessory.image_url || "/placeholder.svg"}
                        alt={accessory.name}
                        fill
                        sizes='80px'
                        className='object-contain p-2'
                      />
                    </div>
                    <div className='flex-1'>
                      <Link href={`/en/products/${accessory.id}`}>
                        <h3 className='text-sm font-medium mb-1 hover:text-blue-700'>
                          {accessory.name}
                        </h3>
                      </Link>
                      <p className='text-sm font-bold mb-2'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "EUR",
                        }).format(accessory.base_price)}
                      </p>{" "}
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-gray-300 hover:bg-gray-50 text-xs h-8'
                        onClick={() => {
                          addItem({
                            id: Date.now() + accessory.id,
                            product_id: accessory.id,
                            name: accessory.name,
                            price: accessory.base_price,
                            image_url:
                              accessory.image_url || "/placeholder.svg",
                            quantity: 1,
                          });

                          try {
                            window.dispatchEvent(
                              new CustomEvent("toast", {
                                detail: {
                                  title: t("addedToCart"),
                                  description: `1x ${accessory.name}`,
                                  variant: "default",
                                  duration: 2000,
                                }
                              })
                            );
                          } catch (err) {
                            if (err instanceof Error) {
                              console.error("Error showing toast notification:", err.message);
                            } else {
                              console.error("Error showing toast notification");
                            }
                          }
                        }}
                      >
                        {t("addToCart")}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </section>          {/* You May Also Like Section */}
          <section className='mt-16 pt-12 border-t'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl font-semibold'>{t("youMayAlsoLike")}</h2>
              <Link
                href='/products'
                className='text-gray-700 hover:underline flex items-center gap-1 text-sm font-medium'
              >
                {t("viewAll")}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M5 12h14M12 5l7 7-7 7' />
                </svg>
              </Link>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6'>
              {/* Get recommendations based on user behavior and product attributes */}
              {[...new Set([
                ...relatedProducts.filter(p => 
                  // Products with same brand but different category (accessories)
                  p.brand_id === product.brand_id && 
                  p.category_id !== product.category_id &&
                  p.id !== product.id
                ),
                ...relatedProducts.filter(p =>
                  // Products with similar price point in same category (alternatives)
                  p.category_id === product.category_id && 
                  p.id !== product.id &&
                  p.base_price >= product.base_price * 0.7 &&
                  p.base_price <= product.base_price * 1.3
                )
              ])].slice(0, 5).map(
                (recommendedProduct) => (
                  <div key={recommendedProduct.id} className='group'>
                    <Link
                      href={`/products/${recommendedProduct.id}`}
                      className='block'
                    >
                      <div className='aspect-square relative bg-gray-50 rounded-lg mb-3 overflow-hidden'>
                        <Image
                          src={recommendedProduct.image_url || "/placeholder.svg"}
                          alt={recommendedProduct.name}
                          fill
                          sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                          className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
                        />
                        {recommendedProduct.in_stock < 5 &&
                          recommendedProduct.in_stock > 0 && (
                            <div className='absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md font-medium'>
                              {t("product.onlyLeft", {
                                count: recommendedProduct.in_stock,
                              })}
                            </div>
                          )}
                        {recommendedProduct.in_stock === 0 && (
                          <div className='absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-medium'>
                            {t("outOfStock")}
                          </div>
                        )}
                      </div>
                      <h3 className='text-sm font-medium line-clamp-2 group-hover:text-gray-700'>
                        {recommendedProduct.name}
                      </h3>
                      <div className='flex flex-wrap items-end justify-between mt-1'>
                        <p className='text-sm font-bold'>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "EUR",
                          }).format(recommendedProduct.base_price)}
                        </p>
                        {recommendedProduct.brands?.name && (
                          <span className='text-xs text-gray-500'>
                            {recommendedProduct.brands.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Recently Viewed Section */}
          <section className='mt-16 pt-12 border-t'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl font-semibold'>{t("recentlyViewed")}</h2>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6'>
              {getRecentlyViewedProducts(product.id, relatedProducts, 5).map(
                (relatedProduct) => (
                  <div key={relatedProduct.id} className='group'>
                    <Link
                      href={`/en/products/${relatedProduct.id}`}
                      className='block'
                    >
                      <div className='aspect-square relative bg-gray-50 rounded-lg mb-3 overflow-hidden'>
                        <Image
                          src={relatedProduct.image_url || "/placeholder.svg"}
                          alt={relatedProduct.name}
                          fill
                          sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                          className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
                        />
                        {relatedProduct.in_stock < 5 &&
                          relatedProduct.in_stock > 0 && (
                            <div className='absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md font-medium'>
                              {t("product.onlyLeft", {
                                count: relatedProduct.in_stock,
                              })}
                            </div>
                          )}
                        {relatedProduct.in_stock === 0 && (
                          <div className='absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-md font-medium'>
                            {t("outOfStock")}
                          </div>
                        )}
                      </div>
                      <h3 className='text-sm font-medium line-clamp-2 group-hover:text-gray-700'>
                        {relatedProduct.name}
                      </h3>
                      <div className='flex flex-wrap items-end justify-between mt-1'>
                        <p className='text-sm font-bold'>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "EUR",
                          }).format(relatedProduct.base_price)}
                        </p>
                        {relatedProduct.brands?.name && (
                          <span className='text-xs text-gray-500'>
                            {relatedProduct.brands.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                )
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
