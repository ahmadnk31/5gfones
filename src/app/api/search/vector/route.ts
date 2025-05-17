import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createClient } from "@/lib/supabase/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API handler for vector search
 * This provides a secure way to use OpenAI embeddings for search without
 * exposing the API key in the client-side code
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { queryText, limit = 16, offset = 0 } = await request.json();

    if (!queryText || typeof queryText !== "string") {
      return NextResponse.json(
        { error: "Query text is required" },
        { status: 400 }
      );
    }

    // Initialize the server-side Supabase client
    const supabase = createClient();

    // First try text search since it's more reliable
    try {
      const { data: textResults, error: textError, count: textCount } = await supabase
        .from("products")
        .select("id, name, description, base_price, image_url, in_stock, brands(name)", { count: "exact" })
        .textSearch("name", queryText, {
          type: "websearch",
          config: "english",
        })
        .range(offset, offset + limit - 1)
        .is('is_repair_part', false)
        
      if (!textError && textResults && textResults.length > 0) {
        // Get variant counts for each product
        const variantCounts = await Promise.all(
          textResults.map(async (product) => {
            const { count } = await supabase
              .from("product_variants")
              .select("*", { count: "exact", head: true })
              .eq("product_id", product.id);
            
            return { id: product.id, count: count || 0 };
          })
        );
        
        // Map the products with variant counts
        const products = textResults.map(product => {
          const variantInfo = variantCounts.find(v => v.id === product.id);
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
          products,
          count: textCount || products.length,
        });
      }
    } catch (textSearchError) {
      console.error("Text search failed:", textSearchError);
    }

    // Try vector search as a fallback
    try {
      // Try to use the Supabase RPC function for vector search
      const { data: vectorResults, error: vectorError, count } = await supabase.rpc(
        "search_products_vector",
        {
          query_text: queryText,
          match_limit: limit,
          match_threshold: 0.4,
          match_offset: offset,
          category_filter: null,
          brand_filter: null,
          min_price: null,
          max_price: null,
        }
      );

      // If vector search works, return the results
      if (!vectorError && vectorResults && vectorResults.length > 0) {
        return NextResponse.json({
          products: vectorResults,
          count: count || vectorResults.length,
        });
      } else {
        console.log("Vector search RPC failed:", vectorError);
      }
    } catch (vectorError) {
      console.error("Vector search error:", vectorError);
    }

    // If both methods above fail, use OpenAI embedding-based search
    console.log("Using OpenAI fallback for search");

    // Get products for OpenAI-based search
    const { count: totalCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id, 
        name, 
        description,
        base_price,
        image_url,
        in_stock,
        name_embedding,
        brands (name)
      `)
      .range(offset, offset + limit - 1);
    
    if (error || !products) {
      return NextResponse.json(
        { error: "Error fetching products", details: error },
        { status: 500 }
      );
    }

    // Get variant counts
    const variantCounts = await Promise.all(
      products.map(async (product) => {
        const { count } = await supabase
          .from("product_variants")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id);
        
        return { id: product.id, count: count || 0 };
      })
    );

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: queryText,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Use existing embeddings where available, otherwise use name similarity
    const productsWithSimilarity = products.map(product => {
      // Calculate cosine similarity if embedding exists
      let similarity = 0;
      if (product.name_embedding) {
        similarity = calculateCosineSimilarity(queryEmbedding, product.name_embedding);
      } else {
        // Simple text similarity as fallback
        const productName = product.name.toLowerCase();
        const searchTerm = queryText.toLowerCase();
        
        if (productName.includes(searchTerm)) {
          // Give higher score for exact matches
          similarity = 0.7;
        } else {
          const words = searchTerm.split(' ');
          const matchingWords = words.filter(word => productName.includes(word));
          similarity = matchingWords.length / words.length * 0.5;
        }
      }
      
      // Find variant count
      const variantInfo = variantCounts.find(v => v.id === product.id);
      const variant_count = variantInfo ? variantInfo.count : 0;
      
      // Create a new object without the embedding
      const { name_embedding, ...productWithoutEmbedding } = product;
      
      return {
        ...productWithoutEmbedding,
        variant_count,
        similarity,
      };
    });
    
    // Sort by similarity (descending)
    productsWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    return NextResponse.json({
      products: productsWithSimilarity,
      count: totalCount || 0,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Server error during search", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
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

// Simple health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Search API is operational",
  });
}
