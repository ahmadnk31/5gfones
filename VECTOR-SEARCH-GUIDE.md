# Vector Search Implementation Guide for FinOpenPOS

This guide explains how to set up and use vector search functionality for the product search feature in FinOpenPOS.

## What is Vector Search?

Vector search uses AI embeddings to convert text (like product names and descriptions) into numeric vectors. These vectors capture the semantic meaning of the text, allowing for more intelligent search results that understand context and meaning rather than just matching keywords.

## Benefits of Vector Search

- More accurate search results that understand context
- Better handling of typos and variations in search terms
- Ability to find related products even when exact keywords don't match
- Enhanced search experience for users

## Implementation Steps

### 1. Set Up the Database

First, run the SQL script to set up the necessary database structures and functions:

```bash
# Go to your Supabase SQL Editor and run the contents of:
vector-search-products.sql
```

This script will:

- Enable the pgvector extension
- Add an embedding column to your products table
- Create functions and triggers for vector search
- Set up indexes for better performance

### 2. Configure OpenAI Integration

You need an OpenAI API key to generate embeddings. Add it to your environment:

#### For Supabase Database:

Add your OpenAI API key as a database secret in Supabase:

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vault;
SELECT vault.create_secret('PG_OPENAI_API_KEY', 'sk-your-openai-api-key');
```

#### For Local Development:

Create a `.env` file with your API keys:

```
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Generate Embeddings for Existing Products

Run the provided script to generate embeddings for all your existing products:

```bash
# Install dependencies if needed
npm install openai dotenv @supabase/supabase-js

# Run the script
npm run update-embeddings
```

This will process products in batches and generate embeddings for them.

### 4. Check the Implementation

To verify that the vector search is working properly:

1. Use the SQL Editor in Supabase to run a test query:

```sql
SELECT * FROM search_products_vector('phone case', 5);
```

2. Try searching in your application and check the console logs to ensure the vector search function is being called.

## Client-Side Integration

The search functionality has been integrated into the search bar component. It uses a multi-level approach:

1. First tries to use the Supabase vector search function
2. Falls back to regular text search if vector search fails
3. Displays results in real-time as users type

## Advanced Configuration

### Fine-tuning Search Results

You can adjust various parameters to fine-tune your search:

```typescript
// Example: Adjust the similarity threshold and result limit
const searchResults = await vectorSearchProducts(searchQuery, {
  threshold: 0.6, // Higher = stricter matching
  limit: 10, // Number of results to return
});
```

### Adding Filters

The vector search function supports filtering by category, brand, price, etc.:

```typescript
// Example: Search with filters
const searchResults = await vectorSearchProducts(searchQuery, {
  category: "Electronics",
  minPrice: 50,
  maxPrice: 500,
});
```

## Troubleshooting

### Common Issues

1. **Missing or empty embeddings**: Run the update script again to generate missing embeddings.
2. **Rate limiting from OpenAI**: Add delays between batch processing or reduce batch size.
3. **Performance issues**: Check that the index on the embedding column is working properly.

### Logs and Debugging

The search component and vector search utilities include logging. Check your console for:

- "Vector search unavailable" - Indicates the vector search function couldn't be used
- "Falling back to text search" - Indicates the system is using the text search backup

## Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector Store Documentation](https://supabase.com/docs/guides/ai/vector-store)

## Maintenance

- Regularly run the embedding update script for new products
- Monitor search performance and adjust parameters as needed
- Consider periodically regenerating embeddings as OpenAI models improve
