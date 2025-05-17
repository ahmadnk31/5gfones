#!/usr/bin/env node

/**
 * Script to update product embeddings in the database
 * Run with: node update-product-embeddings.js
 *
 * Make sure to have a .env file with:
 * - OPENAI_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (service role key with admin access)
 */

import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Check if .env exists, if not, create a template
const envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  const envTemplate = `# OpenAI API key for generating embeddings
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase connection details
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-with-admin-access
`;
  fs.writeFileSync(envPath, envTemplate);
  console.error("Please configure your .env file with your API keys");
  process.exit(1);
}

// Validate required environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
  console.error(`
Missing required environment variables. Make sure you have set:
- OPENAI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
`);
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Initialize Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embeddings for a text string
async function generateEmbedding(text) {
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
    console.log("Fetching products...");

    // Check if the embedding column exists
    const { data: hasEmbedding, error: columnError } = await supabase
      .from("products")
      .select("name_embedding")
      .limit(1);

    if (columnError && columnError.message.includes("column does not exist")) {
      console.error(
        "The name_embedding column doesn't exist in the products table."
      );
      console.log(
        "Please run the SQL in vector-search-products.sql first to create the column."
      );
      return;
    }

    // Fetch products that need embeddings
    // Either they have no embedding or their embedding is null
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description")
      .is("name_embedding", null)
      .order("id", { ascending: true })
      .limit(100); // Process in batches of 100

    if (error) {
      console.error("Error fetching products:", error);
      return;
    }

    console.log(`Found ${products.length} products without embeddings`);

    if (products.length === 0) {
      console.log("No products need embedding updates.");
      return;
    }

    // Process products in smaller batches to avoid rate limits
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
          const text = `${product.name} ${product.description || ""}`.trim();
          if (!text) {
            console.log(
              `⚠️ Product ${product.id} has no text content to embed`
            );
            return;
          }

          const embedding = await generateEmbedding(text);

          if (embedding) {
            const { error: updateError } = await supabase
              .from("products")
              .update({ name_embedding: embedding })
              .eq("id", product.id);

            if (updateError) {
              console.error(
                `❌ Error updating product ${product.id}:`,
                updateError
              );
            } else {
              console.log(
                `✅ Updated embedding for product ${product.id}: ${product.name}`
              );
            }
          } else {
            console.error(
              `❌ Failed to generate embedding for product ${product.id}`
            );
          }
        })
      );

      // Add a delay between batches to avoid rate limits
      if (i + batchSize < products.length) {
        console.log("Waiting 2 seconds before processing next batch...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("✨ Finished updating product embeddings");

    // Check if there are more products to process
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("name_embedding", null);

    if (count > 0) {
      console.log(`There are still ${count} products without embeddings.`);
      console.log("Run this script again to process the next batch.");
    } else {
      console.log("All products have been processed successfully!");
    }
  } catch (error) {
    console.error("Error in batch update:", error);
  }
}

// Run the update function
console.log("🚀 Starting embedding generation process...");
updateProductEmbeddings()
  .then(() => {
    console.log("✅ Update script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
