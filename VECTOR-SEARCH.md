# Vector Search Implementation for FinOpenPOS

This document explains how the vector search functionality was implemented in FinOpenPOS.

## Overview

The system implements a multi-level search strategy:

1. Primary: Database-side vector search using pgvector
2. Secondary: Client-side vector search using OpenAI embeddings
3. Fallback: Regular text search using PostgreSQL's full-text search

## Server-Side Vector Search Setup

To set up the server-side vector search:

1. Install the pgvector extension in your Supabase project:

   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL in `add-vector-search.sql`

2. Set up the OpenAI integration in Supabase:

   - Add your OpenAI API key as a database secret in Supabase:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vault;
   SELECT vault.create_secret('PG_OPENAI_API_KEY', 'sk-your-openai-api-key');
   ```

3. Generate embeddings for existing products:

   - You can either run the SQL function:

   ```sql
   SELECT update_all_product_embeddings();
   ```

   - Or use the provided script (recommended for large datasets):

   ```bash
   # First install dependencies
   npm install dotenv openai

   # Create a .env file with your keys
   echo "OPENAI_API_KEY=sk-your-openai-api-key" > .env
   echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" >> .env
   echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env

   # Run the script
   npm run update-embeddings
   ```

4. Confirm that the vector search function is working:

   ```sql
   SELECT * FROM search_products_vector('phone case', 5, 0);
   ```

## Client-Side Implementation

The search functionality is organized into three main files:

1. `src/lib/search/search-utils.ts` - The main search utility that implements the search strategy
2. `src/lib/search/openai-vector-search.ts` - The client-side vector search implementation using OpenAI
3. `src/app/[locale]/search/page.tsx` - The search page that uses the search utilities

## Environment Variables

To enable client-side vector search (as a backup), add your OpenAI API key to the environment variables:

```
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key
```

## How It Works

1. When a user searches:

   - The system first tries to use the Supabase `search_products_vector` function
   - If that fails, it falls back to client-side vector search
   - If that fails, it uses regular text search

2. The vector search uses embeddings:
   - Product names and descriptions are converted to vector embeddings
   - Search queries are also converted to embeddings
   - Similarity is calculated using cosine similarity
   - Results are sorted by similarity

## Performance Considerations

- Server-side vector search is significantly faster than client-side
- The system caches embeddings in the database for better performance
- For large product catalogs, we've included an index on the embedding column for better performance
