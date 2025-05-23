"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-provider";
import { Button } from "@/components/ui/button";
import { Trash, Plus, Minus, ShoppingBag, X, ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CartSheet() {
  const t = useTranslations("cart");
  const commonT = useTranslations("common");
  const locale = commonT("locale") || "en";
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  
  // Calculate shipping, tax and total
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const taxAmount = subtotal * 0.08;
  const totalAmount = subtotal + shippingCost + taxAmount;
  
  // Format currency based on locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button 
          className="relative cursor-pointer bg-transparent border-none p-0 flex items-center" 
          aria-label={`${t("title")} (${itemCount} ${itemCount === 1 ? t("itemCount", { count: 1 }) : t("itemCount", { count: itemCount })})`}
        >
          <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-gray-900" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row justify-between items-center">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("empty")}</h2>
            <p className="text-gray-500 mb-6">{t("continueShoppingText")}</p>
            <Link href={`/${locale}/products`}>
              <Button>{t("continueShoppingBtn")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <Separator className="my-4" />            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.product_id}-${item.variant_id || "no-variant"}`} 
                    className="flex items-start space-x-3 pb-4 border-b border-gray-200"
                  >
                    <Link 
                      href={`/${locale}/products/${item.product_id}`} 
                      className="w-16 h-16 relative flex-shrink-0"
                    >
                      <Image
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <Link 
                          href={`/${locale}/products/${item.product_id}`}
                          className="font-medium text-sm line-clamp-2 hover:text-emerald-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-gray-500 hover:text-red-500"
                          onClick={() => removeItem(item.product_id, item.variant_id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.variant_name && (
                        <p className="text-xs text-gray-600">
                          {item.variant_name}: {item.variant_value}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1), item.variant_id)}
                            className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100"
                            aria-label={`Decrease ${item.name} quantity`}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 py-0.5 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                            className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-600">{formatCurrency(item.price)}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
              <div className="py-4 space-y-4">
              <Separator />
              
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm">{t("subtotal")}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>{t("shipping")}</span>
                  <span>{shippingCost === 0 ? (locale === 'en' ? 'Free' : 'Gratis') : formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>{t("tax")}</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <span>{t("total")}</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Link href={`/${locale}/cart`} className="w-full">
                  <Button variant="outline" className="w-full">
                    {locale === 'en' ? 'View Cart' : 'Ver Carrito'}
                  </Button>
                </Link>
                <Link href={`/${locale}/checkout`} className="w-full">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {t("checkout")}
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>  );
}
