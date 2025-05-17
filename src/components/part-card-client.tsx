"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProductVariant {
  id: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock: number;
  sku: string | null;
}

interface ProductWithVariants {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  in_stock: number;
  variants: ProductVariant[];
}

interface PartCardClientProps {
  part: {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    base_price: number;
    in_stock: number;
    categories: {
      id: number;
      name: string;
    } | null;
  };
  locale: string;
  modelId?: number;
  translations: {
    scheduleRepair?: string;
    addToCart?: string;
    inStock?: string;
    outOfStock?: string;
    selectVariant?: string;
    close?: string;
    addedToCart?: string;
    errorAddingToCart?: string;
  };
  scheduleRepairMode: boolean;
}

export default function PartCardClient({
  part,
  locale,
  modelId,
  translations,
  scheduleRepairMode,
}: PartCardClientProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);

  // Internal format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const supabase = createClient(); // Fetch product variants when dialog is opened
  useEffect(() => {
    if (open && !product) {
      fetchProductWithVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  const fetchProductWithVariants = async () => {
    setLoading(true);
    try {
      // Fetch variants
      const { data: variants, error } = await supabase
        .from("product_variants")
        .select("id, variant_name, variant_value, price_adjustment, stock, sku")
        .eq("product_id", part.id);

      if (error) throw error;

      setProduct({
        ...part,
        variants: variants || [],
      });

      // If there's only one variant, select it automatically
      if (variants && variants.length === 1) {
        setSelectedVariant(variants[0]);
      }
    } catch (err) {
      console.error("Error fetching product variants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    try {
      if (selectedVariant) {
        // Add product with selected variant
        addItem({
          id: Date.now(), // Unique cart item ID
          product_id: part.id,
          variant_id: selectedVariant.id,
          name: part.name,
          price: part.base_price + selectedVariant.price_adjustment,
          image_url: part.image_url || undefined,
          quantity: quantity,
          variant_name: selectedVariant.variant_name,
          variant_value: selectedVariant.variant_value,
        });
      } else {
        // Add product without variant
        addItem({
          id: Date.now(), // Unique cart item ID
          product_id: part.id,
          name: part.name,
          price: part.base_price,
          image_url: part.image_url || undefined,
          quantity: quantity,
        });
      }
      toast.success(`${translations.addedToCart || "Added to cart"}`);

      setOpen(false);
      setQuantity(1);
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(
        `${translations.errorAddingToCart || "Error adding to cart"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCart = async () => {
    // If product has variants, open dialog
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", part.id)
      .limit(1);

    if (error) {
      console.error("Error checking variants:", error);
    }

    if (variants && variants.length > 0) {
      setOpen(true);
    } else {
      // If no variants, add directly to cart
      handleAddToCart();
    }
  };

  const increaseQuantity = () => {
    const max = selectedVariant ? selectedVariant.stock : part.in_stock;
    if (quantity < max) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Calculate price based on selected variant
  const calculatePrice = () => {
    if (selectedVariant) {
      return part.base_price + selectedVariant.price_adjustment;
    }
    return part.base_price;
  };

  // Check if product is in stock
  const isInStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock > 0;
    }
    return part.in_stock > 0;
  };

  return (
    <>
      {scheduleRepairMode ? (
        <Link
          href={`/${locale}/repair/schedule?model=${modelId}&part=${part.id}`}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex justify-center items-center'
        >
          {translations.scheduleRepair || "Schedule Repair"}
        </Link>
      ) : (
        <Button
          variant='outline'
          className='w-full'
          disabled={part.in_stock <= 0}
          onClick={handleOpenCart}
        >
          <ShoppingCart className='h-4 w-4 mr-2' />
          {translations.addToCart || "Add to Cart"}
        </Button>
      )}

      {/* Product Variants Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>{part.name}</DialogTitle>
            <DialogDescription>
              {part.description || "Select options for this product"}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-6 py-4'>
            {/* Product Image */}
            <div className='flex justify-center'>
              <div className='h-40 w-40 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden'>
                {part.image_url ? (
                  <Image
                    src={part.image_url}
                    alt={part.name}
                    width={160}
                    height={160}
                    className='object-contain max-h-full'
                  />
                ) : (
                  <div className='text-gray-400'>No image</div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className='text-center py-4'>Loading options...</div>
            )}

            {/* Variant Selection */}
            {product && product.variants.length > 0 && (
              <div>
                <h4 className='text-sm font-medium mb-3'>
                  {translations.selectVariant || "Select Option"}:
                </h4>
                <RadioGroup
                  value={selectedVariant?.id.toString()}
                  onValueChange={(value) => {
                    const variant = product.variants.find(
                      (v) => v.id.toString() === value
                    );
                    setSelectedVariant(variant || null);
                    setQuantity(1); // Reset quantity when variant changes
                  }}
                >
                  <div className='grid gap-2'>
                    {product.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`flex items-center justify-between border rounded-md p-3 ${
                          variant.stock <= 0 ? "opacity-60" : ""
                        }`}
                      >
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem
                            value={variant.id.toString()}
                            id={`variant-${variant.id}`}
                            disabled={variant.stock <= 0}
                          />
                          <Label
                            htmlFor={`variant-${variant.id}`}
                            className='cursor-pointer flex-1'
                          >
                            {variant.variant_value}
                            {variant.price_adjustment !== 0 && (
                              <span className='ml-1 text-gray-500'>
                                ({variant.price_adjustment > 0 ? "+" : ""}
                                {formatCurrency(variant.price_adjustment)})
                              </span>
                            )}
                          </Label>
                        </div>
                        <div
                          className={`text-sm ${
                            variant.stock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {variant.stock > 0
                            ? translations.inStock || "In Stock"
                            : translations.outOfStock || "Out of Stock"}
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Price and Quantity */}
            <div className='flex justify-between items-center border-t pt-4'>
              <div className='font-bold text-xl'>
                {formatCurrency(calculatePrice())}
              </div>

              <div className='flex items-center'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8 rounded-r-none'
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <div className='h-8 px-3 flex items-center justify-center border-y'>
                  {quantity}
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8 rounded-l-none'
                  onClick={increaseQuantity}
                  disabled={
                    quantity >=
                    (selectedVariant ? selectedVariant.stock : part.in_stock)
                  }
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setOpen(false)}
              className='mt-2 sm:mt-0'
            >
              {translations.close || "Close"}
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={
                !isInStock() ||
                (product && product.variants.length > 0 && !selectedVariant)
              }
            >
              <ShoppingCart className='h-4 w-4 mr-2' />
              {translations.addToCart || "Add to Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
