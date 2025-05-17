-- Vector Search Implementation for Products in FinOpenPOS
-- This file contains the SQL needed to set up vector search functionality for products

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products table if not already added
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_embedding vector(1536);

-- Create an index on the embedding column for better search performance
CREATE INDEX IF NOT EXISTS products_name_embedding_idx 
ON products USING ivfflat (name_embedding vector_cosine_ops) 
WITH (lists = 100);

-- Enable OpenAI extension (if not already installed)
-- You'll need to add your OpenAI API key as a database secret
-- CREATE EXTENSION IF NOT EXISTS vault;
-- SELECT vault.create_secret('PG_OPENAI_API_KEY', 'sk-your-openai-api-key');

-- Create trigger function to auto-generate embeddings when products are created or updated
CREATE OR REPLACE FUNCTION generate_product_embeddings()
RETURNS TRIGGER AS $$
DECLARE
  embedding_vector vector(1536);
BEGIN
  -- Generate embeddings using OpenAI API
  SELECT openai.embeddings(
    'text-embedding-ada-002',
    NEW.name || ' ' || COALESCE(NEW.description, '')
  ) INTO embedding_vector;
  
  -- Update the embedding column
  NEW.name_embedding := embedding_vector;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically generate embeddings on insert or update
DROP TRIGGER IF EXISTS generate_product_embeddings_trigger ON products;
CREATE TRIGGER generate_product_embeddings_trigger
BEFORE INSERT OR UPDATE OF name, description ON products
FOR EACH ROW
WHEN (NEW.name IS DISTINCT FROM OLD.name OR NEW.description IS DISTINCT FROM OLD.description OR NEW.name_embedding IS NULL)
EXECUTE FUNCTION generate_product_embeddings();

-- Create a more flexible vector search function
CREATE OR REPLACE FUNCTION search_products_vector(
  query_text TEXT,
  match_limit INT DEFAULT 12,
  match_threshold FLOAT DEFAULT 0.5,
  match_offset INT DEFAULT 0,
  category_filter TEXT DEFAULT NULL,
  brand_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  in_stock INTEGER,
  category_name TEXT,
  brand_name TEXT,
  similarity FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- Generate embedding for the search query
  SELECT openai.embeddings('text-embedding-ada-002', query_text) INTO query_embedding;
  
  -- Return matching products
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.base_price as price,
    p.image_url,
    p.in_stock,
    c.name as category_name,
    b.name as brand_name,
    1 - (p.name_embedding <=> query_embedding) as similarity
  FROM 
    products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
  WHERE
    p.name_embedding IS NOT NULL
    AND (1 - (p.name_embedding <=> query_embedding)) >= match_threshold
    AND (category_filter IS NULL OR c.name = category_filter)
    AND (brand_filter IS NULL OR b.name = brand_filter)
    AND (min_price IS NULL OR p.base_price >= min_price)
    AND (max_price IS NULL OR p.base_price <= max_price)
  ORDER BY 
    similarity DESC
  LIMIT match_limit
  OFFSET match_offset;
END;
$$;

-- Create a function to update all existing product embeddings
CREATE OR REPLACE FUNCTION update_all_product_embeddings()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  embedding_vector vector(1536);
BEGIN
  FOR product_record IN SELECT id, name, description FROM products LOOP
    -- Skip if we already have an embedding (remove this condition to reprocess all)
    CONTINUE WHEN product_record.name_embedding IS NOT NULL;
    
    -- Generate embeddings using OpenAI API
    SELECT openai.embeddings(
      'text-embedding-ada-002',
      product_record.name || ' ' || COALESCE(product_record.description, '')
    ) INTO embedding_vector;
    
    -- Update product with new embedding
    UPDATE products 
    SET name_embedding = embedding_vector 
    WHERE id = product_record.id;
    
    -- Log progress (comment out if not needed)
    RAISE NOTICE 'Updated embedding for product ID: %', product_record.id;
  END LOOP;
  
  RAISE NOTICE 'Completed updating all product embeddings';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_products_vector TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_vector TO anon;

-- Uncomment the following line to update all product embeddings right away
-- SELECT update_all_product_embeddings();

-- Example usage:
-- Simple search:
-- SELECT * FROM search_products_vector('iphone case', 10);

-- Filtered search:
-- SELECT * FROM search_products_vector('smartphone', 10, 0.6, 0, 'Electronics', NULL, 500, 1000);
