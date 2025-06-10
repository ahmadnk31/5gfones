"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-provider";
import { usePathname } from "next/navigation";
import { calculateDiscountedPrice, hasDiscount, getEffectiveDiscountPercentage } from "@/lib/discount";

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  hasVariants?: boolean;
  brandName?: string | undefined;
  productDiscount?: number; // Product specific discount percentage
  categoryDiscount?: number; // Category specific discount percentage
}

// Cart item type
interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string | undefined;
  quantity: number;
}

const ProductCard = ({
  id,
  name,
  price,
  imageUrl,
  inStock,
  hasVariants = false,
  brandName,
  productDiscount = 0,
  categoryDiscount = 0,
}: ProductCardProps) => {
  const t = useTranslations("product");
  const { addItem } = useCart();
  
  // Calculate if there's any discount (product or category)
  const hasAnyDiscount = hasDiscount(productDiscount, categoryDiscount);
  
  // Get the higher discount percentage
  const effectiveDiscount = getEffectiveDiscountPercentage(productDiscount, categoryDiscount);
  
  // Calculate the discounted price
  const finalPrice = hasAnyDiscount 
    ? calculateDiscountedPrice(price, productDiscount, categoryDiscount)
    : price;
  
  // Determine if the effective discount is from the category
  const isDiscountFromCategory = categoryDiscount > 0 && categoryDiscount >= productDiscount;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();  // Stop event from bubbling up to the Link

    // If product has variants, don't add directly to cart - redirect to product detail
    if (hasVariants) return;

    // Add product to cart with the discounted price
    addItem({
      id: Date.now(), // Unique ID for the cart item
      product_id: typeof id === "string" ? parseInt(id, 10) : id,
      name,
      price: finalPrice,
      image_url: imageUrl || undefined,
      quantity: 1,
    });

    // Add toast notification for better UX
    try {
      // Using the toast from sonner (imported in providers)
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            title: t("addedToCart"),
            description: `1x ${name}`,
            variant: "default",
            duration: 3000,
          },
        })
      );
    } catch (error) {
      console.error("Error showing toast notification", error);
    }
  };

  // Format price as currency
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(finalPrice);
    // Format original price for display when discounted
  const formattedOriginalPrice = hasAnyDiscount 
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(price)
    : "";

  // Calculate and format the discount amount (money saved)
  const discountAmount = hasAnyDiscount ? price - finalPrice : 0;
  const formattedDiscountAmount = hasAnyDiscount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
      }).format(discountAmount)
    : "";

  // Get the current locale from the URL
  const pathname = usePathname();
  const locale = pathname.split("/")[1];return (
    <Link href={`/${locale}/products/${id}`} className='block h-full w-full'>
      <Card className={`group overflow-hidden rounded-2xl border transition-all duration-300 h-full flex flex-col bg-white hover:transform hover:-translate-y-1 ${
        hasAnyDiscount
          ? 'border-red-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-100'
          : 'border-gray-200 hover:border-blue-200 hover:shadow-lg'
      }`}>
        <div className='relative aspect-square overflow-hidden bg-gray-50 p-3'>
          <div className='absolute inset-0 bg-gradient-to-b from-gray-50 to-transparent opacity-60 z-0'></div>
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            className='object-contain transition-all duration-500 group-hover:scale-110 z-10'
          />
          {brandName && (
            <Badge className='absolute top-3 left-3 bg-white text-black border shadow-sm z-20'>
              {brandName}
            </Badge>
          )}          {hasVariants && !hasAnyDiscount && (
            <Badge className='absolute top-3 right-3 bg-blue-100 text-blue-800 border border-blue-200 shadow-sm z-20'>
              {t("variants")}
            </Badge>
          )}          {hasAnyDiscount && (
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
              <Badge className='bg-red-500 text-white shadow-sm'>
                -{effectiveDiscount}%
              </Badge>
              <Badge className='bg-blue-500 text-white shadow-sm text-xs'>
                {formattedDiscountAmount}
              </Badge>
            </div>
          )}
          {!inStock && (
            <div className='absolute inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-30'>
              <div className='bg-white text-red-600 px-4 py-1.5 rounded-md font-semibold transform -rotate-6 shadow-lg'>
                {t("outOfStock")}
              </div>
            </div>
          )}
        </div>        <CardContent className='p-4 flex-grow'>
          <h3 className='font-semibold text-lg line-clamp-2 transition-colors text-blue-700 group-hover:text-blue-800'>
            {name}
          </h3>
          <div className='mt-2'>
            {hasAnyDiscount ? (
              <div className='space-y-1'>                <div className="flex items-baseline gap-2">
                  <p className='text-sm text-gray-500 line-through'>
                    {formattedOriginalPrice}
                  </p>
                  <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">
                    -{effectiveDiscount}%
                  </span>
                </div>
                <p className='text-xl font-bold text-red-600 flex items-baseline'>
                  {formattedPrice}
                  {hasVariants && (
                    <span className='text-xs text-gray-500 ml-2'>
                      {t("fromPrice")}
                    </span>
                  )}
                </p><div className='flex flex-wrap gap-1'>
                  <p className='text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md border border-green-200'>
                    {isDiscountFromCategory ? t("categoryDiscount") : t("productDiscount")} -{effectiveDiscount}%
                  </p>
                  <p className='text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-200'>
                    {t("youSave")} <span className="font-bold">{formattedDiscountAmount}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className='text-xl font-bold text-blue-600 flex items-baseline'>
                {formattedPrice}
                {hasVariants && (
                  <span className='text-xs text-gray-500 ml-2'>
                    {t("fromPrice")}
                  </span>
                )}
              </p>
            )}
          </div>
          {inStock && (
            <p className='text-sm mt-2 flex items-center'>
              <span className='w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5 animate-pulse'></span>
              <span className='text-green-700 font-medium'>
                {inStock ? t("inStock") : `${inStock} ${t("leftInStock")}`}
              </span>
            </p>
          )}
        </CardContent>
        <CardFooter className='flex justify-between items-center p-4 pt-0'>
          {inStock ? (            <div className='flex w-full gap-2'>              {hasVariants ? (
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full rounded-full font-medium transition-all duration-200 hover:bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300'
                >
                  {t("viewDetails")}
                </Button>
              ) : (
                <Button
                  size='sm'
                  className='w-full rounded-full shadow-sm hover:shadow transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                  onClick={handleAddToCart}
                >
                  <svg
                    className='w-4 h-4 mr-2'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M9 20C9 21.1 8.1 22 7 22C5.9 22 5 21.1 5 20C5 18.9 5.9 18 7 18C8.1 18 9 18.9 9 20ZM17 18C15.9 18 15 18.9 15 20C15 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18ZM7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L21.16 4.96L19.42 4H19.41L18.31 6L15.55 11H8.53L8.4 10.73L6.16 6L5.21 4L4.27 2H1V4H3L6.6 11.59L5.25 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.29 15 7.17 14.89 7.17 14.75Z'
                      fill='currentColor'
                    />
                  </svg>
                  {t("addToCart")}
                </Button>
              )}
            </div>
          ) : (
            <Button
              size='sm'
              variant='outline'
              className='w-full rounded-full border-gray-200 text-gray-500'
              disabled
            >
              {t("notifyMe")}
            </Button>          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
