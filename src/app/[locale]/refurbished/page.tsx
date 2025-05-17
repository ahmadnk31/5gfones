"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addRefurbishedToCart } from "@/lib/cart";
import {toast} from 'sonner'
import Link from "next/link";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdvancedFilterPanel } from "@/components";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
  BadgeCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslations } from "next-intl";

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

interface RefurbishedProductImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
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
}

export default function RefurbishedProductsPage() {
  const [products, setProducts] = useState<RefurbishedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    RefurbishedProduct[]
  >([]);
  const [featuredProducts, setFeaturedProducts] = useState<
    RefurbishedProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedModels, setSelectedModels] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("2000");
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 12;

  const supabase = createClient();
  const searchParams = useSearchParams();
const t = useTranslations("app.refurbished");
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
          refurbished_product_images (id, image_url, is_primary)
        `
        )
        .eq("in_stock", true)
        .gt("in_stock", 0)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      // Find the highest price for the price range slider
      if (productsData && productsData.length > 0) {
        const highestPrice = Math.max(
          ...productsData.map((p) => p.refurbished_price)
        );
        const roundedPrice = Math.ceil(highestPrice / 100) * 100; // Round up to nearest 100
        setMaxPrice(roundedPrice.toString());
        setMinPrice("0");
      }

      // Get featured products
      const featured =
        productsData?.filter((product) => product.is_featured) || [];
      setFeaturedProducts(featured);

      // Fetch brands for filter
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");

      if (brandsError) throw brandsError;

      // Fetch categories for filter
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch device models for filter
      const { data: modelsData, error: modelsError } = await supabase
        .from("device_models")
        .select("id, name")
        .order("name");

      if (modelsError) throw modelsError;

      setProducts(productsData || []);
      setFilteredProducts(productsData || []);
      setBrands(brandsData || []);
      setCategories(categoriesData || []);
      setDeviceModels(modelsData || []);

      // Calculate total pages
      setTotalPages(Math.ceil((productsData?.length || 0) / productsPerPage));
      // Apply URL parameters if available
      const brandId = searchParams.get("brand");
      const categoryId = searchParams.get("category");
      const modelId = searchParams.get("model");
      const condition = searchParams.get("condition");

      if (brandId) setSelectedBrands([Number(brandId)]);
      if (categoryId) setSelectedCategories([Number(categoryId)]);
      if (modelId) setSelectedModels([Number(modelId)]);
      if (condition && ["excellent", "good", "fair"].includes(condition)) {
        setSelectedCondition(condition);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  // Apply filters when they change
  useEffect(() => {
    if (!products.length) return;

    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by condition
    if (selectedCondition !== "all") {
      filtered = filtered.filter(
        (product) => product.condition === selectedCondition
      );
    }

    // Filter by brands (if any selected)
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.brand_id && selectedBrands.includes(product.brand_id)
      );
    }

    // Filter by categories (if any selected)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.category_id && selectedCategories.includes(product.category_id)
      );
    }

    // Filter by compatible models (if any selected)
    if (selectedModels.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.compatible_with_model_id &&
          selectedModels.includes(product.compatible_with_model_id)
      );
    }

    // Filter by has_variations
    if (hasVariations !== null) {
      filtered = filtered.filter(
        (product) => product.has_variations === hasVariations
      );
    }

    // Filter by price range
    const minPriceValue = parseFloat(minPrice) || 0;
    const maxPriceValue = parseFloat(maxPrice) || Infinity;

    filtered = filtered.filter(
      (product) =>
        product.refurbished_price >= minPriceValue &&
        product.refurbished_price <= maxPriceValue
    );

    setFilteredProducts(filtered);

    // Update pagination
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
    setCurrentPage(1); // Reset to first page on filter change
  }, [
    products,
    searchQuery,
    selectedCondition,
    selectedBrands,
    selectedCategories,
    selectedModels,
    hasVariations,
    minPrice,
    maxPrice,
  ]);

  // Handle toggling categories, brands, and models
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleBrandToggle = (brandId: number) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleModelToggle = (modelId: number) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Apply filters
  const applyFilters = () => {
    // Filters are already applied via useEffect
    // Just close the drawer if it's open
    setIsFilterDrawerOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCondition("all");
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedModels([]);
    setHasVariations(null);
    setMinPrice("0");
    setMaxPrice(maxPrice);
  };

  // Get paginated products
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  // Add to cart function
  const handleAddToCart = (product: RefurbishedProduct) => {
    if (!product) return;

    // Get primary image if available
    const primaryImage = product.refurbished_product_images?.find(
      (img) => img.is_primary
    );
    const imageUrl = primaryImage
      ? primaryImage.image_url
      : product.refurbished_product_images &&
        product.refurbished_product_images.length > 0
      ? product.refurbished_product_images[0].image_url
      : null;

    addRefurbishedToCart(
      product.id,
      product.name,
      product.refurbished_price,
      1, // Default quantity
      imageUrl || undefined,
      product.condition
    );

    toast.success(t("addedToCart", {
      productName: product.name,
    }));
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Render filter badges for applied filters
  const renderFilterBadges = () => {
    const badges = [];

    // Condition badge
    if (selectedCondition !== "all") {
      badges.push(
        <Badge
          key="condition"
          variant="secondary"
          className="flex items-center gap-1"
          onClick={() => setSelectedCondition("all")}
        >
          Condition: {selectedCondition}
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
      );
    }

    // Variant badge
    if (hasVariations !== null) {
      badges.push(
        <Badge
          key="variations"
          variant="secondary"
          className="flex items-center gap-1"
          onClick={() => setHasVariations(null)}
        >
          {hasVariations ? "With Variants" : "Without Variants"}
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
      );
    }

    // Brand badges
    selectedBrands.forEach((brandId) => {
      const brand = brands.find((b) => b.id === brandId);
      if (brand) {
        badges.push(
          <Badge
            key={`brand-${brandId}`}
            variant="secondary"
            className="flex items-center gap-1"
            onClick={() => handleBrandToggle(brandId)}
          >
            {brand.name}
            <X className="h-3 w-3 cursor-pointer" />
          </Badge>
        );
      }
    });

    // Category badges
    selectedCategories.forEach((categoryId) => {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        badges.push(
          <Badge
            key={`category-${categoryId}`}
            variant="secondary"
            className="flex items-center gap-1"
            onClick={() => handleCategoryToggle(categoryId)}
          >
            {category.name}
            <X className="h-3 w-3 cursor-pointer" />
          </Badge>
        );
      }
    });

    // Model badges
    selectedModels.forEach((modelId) => {
      const model = deviceModels.find((m) => m.id === modelId);
      if (model) {
        badges.push(
          <Badge
            key={`model-${modelId}`}
            variant="secondary"
            className="flex items-center gap-1"
            onClick={() => handleModelToggle(modelId)}
          >
            {model.name}
            <X className="h-3 w-3 cursor-pointer" />
          </Badge>
        );
      }
    });

    // Price range badge
    if (minPrice !== "0" || maxPrice !== "2000") {
      badges.push(
        <Badge
          key="price-range"
          variant="secondary"
          className="flex items-center gap-1"
          onClick={() => {
            setMinPrice("0");
            setMaxPrice("2000");
          }}
        >
          Price: ${minPrice} - ${maxPrice}
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
      );
    }

    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-4">
        {badges}
        {badges.length > 0 && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 cursor-pointer"
            onClick={clearFilters}
          >
            Clear all filters
            <X className="h-3 w-3" />
          </Badge>
        )}
      </div>
    ) : null;
  };

  // Get condition badge
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return (
          <Badge variant="default" className="bg-green-600">
            Excellent
          </Badge>
        );
      case "good":
        return (
          <Badge variant="default" className="bg-blue-600">
            Good
          </Badge>
        );
      case "fair":
        return (
          <Badge variant="default" className="bg-amber-600">
            Fair
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get primary image URL or default
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Refurbished Devices
        </h1>
        <p className="mt-2 text-muted-foreground">
          Quality refurbished devices at the best prices. All products come with
          a warranty.
        </p>
      </div>

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Featured Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <Card key={product.id} className="overflow-hidden group">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <BadgeCheck className="h-5 w-5 text-blue-500 bg-white rounded-full p-0.5" />
                    {getConditionBadge(product.condition)}
                  </div>
                  {product.discount_percentage > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2"
                    >
                      {product.discount_percentage}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.brand?.name}{" "}
                        {product.compatible_with_model?.name
                          ? `- ${product.compatible_with_model.name}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {formatPrice(product.refurbished_price)}
                      </span>
                      {product.discount_percentage > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.warranty_months} month warranty
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Link href={`/refurbished/${product.id}`}>
                    <Button variant="outline">View details</Button>
                  </Link>
                  <Button onClick={() => handleAddToCart(product)}>
                    <ShoppingCartIcon className="mr-2 h-4 w-4" /> Add to cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Filter Button and Search */}
      <div className="lg:hidden mb-6">
        <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 mb-4 w-full"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <AdvancedFilterPanel
                categories={categories}
                brands={brands}
                deviceModels={deviceModels}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedModels={selectedModels}
                minPrice={minPrice}
                maxPrice={maxPrice}
                condition={selectedCondition}
                hasVariations={hasVariations}
                onCategoryToggle={handleCategoryToggle}
                onBrandToggle={handleBrandToggle}
                onModelToggle={handleModelToggle}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
                onConditionChange={setSelectedCondition}
                onHasVariationsChange={setHasVariations}
                onApplyFilters={applyFilters}
                onResetFilters={clearFilters}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Display applied filter badges */}
        {renderFilterBadges()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden lg:block">
          <AdvancedFilterPanel
            categories={categories}
            brands={brands}
            deviceModels={deviceModels}
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            selectedModels={selectedModels}
            minPrice={minPrice}
            maxPrice={maxPrice}
            condition={selectedCondition}
            hasVariations={hasVariations}
            onCategoryToggle={handleCategoryToggle}
            onBrandToggle={handleBrandToggle}
            onModelToggle={handleModelToggle}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onConditionChange={setSelectedCondition}
            onHasVariationsChange={setHasVariations}
            onApplyFilters={applyFilters}
            onResetFilters={clearFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  Showing {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}
                </p>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="discount">Biggest Discounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show filter badges on desktop */}
              <div className="hidden lg:block">
                {renderFilterBadges()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={getPrimaryImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {getConditionBadge(product.condition)}
                        {product.has_variations && (
                          <Badge variant="secondary" className="bg-purple-600">
                            Variants
                          </Badge>
                        )}
                      </div>
                      {product.discount_percentage > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute top-2 left-2"
                        >
                          {product.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.brand?.name}{" "}
                            {product.compatible_with_model?.name
                              ? `- ${product.compatible_with_model.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {formatPrice(product.refurbished_price)}
                          </span>
                          {product.discount_percentage > 0 && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.warranty_months} month warranty
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Link href={`/refurbished/${product.id}`}>
                        <Button variant="outline">View details</Button>
                      </Link>
                      <Button onClick={() => handleAddToCart(product)}>
                        <ShoppingCartIcon className="mr-2 h-4 w-4" /> Add to
                        cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        aria-disabled={currentPage === 1}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                      />
                    </PaginationItem>

                    {/* Show up to 5 page numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                      // For first 5 pages or last 5 pages
                      let pageNum: number;
                      if (totalPages <= 5 || currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={currentPage === pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        aria-disabled={currentPage === totalPages}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
