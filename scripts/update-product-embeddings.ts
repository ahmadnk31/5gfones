// This script updates embeddings for all existing products
// It should be run after setting up the vector search functionality

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embeddings for a text string
async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

// Function to batch update product embeddings
async function updateProductEmbeddings() {
  try {
    console.log("Fetching products without embeddings...");

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description")
      .is("name_embedding", null);

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    console.log(`Found ${products.length} products without embeddings`);

    // Process products in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(
        `Processing batch ${i / batchSize + 1} of ${Math.ceil(
          products.length / batchSize
        )}`
      );

      await Promise.all(
        batch.map(async (product) => {
          // Combine name and description for better embedding context
          const text = `${product.name} ${product.description || ""}`;
          const embedding = await generateEmbedding(text);

          if (embedding) {
            const { error: updateError } = await supabase
              .from("products")
              .update({ name_embedding: embedding })
              .eq("id", product.id);

            if (updateError) {
              console.error(
                `Error updating product ${product.id}:`,
                updateError
              );
            } else {
              console.log(`✓ Updated embedding for product: ${product.name}`);
            }
          }
        })
      );

      // Add a small delay between batches to avoid rate limits
      if (i + batchSize < products.length) {
        console.log("Waiting before processing next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("Finished updating product embeddings");
  } catch (error) {
    console.error("Error in batch update:", error);
  }
}

// Run the update function
updateProductEmbeddings()
  .then(() => {
    console.log("Update script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
