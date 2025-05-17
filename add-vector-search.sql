-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_embedding vector(1536);

-- Add an index to the embedding column for better performance
CREATE INDEX IF NOT EXISTS products_name_embedding_idx ON products USING ivfflat (name_embedding vector_cosine_ops) WITH (lists = 100);

-- Create function to generate embeddings using OpenAI's API
-- Note: This requires setting up the PG_OPENAI_API_KEY DB secret in Supabase
CREATE OR REPLACE FUNCTION generate_embeddings()
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

-- Create trigger to automatically generate embeddings when products are inserted or updated
DROP TRIGGER IF EXISTS generate_product_embeddings_trigger ON products;
CREATE TRIGGER generate_product_embeddings_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION generate_embeddings();

-- Create vector search function that can be called from the client
CREATE OR REPLACE FUNCTION search_products_vector(
  query_text TEXT,
  match_limit INT DEFAULT 10,
  match_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INT,
  name VARCHAR(255),
  description TEXT,
  base_price DECIMAL(10, 2),
  image_url TEXT,
  in_stock INTEGER,
  brands JSONB,
  variant_count BIGINT,
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
    RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.base_price,
    p.image_url,
    p.in_stock,
    (SELECT jsonb_build_object('name', b.name) FROM brands b WHERE b.id = p.brand_id) as brands,
    (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count,
    1 - (p.name_embedding <=> query_embedding) as similarity
  FROM 
    products p
  WHERE
    p.name_embedding IS NOT NULL
    AND p.user_uid = auth.uid()  -- Respect user isolation
  ORDER BY 
    p.name_embedding <=> query_embedding
  LIMIT match_limit
  OFFSET match_offset;
END;
$$;

-- Create a function to update all existing products with embeddings
CREATE OR REPLACE FUNCTION update_all_product_embeddings()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  embedding_vector vector(1536);
BEGIN
  FOR product_record IN SELECT id, name, description FROM products WHERE name_embedding IS NULL LOOP
    -- Generate embeddings using OpenAI API
    SELECT openai.embeddings(
      'text-embedding-ada-002',
      product_record.name || ' ' || COALESCE(product_record.description, '')
    ) INTO embedding_vector;
    
    -- Update product with new embedding
    UPDATE products 
    SET name_embedding = embedding_vector 
    WHERE id = product_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment out the following line if you want to run it manually
-- SELECT update_all_product_embeddings();

-- Add security policy for the vector search function
-- This allows the function to be executed by authenticated users
GRANT EXECUTE ON FUNCTION search_products_vector TO authenticated;
