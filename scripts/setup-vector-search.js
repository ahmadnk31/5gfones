#!/usr/bin/env node

/**
 * Script to apply vector search SQL to Supabase
 * This initializes the pgvector extension and creates the necessary SQL functions
 * 
 * Run with: node setup-vector-search.js
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import readline from "readline";

// Load environment variables
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(`
Missing required environment variables. Make sure you have set:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
`);
  process.exit(1);
}

// Initialize Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupVectorSearch() {
  try {
    console.log("Starting vector search setup...");

    // Read the SQL file content
    const sqlFilePath = path.join(process.cwd(), "vector-search-products.sql");
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Split the SQL file into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);

    // Execute each SQL statement one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      // Skip comments
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }
      
      console.log(`Executing SQL statement ${i+1}/${statements.length}...`);
      
      // Execute the SQL statement via Supabase
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.error(`
Error: The 'exec_sql' RPC function is not available in your Supabase project.
You might need to create this function using the Supabase SQL editor:

CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
`);
          process.exit(1);
        } else {
          console.warn(`Warning executing statement: ${error.message}`);
          console.log(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    // Verify setup
    console.log("Verifying vector search function...");
    
    const { error: functionError } = await supabase.rpc("search_products_vector", {
      query_text: "test",
      match_limit: 1,
    });

    if (functionError) {
      if (functionError.message.includes("Could not find the function")) {
        console.error(`
Vector search function not available. This might be because:
1. The SQL statements had errors
2. The OpenAI integrations aren't properly set up in your Supabase project
3. You need to restart the Supabase instance

Check the Supabase SQL editor and logs for more details.
`);
      } else {
        console.log("Vector search function exists but returned an error:", functionError.message);
      }
    } else {
      console.log("✅ Vector search function is working correctly!");
    }
    
    console.log("\nSetup script completed.");

    // Instructions
    console.log(`
Next steps:
1. If the function is still not working, you may need to manually apply the SQL:
   - Go to https://supabase.com/dashboard/project/_/sql/new
   - Copy the content of vector-search-products.sql
   - Paste it into the SQL editor and run it

2. Make sure the pgvector extension is enabled in your project
   - Go to Database > Extensions in your Supabase dashboard
   - Enable the "vector" extension

3. Run the update-product-embeddings-api.js script to generate embeddings for your products:
   node scripts/update-product-embeddings-api.js
`);

  } catch (error) {
    console.error("Error setting up vector search:", error);
  }
}

// Function to ask for user confirmation
function askForConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`
This script will set up vector search by applying SQL to your Supabase database.
Make sure you have:
- Supabase service role key with admin access
- pgvector extension installed in Supabase
- OpenAI API configured in Supabase (for automatic embeddings)

Do you want to continue? (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Run the script with confirmation
async function run() {
  const confirmed = await askForConfirmation();
  if (confirmed) {
    await setupVectorSearch();
  } else {
    console.log("Setup cancelled.");
  }
}

run().catch(console.error);
