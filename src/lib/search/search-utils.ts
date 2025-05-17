import { createClient } from "@/lib/supabase/client";
import { searchProductsWithEmbeddings } from "@/lib/search/openai-vector-search";
import { FilterOptions, applyFiltersToQuery } from "@/lib/search/filter-utils";

/**
 * Interface for product data
 */
export interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: number;
  brands: { name: string } | null;
  variant_count: number;
  similarity?: number;
  category_id?: number;
  brand_id?: number;
}

/**
 * Search result interface
 */
export interface SearchResult {
  products: Product[];
  count: number;
  error?: Error | null;
}

/**
 * Main search function with fallback strategy
 * 1. Try API-based search (handles both vector and text search)
 * 2. If that fails, fall back to client-side Supabase text search
 */
export async function searchProducts(
  queryText: string,
  page: number = 1,
  itemsPerPage: number = 16,
  filters: FilterOptions = {}
): Promise<SearchResult> {
  const supabase = createClient();
  const offset = (page - 1) * itemsPerPage;

  console.log("searchProducts called with:", {
    queryText,
    page,
    itemsPerPage,
    filters,
    offset
  });

  // Strategy 1: Try API-based search which handles both vector and text search
  try {
    // First try the vector search API endpoint which has fallbacks built in
    console.log("Trying vector search API...");
    const response = await fetch("/api/search/vector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryText,
        limit: itemsPerPage,
        offset,
        filters,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Vector search API success:", {
        count: data.count,
        products: data.products.length
      });
      return {
        products: data.products,
        count: data.count,
      };
    }

    // If vector search fails with error, try the text search API
    console.log("Vector search failed, trying text search API...");
    const textResponse = await fetch("/api/search/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryText,
        limit: itemsPerPage,
        offset,
        filters,
      }),
    });

    if (textResponse.ok) {
      const data = await textResponse.json();
      console.log("Text search API success:", {
        count: data.count,
        products: data.products.length
      });
      return {
        products: data.products,
        count: data.count,
      };
    }
  } catch (err) {
    console.error(
      "API search failed, falling back to client-side search:",
      err
    );
  }

  // Strategy 2: Use direct Supabase queries as last resort
  try {
    // For backwards compatibility, try the RPC function but we don't expect it to work
    // if the API routes failed
    const {
      data: vectorResults,
      error: vectorError,
      count,
    } = await supabase.rpc("search_products_vector", {
      query_text: queryText,
      match_limit: itemsPerPage,
      match_offset: offset,
    });

    if (!vectorError && vectorResults && vectorResults.length > 0) {
      // Apply filters to vector results (since RPC function doesn't support filtering yet)
      const filteredResults = applyFilters(vectorResults, filters);

      return {
        products: filteredResults,
        // Count might be inaccurate after filtering, but it's the best we can do for now
        count:
          filteredResults.length < vectorResults.length
            ? filteredResults.length
            : count || filteredResults.length,
      };
    }
  } catch (err) {
    console.log(
      "Supabase vector search unavailable, trying alternative methods",
      err
    );
  }

  // Strategy 2: Try API-based vector search
  try {
    const result = await searchProductsWithEmbeddings(
      queryText,
      itemsPerPage,
      offset
    );

    if (result.products && result.products.length > 0) {
      // Apply filters to API results
      const filteredResults = applyFilters(result.products, filters);

      return {
        products: filteredResults,
        count:
          filteredResults.length < result.products.length
            ? filteredResults.length
            : result.count,
      };
    }
  } catch (err) {
    console.log(
      "API-based vector search failed, falling back to text search",
      err
    );
  }

  // Strategy 3: Fall back to regular text search with filters
  try {
    let query = supabase
      .from("products")
      .select(
        `
        id, 
        name, 
        base_price,
        image_url,
        in_stock,
        category_id,
        brand_id,
        brands (name)
        `
      )
      .textSearch("name", queryText, {
        type: "websearch",
        config: "english",
      });

    // Apply filters directly to Supabase query
    query = applyFiltersToQuery(query, filters);

    // Get count for pagination
    const countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Also apply the same filters to count query
    const filteredCountQuery = applyFiltersToQuery(countQuery, filters);
    const { count } = await filteredCountQuery;

    // Get actual data with pagination
    const { data, error } = await query.range(
      offset,
      offset + itemsPerPage - 1
    );

    if (error) {
      return {
        products: [],
        count: 0,
        error: new Error(`Text search failed: ${error.message}`),
      };
    }

    // Add default variant_count for compatibility
    const productsWithDefaults =
      data?.map((product) => ({
        ...product,
        variant_count: 0, // Default value since we're not counting variants here
      })) || [];

    return {
      products: productsWithDefaults,
      count: count || 0,
    };
  } catch (err) {
    return {
      products: [],
      count: 0,
      error: err instanceof Error ? err : new Error("Unknown search error"),
    };
  }
}

/**
 * Apply filters and sorting to an array of products in memory
 */
function applyFilters(products: Product[], filters: FilterOptions): Product[] {
  if (!filters || Object.keys(filters).length === 0) {
    return products;
  }

  // First apply all filters
  let filteredProducts = products.filter((product) => {
    // Price filter
    if (
      filters.minPrice !== undefined &&
      product.base_price < filters.minPrice
    ) {
      return false;
    }
    if (
      filters.maxPrice !== undefined &&
      product.base_price > filters.maxPrice
    ) {
      return false;
    }

    // Category filter
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      if (
        !product.category_id ||
        !filters.categoryIds.includes(product.category_id)
      ) {
        return false;
      }
    }

    // Brand filter
    if (filters.brandIds && filters.brandIds.length > 0) {
      if (!product.brand_id || !filters.brandIds.includes(product.brand_id)) {
        return false;
      }
    }

    // Stock filter
    if (filters.inStockOnly && product.in_stock <= 0) {
      return false;
    }

    return true;
  });

  // Then apply sorting
  if (filters.sortBy && filters.sortBy !== "relevance") {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          // Note: We're using base functionality here. In real app, you'd sort by created_at
          return b.id - a.id; // Assuming newer products have higher IDs
        case "oldest":
          return a.id - b.id; // Assuming older products have lower IDs
        case "priceAsc":
          return a.base_price - b.base_price;
        case "priceDesc":
          return b.base_price - a.base_price;
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        default:
          // If using similarity from vector search, preserve it
          if (a.similarity !== undefined && b.similarity !== undefined) {
            return b.similarity - a.similarity;
          }
          return 0;
      }
    });
  }

  return filteredProducts;
}
