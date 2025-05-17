# Fixing Vector Search in FinOpenPOS

This guide will help you fix the search functionality in FinOpenPOS by properly setting up vector search and ensuring the input fields work correctly.

## The Issue

The error `Could not find the function public.search_products_vector` indicates that the SQL functions for vector search haven't been properly applied to your Supabase database.

## Step 1: Set up Vector Search in Supabase

First, we need to set up the vector search functionality in your database:

1. Run the setup script:

```bash
npm run setup-vector-search
```

2. If the script doesn't work, you'll need to manually apply the SQL:

   - Open the SQL editor in your Supabase dashboard: https://supabase.com/dashboard/project/_/sql/new
   - Copy the contents of `vector-search-products.sql` from your project
   - Paste it into the SQL editor and run it

3. Make sure the pgvector extension is enabled:

   - Go to Database > Extensions in your Supabase dashboard
   - Enable the "vector" extension

4. If you need OpenAI integration for automatic embeddings:
   - Create an exec_sql function in your Supabase SQL editor:

```sql
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
```

## Step 2: Generate Embeddings for Products

After setting up the vector search functions, you need to generate embeddings for your products:

```bash
npm run update-embeddings-api
```

## Step 3: Test the Search Functionality

Once everything is set up, you can test the search:

```bash
npm run test-search "iphone case"
```

## Step 4: Verify that Search Works in the Application

1. Start your application with `npm run dev`
2. Navigate to the search page
3. Try searching for products

## Troubleshooting

If search still doesn't work properly:

1. **Check Browser Console for Errors**: Open your browser's developer tools and check for any error messages in the console.

2. **Verify API Routes**: Test the API routes directly using curl or a tool like Postman:

   ```
   POST /api/search/text
   POST /api/search/vector
   ```

3. **Check Supabase Logs**: Look for any errors in your Supabase logs related to the vector search functions.

4. **Alternative Solution**: The application has been updated to gracefully fall back to text search if vector search is unavailable, so search should still work even without vector search.

## Additional Information

- The search functionality now uses a multi-layered approach with fallbacks
- If vector search doesn't work, it will fall back to text search
- Input fields have been fixed to ensure they work correctly

If you continue to experience issues, please report them with specific error messages for further investigation.
