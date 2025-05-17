import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// Initialize OpenAI client securely on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API route handler for generating AI responses with relevant product context
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Get relevant product context
    const productContext = await getRelevantProductContext(message);

    // Create prompt with context
    const systemPrompt = `You are a helpful customer support assistant for FinOpenPOS, a point-of-sale system for businesses.
    
    Be concise, friendly, and helpful. Answer customer questions about products, orders, or general information.
    
    ${
      productContext
        ? `Here is relevant product information that might help with the user's query:\n${productContext}`
        : ""
    }
    
    If you're asked something you don't know, you can suggest the customer speak with a human agent.`;

    // Generate response from OpenAI
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 250,
    });

    const aiResponse =
      chatCompletion.choices[0]?.message.content ||
      "I'm sorry, I'm having trouble processing your request right now.";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in AI chat API:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

/**
 * Get relevant product context for the AI response
 */
async function getRelevantProductContext(
  query: string
): Promise<string | null> {
  try {
    // Create a Supabase client
    const supabase = createClient();

    // Try vector search first for more accurate results
    try {
      // Generate embeddings using OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Search for products using the generated embedding
      const { data: products } = await supabase.rpc("search_products_vector", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 3,
      });

      if (products && products.length > 0) {
        return formatProductsAsContext(products);
      }
    } catch (error) {
      console.error("Vector search failed:", error);
    }

    // Fallback to text search if vector search fails
    const { data: products } = await supabase
      .from("products")
      .select(
        `
        id, 
        name, 
        base_price,
        description,
        in_stock,
        brands (name)
      `
      )
      .textSearch("name", query, {
        type: "websearch",
        config: "english",
      })
      .limit(3);

    if (products && products.length > 0) {
      return formatProductsAsContext(products);
    }

    return null;
  } catch (error) {
    console.error("Error getting product context:", error);
    return null;
  }
}

/**
 * Format products into a context string
 */
function formatProductsAsContext(products: any[]): string {
  return products
    .map(
      (product) =>
        `Product: ${product.name}
     Price: $${product.base_price}
     In Stock: ${product.in_stock}
     ${product.description ? `Description: ${product.description}` : ""}
     ${product.brands ? `Brand: ${product.brands.name}` : ""}
    `
    )
    .join("\n\n");
}
