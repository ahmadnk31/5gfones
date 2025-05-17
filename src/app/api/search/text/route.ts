import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API handler for text-based search
 * This provides a fallback when vector search is unavailable
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const {
      queryText,
      limit = 16,
      offset = 0,
      filters = {},
    } = await request.json();

    if (!queryText || typeof queryText !== "string") {
      return NextResponse.json(
        { error: "Query text is required" },
        { status: 400 }
      );
    }

    // Initialize the server-side Supabase client
    const supabase = createClient();

    // Build the query
    let query = supabase
      .from("products")
      .select(
        "id, name, description, base_price, image_url, in_stock, brands(name)",
        { count: "exact" }
      )
      .textSearch("name", queryText, {
        type: "websearch",
        config: "english",
      });

    // Apply filters
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query = query.in("category_id", filters.categoryIds);
    }

    if (filters.brandIds && filters.brandIds.length > 0) {
      query = query.in("brand_id", filters.brandIds);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("base_price", filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("base_price", filters.maxPrice);
    }

    if (filters.inStockOnly) {
      query = query.gt("in_stock", 0);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "priceAsc":
          query = query.order("base_price", { ascending: true });
          break;
        case "priceDesc":
          query = query.order("base_price", { ascending: false });
          break;
        case "nameAsc":
          query = query.order("name", { ascending: true });
          break;
        case "nameDesc":
          query = query.order("name", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        default:
          // Default sort by relevance is handled by text search
          break;
      }
    }

    // Execute the query
    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Error searching products", details: error },
        { status: 500 }
      );
    }

    // Get variant counts for each product
    const variantCounts = await Promise.all(
      products.map(async (product) => {
        const { count } = await supabase
          .from("product_variants")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id);

        return { id: product.id, count: count || 0 };
      })
    );

    // Map the products with variant counts
    const productsWithCounts = products.map((product) => {
      const variantInfo = variantCounts.find((v) => v.id === product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        base_price: product.base_price,
        image_url: product.image_url,
        in_stock: product.in_stock,
        brands: product.brands,
        variant_count: variantInfo ? variantInfo.count : 0,
      };
    });

    return NextResponse.json({
      products: productsWithCounts,
      count: count || 0,
    });
  } catch (error) {
    console.error("Text search API error:", error);
    return NextResponse.json(
      {
        error: "Server error during text search",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Simple health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Text search API is operational",
  });
}
