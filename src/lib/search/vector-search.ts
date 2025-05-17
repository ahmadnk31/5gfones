"use client";

import { createClient } from "@/lib/supabase/client";

// Define your result interface
export interface VectorSearchResult {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url: string | null;
  in_stock?: number;
  category_name?: string;
  brand_name?: string;
  similarity?: number;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  threshold?: number;
}

/**
 * Perform a vector search for products in Supabase
 */
export async function vectorSearchProducts(
  query: string,
  filters: SearchFilters = {}
): Promise<VectorSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const supabase = createClient();

  try {
    // Use the Supabase RPC function for vector search
    const { data, error } = await supabase.rpc("search_products_vector", {
      query_text: query,
      match_limit: filters.limit || 12,
      match_threshold: filters.threshold || 0.5,
      match_offset: filters.offset || 0,
      category_filter: filters.category || null,
      brand_filter: filters.brand || null,
      min_price: filters.minPrice || null,
      max_price: filters.maxPrice || null,
    });

    if (error) {
      console.error("Vector search error:", error);
      return fallbackToTextSearch(query, filters);
    }

    return data || [];
  } catch (err) {
    console.error("Error performing vector search:", err);
    return fallbackToTextSearch(query, filters);
  }
}

/**
 * Fallback to regular text search when vector search is unavailable
 */
async function fallbackToTextSearch(
  query: string,
  filters: SearchFilters = {}
): Promise<VectorSearchResult[]> {
  const supabase = createClient();
  console.log("Falling back to text search");

  try {
    let queryBuilder = supabase
      .from("products")
      .select(
        "id, name, description, base_price, image_url, in_stock, categories!inner(name), brands!inner(name)"
      )
      .textSearch("name", query, {
        type: "websearch",
        config: "english",
      });

    // Apply filters
    if (filters.category) {
      queryBuilder = queryBuilder.eq("categories.name", filters.category);
    }
    if (filters.brand) {
      queryBuilder = queryBuilder.eq("brands.name", filters.brand);
    }
    if (filters.minPrice) {
      queryBuilder = queryBuilder.gte("base_price", filters.minPrice);
    }
    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte("base_price", filters.maxPrice);
    }

    queryBuilder = queryBuilder.limit(filters.limit || 12);

    if (filters.offset) {
      queryBuilder = queryBuilder.range(
        filters.offset,
        filters.offset + (filters.limit || 12) - 1
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Text search error:", error);
      return [];
    }

    // Transform results to match the vector search format
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.base_price,
      image_url: item.image_url,
      in_stock: item.in_stock,
      category_name: item.categories?.name,
      brand_name: item.brands?.name,
    }));
  } catch (err) {
    console.error("Error performing text search:", err);
    return [];
  }
}

/**
 * Client-side vector search using server API route (used as a fallback)
 * Uses the server-side API route instead of direct OpenAI calls
 */
export async function clientSideVectorSearch(
  query: string,
  productData: any[],
  limit: number = 10
): Promise<VectorSearchResult[]> {
  if (!query.trim() || !productData.length) {
    return [];
  }

  try {
    // Use our server API route to generate the embedding
    const response = await fetch("/api/ai/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate embedding from API");
    }

    const { embedding: queryEmbedding } = await response.json();

    // Only proceed if we got a valid embedding
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return [];
    }

    // Helper function for cosine similarity calculation
    const calculateCosineSimilarity = (
      embedding1: number[],
      embedding2: number[]
    ): number => {
      if (
        !embedding1 ||
        !embedding2 ||
        !Array.isArray(embedding1) ||
        !Array.isArray(embedding2) ||
        embedding1.length !== embedding2.length
      ) {
        return 0;
      }

      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        magnitude1 += embedding1[i] * embedding1[i];
        magnitude2 += embedding2[i] * embedding2[i];
      }

      magnitude1 = Math.sqrt(magnitude1);
      magnitude2 = Math.sqrt(magnitude2);

      if (magnitude1 === 0 || magnitude2 === 0) return 0;

      return dotProduct / (magnitude1 * magnitude2);
    };

    // Filter products that have embeddings and calculate similarity
    return productData
      .filter(
        (product) => product.embedding && Array.isArray(product.embedding)
      )
      .map((product) => {
        // Calculate real cosine similarity between query and product embeddings
        const similarity = calculateCosineSimilarity(
          queryEmbedding,
          product.embedding
        );
        return {
          ...product,
          similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (err) {
    console.error("Error performing client-side vector search:", err);
    return [];
  }
}
