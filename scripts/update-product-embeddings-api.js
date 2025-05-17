#!/usr/bin/env node

/**
 * Script to update product embeddings in the database using the server-side API
 * Run with: node update-product-embeddings-api.js
 *
 * Make sure to have a .env file with:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (service role key with admin access)
 * - API_ENDPOINT (your application's API endpoint for embedding generation)
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

// Check if .env exists, if not, create a template
const envPath = path.resolve(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  const envTemplate = `# Your application base URL (with http/https)
API_ENDPOINT=http://localhost:3000

# Supabase connection details
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-with-admin-access
`;
  fs.writeFileSync(envPath, envTemplate);
  console.error(
    "Please configure your .env file with your API endpoint and Supabase keys"
  );
  process.exit(1);
}

// Validate required environment variables
const apiEndpoint = process.env.API_ENDPOINT || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiEndpoint || !supabaseUrl || !supabaseServiceKey) {
  console.error(`
Missing required environment variables. Make sure you have set:
- API_ENDPOINT
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
`);
  process.exit(1);
}

// Initialize Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embeddings using the server API
async function generateBatchEmbeddings(texts) {
  try {
    const response = await fetch(`${apiEndpoint}/api/ai/batch-embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, auth: false }), // auth=false for script usage
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
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
    const batchSize = 20; // Larger batch size since we're using server-side API
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(
        `Processing batch ${i / batchSize + 1} of ${Math.ceil(
          products.length / batchSize
        )}`
      );

      // Prepare texts for batch embedding generation
      const textsToEmbed = batch.map((product) =>
        `${product.name} ${product.description || ""}`.trim()
      );

      // Filter out empty texts
      const validBatchItems = batch.filter((_, index) => textsToEmbed[index]);
      const validTexts = textsToEmbed.filter((text) => text);

      if (validTexts.length === 0) {
        console.log("No valid texts in this batch, skipping...");
        continue;
      }

      // Generate embeddings in batch
      const embeddings = await generateBatchEmbeddings(validTexts);

      if (embeddings && Array.isArray(embeddings)) {
        // Update each product with its embedding
        await Promise.all(
          validBatchItems.map(async (product, index) => {
            const { error: updateError } = await supabase
              .from("products")
              .update({ name_embedding: embeddings[index] })
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
          })
        );
      } else {
        console.error("❌ Failed to generate batch embeddings");
      }

      // Add a delay between batches to avoid rate limits
      if (i + batchSize < products.length) {
        console.log("Waiting 1 second before processing next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
console.log("🚀 Starting embedding generation process using server API...");
updateProductEmbeddings()
  .then(() => {
    console.log("✅ Update script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
