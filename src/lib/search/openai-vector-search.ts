import { createClient } from "@/lib/supabase/client";

// Interface for product data
interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url: string | null;
  in_stock: number;
  brands: { name: string } | null;
  variant_count: number;
  similarity?: number;
}

/**
 * Function to search products using OpenAI embeddings
 * This is a client-side alternative to the server-side search_products_vector function
 * Uses a secure API endpoint to perform the vector search without exposing the API key
 */
export async function searchProductsWithEmbeddings(
  queryText: string,
  limit: number = 16,
  offset: number = 0
): Promise<{ products: Product[]; count: number }> {
  try {
    // Call the API endpoint to perform vector search
    const response = await fetch("/api/search/vector", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryText,
        limit,
        offset,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      products: data.products,
      count: data.count,
    };
  } catch (error) {
    console.error("Vector search API call error:", error);

    // Fallback to regular non-vector search
    return fallbackToRegularSearch(queryText, limit, offset);
  }
}

/**
 * Fallback function that performs a regular search without vectors
 * Used when the vector search API fails
 */
async function fallbackToRegularSearch(
  queryText: string,
  limit: number = 16,
  offset: number = 0
): Promise<{ products: Product[]; count: number }> {
  // Get all products from Supabase (with pagination)
  const supabase = createClient();

  // First, get the total count of products for pagination
  const { count: totalCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Then get the actual products for this page with basic text search
  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      description,
      base_price,
      image_url,
      in_stock,
      brands (name),
      (select count(*) from product_variants where product_id = products.id) as variant_count
    `
    )
    .textSearch("name", queryText, {
      type: "websearch",
      config: "english",
    })
    .range(offset, offset + limit - 1);

  if (error || !products) {
    console.error("Error fetching products:", error);
    return { products: [], count: 0 };
  }

  return {
    products,
    count: totalCount || 0,
  };
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);

  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}
