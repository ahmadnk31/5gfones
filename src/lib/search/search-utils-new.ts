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
  brands: { name: string }[] | null;
  variant_count: number;
  similarity?: number;
  category_id?: number;
  brand_id?: number;
}

/**
 * Interface for raw product data from database
 */
interface RawProduct extends Omit<Product, 'brands'> {
  brands: { name: string } | null;
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
 * 1. Try Supabase vector search
 * 2. If that fails, try API-based OpenAI vector search
 * 3. If that fails, fall back to regular text search
 */
export async function searchProducts(
  queryText: string,
  page: number = 1,
  itemsPerPage: number = 16,
  filters: FilterOptions = {}
): Promise<SearchResult> {
  const supabase = createClient();
  const offset = (page - 1) * itemsPerPage;

  // Strategy 1: Try Supabase vector search
  try {
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
    }    // Process products to add defaults and convert brand format
    const productsWithDefaults = (data || []).map((rawProduct: any) => {
      const product: Product = {
        id: rawProduct.id,
        name: rawProduct.name,
        base_price: rawProduct.base_price,
        image_url: rawProduct.image_url,
        in_stock: rawProduct.in_stock,
        category_id: rawProduct.category_id,
        brand_id: rawProduct.brand_id,
        variant_count: 0,  // Default value since we're not counting variants here
        brands: rawProduct.brands ? [rawProduct.brands] : null  // Convert single brand to array
      };
      return product;
    });

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
 * Apply filters to an array of products in memory
 */
function applyFilters(rawProducts: any[], filters: FilterOptions): Product[] {
  // Convert raw products to correct format first
  const products = rawProducts.map(raw => ({
    ...raw,
    brands: raw.brands ? [raw.brands] : null
  }));

  if (!filters || Object.keys(filters).length === 0) {
    return products;
  }

  return products.filter((product) => {
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
}
