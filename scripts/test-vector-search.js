#!/usr/bin/env node

/**
 * Test script for vector search functionality
 * Run with: node test-vector-search.js "your search query"
 *
 * This script will test both the database vector search function
 * and the fallback text search to compare results
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { table } from "console";

// Load environment variables
dotenv.config();

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`
Missing required environment variables. Make sure you have set:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
`);
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get search query from command line args
const searchQuery = process.argv[2];

if (!searchQuery) {
  console.error(
    'Please provide a search query, e.g.: node test-vector-search.js "phone case"'
  );
  process.exit(1);
}

// Set search parameters
const limit = 5;

async function runTest() {
  console.log(`\n🔍 Testing vector search with query: "${searchQuery}"\n`);

  try {
    // Test 1: Vector Search
    console.log("Test 1: Vector Search");
    console.time("Vector Search");

    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      "search_products_vector",
      { query_text: searchQuery, match_limit: limit }
    );

    console.timeEnd("Vector Search");

    if (vectorError) {
      console.error("❌ Vector search error:", vectorError);
    } else if (!vectorResults || vectorResults.length === 0) {
      console.log("❓ No vector search results found.");
    } else {
      console.log(`✅ Vector search found ${vectorResults.length} results:`);

      // Display results in a table
      const vectorResultsFormatted = vectorResults.map((item) => ({
        ID: item.id,
        Name: item.name.substring(0, 30) + (item.name.length > 30 ? "..." : ""),
        Similarity: item.similarity
          ? (item.similarity * 100).toFixed(2) + "%"
          : "N/A",
        Category: item.category_name || "N/A",
      }));

      table(vectorResultsFormatted);
    }

    // Test 2: Regular Text Search
    console.log("\nTest 2: Regular Text Search");
    console.time("Text Search");

    const { data: textResults, error: textError } = await supabase
      .from("products")
      .select("id, name, base_price, categories(name)")
      .textSearch("name", searchQuery, {
        type: "websearch",
        config: "english",
      })
      .limit(limit);

    console.timeEnd("Text Search");

    if (textError) {
      console.error("❌ Text search error:", textError);
    } else if (!textResults || textResults.length === 0) {
      console.log("❓ No text search results found.");
    } else {
      console.log(`✅ Text search found ${textResults.length} results:`);

      // Display results in a table
      const textResultsFormatted = textResults.map((item) => ({
        ID: item.id,
        Name: item.name.substring(0, 30) + (item.name.length > 30 ? "..." : ""),
        Category: item.categories?.name || "N/A",
      }));

      table(textResultsFormatted);
    }

    console.log("\n📊 Comparison Summary:");
    console.log(`Vector Search: ${vectorResults?.length || 0} results`);
    console.log(`Text Search: ${textResults?.length || 0} results`);

    // Check if vector search is working correctly
    if (vectorResults?.length > 0) {
      console.log("✅ Vector search is working!");
    } else {
      console.log("❌ Vector search may not be set up correctly.");
      console.log("- Make sure you've run the SQL script to enable pgvector");
      console.log("- Check that your products have embeddings generated");
      console.log("- Verify that the OpenAI API key is correctly set");
    }
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  }
}

runTest();
