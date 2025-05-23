"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Tag, Clock, PercentIcon, ShoppingBag } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-provider";

// Define types
interface CategoryDiscount {
  id: number;
  category_id: number;
  category_name: string;
  discount_percentage: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_id: number;
  discount_percentage: number;
  final_price: number;
  in_stock: number;
}

interface RefurbishedProduct {
  id: number;
  name: string;
  original_price: number;
  refurbished_price: number;
  image_url: string;
  description: string;
  category_id: number;
  discount_percentage: number;
  in_stock: number;
  condition: string;
}

export default function OffersPage() {
  const t = useTranslations("offers");
  const commonT = useTranslations("common");
  const locale = commonT("locale") || "en";
  const supabase = createClient();
  const { addItem } = useCart();

  // State
  const [categoryDiscounts, setCategoryDiscounts] = useState<CategoryDiscount[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [refurbishedDeals, setRefurbishedDeals] = useState<RefurbishedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "en" ? "en-US" : "es-ES",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Fetch offers data
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        // Get active category discounts
        const { data: discountData, error: discountError } = await supabase
          .from("category_discounts")
          .select("*, categories(name)")
          .eq("is_active", true)
          .lte("start_date", new Date().toISOString())
          .or(`end_date.gt.${new Date().toISOString()},end_date.is.null`);
          
        if (discountError) throw discountError;

        const formattedDiscounts: CategoryDiscount[] = discountData.map(item => ({
          id: item.id,
          category_id: item.category_id,
          category_name: item.categories.name,
          discount_percentage: item.discount_percentage,
          is_active: item.is_active,
          start_date: item.start_date,
          end_date: item.end_date,
          description: item.description
        }));
        
        setCategoryDiscounts(formattedDiscounts);
        
        // Get products with discounts
        let productPromises = [];
        
        // Regular products with category discounts
        if (formattedDiscounts.length > 0) {
          const categoryIds = formattedDiscounts.map(d => d.category_id);
          
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("category_id", categoryIds)
            .gt("in_stock", 0)
            .limit(8);
            
          if (productsError) throw productsError;
          
          const discountedProducts = productsData.map(product => {
            const categoryDiscount = formattedDiscounts.find(
              d => d.category_id === product.category_id
            );
            const discountPercentage = categoryDiscount?.discount_percentage || 0;
            const finalPrice = product.price * (1 - discountPercentage / 100);
            
            return {
              ...product,
              discount_percentage: discountPercentage,
              final_price: finalPrice
            };
          });
          
          setFeaturedProducts(discountedProducts);
        }
        
        // Refurbished products with discounts
        const { data: refurbishedData, error: refurbishedError } = await supabase
          .from("refurbished_products")
          .select("*")
          .gt("discount_percentage", 0)
          .gt("in_stock", 0)
          .limit(8);
          
        if (refurbishedError) throw refurbishedError;
        
        setRefurbishedDeals(refurbishedData);
        
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [supabase]);
  // Add product to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: Date.now(), // Generate a unique id
      product_id: product.id,
      name: product.name,
      price: product.final_price,
      quantity: 1,
      image_url: product.image_url
    });
  };
  // Add refurbished product to cart
  const handleAddRefurbishedToCart = (product: RefurbishedProduct) => {
    const discountedPrice = product.refurbished_price * (1 - product.discount_percentage / 100);
    
    addItem({
      id: Date.now(), // Generate a unique id
      product_id: product.id,
      name: product.name,
      price: discountedPrice,
      quantity: 1,
      image_url: product.image_url,
      // Add a variant_name property to indicate this is a refurbished product
      variant_name: "condition",
      variant_value: product.condition
    });
  };

  // Filter items based on active tab
  const filteredDiscounts = activeTab === "all" ? categoryDiscounts : 
    categoryDiscounts.filter(discount => {
      const daysRemaining = getDaysRemaining(discount.end_date);
      if (activeTab === "ending-soon" && daysRemaining !== null && daysRemaining <= 3) {
        return true;
      }
      if (activeTab === "best-deals" && discount.discount_percentage >= 15) {
        return true;
      }
      return false;
    });

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>
      
      {/* Filter tabs */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-8"
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="all">{t("allOffers")}</TabsTrigger>
            <TabsTrigger value="ending-soon">{t("endingSoon")}</TabsTrigger>
            <TabsTrigger value="best-deals">{t("bestDeals")}</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-100 relative">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Category Discounts Section */}
          {filteredDiscounts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{t("categoryDiscounts")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDiscounts.map((discount) => {
                  const daysRemaining = getDaysRemaining(discount.end_date);
                  
                  return (
                    <Card key={discount.id} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-white flex items-center gap-2">
                            <PercentIcon className="h-5 w-5" />
                            {discount.discount_percentage}% {t("off")}
                          </CardTitle>
                          {daysRemaining !== null && daysRemaining <= 3 && (
                            <Badge variant="destructive" className="bg-red-500 border-red-500">
                              {t("endsIn", { days: daysRemaining })}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-white/80 flex items-center gap-1">
                          <Tag className="h-4 w-4" /> {discount.category_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {t("validFrom")} {formatDate(discount.start_date)}
                            {discount.end_date ? ` ${t("to")} ${formatDate(discount.end_date)}` : ""}
                          </span>
                        </div>
                        {discount.description && (
                          <p className="text-sm mt-2">{discount.description}</p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link 
                          href={`/${locale}/categories/${discount.category_id}`} 
                          className="w-full"
                        >
                          <Button variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700">
                            {t("shopCategory")}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Featured Products Section */}
          {featuredProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{t("discountedProducts")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="relative h-48 bg-gray-50">
                      <Image
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-contain p-4"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500 text-white border-red-500">
                          -{product.discount_percentage}%
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <Link 
                        href={`/${locale}/products/${product.id}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                      </Link>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-emerald-600">
                          {formatCurrency(product.final_price)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        {t("addToCart")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Link href={`/${locale}/products`}>
                  <Button variant="outline">
                    {t("viewAllProducts")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Refurbished Deals Section */}
          {refurbishedDeals.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{t("refurbishedDeals")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {refurbishedDeals.map((product) => {
                  const discountedPrice = product.refurbished_price * (1 - product.discount_percentage / 100);
                  
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative h-48 bg-gray-50">
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-contain p-4"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white border-red-500">
                            -{product.discount_percentage}%
                          </Badge>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className={
                            product.condition === "excellent" ? "bg-emerald-500 border-emerald-500" :
                            product.condition === "good" ? "bg-blue-500 border-blue-500" :
                            "bg-amber-500 border-amber-500"
                          }>
                            {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <Link 
                          href={`/${locale}/refurbished/${product.id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                        </Link>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-emerald-600">
                            {formatCurrency(discountedPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.refurbished_price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">
                            {t("originalPrice")}:
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.original_price)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => handleAddRefurbishedToCart(product)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          {t("addToCart")}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-center mt-6">
                <Link href={`/${locale}/refurbished`}>
                  <Button variant="outline">
                    {t("viewAllRefurbished")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {filteredDiscounts.length === 0 && featuredProducts.length === 0 && refurbishedDeals.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">{t("noOffersAvailable")}</h3>
              <p className="text-muted-foreground mb-6">{t("checkBackLater")}</p>
              <Link href={`/${locale}/products`}>
                <Button>
                  {t("browseProducts")}
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
