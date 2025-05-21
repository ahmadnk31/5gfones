-- This file contains SQL to temporarily disable the vector search trigger
-- so you can add repair parts without errors

-- Drop the trigger that's causing the errors
DROP TRIGGER IF EXISTS generate_product_embeddings_trigger ON products;

-- Alter the products table to make the name_embedding column accept NULL values
ALTER TABLE products ALTER COLUMN name_embedding DROP NOT NULL;

-- Now you can add products normally without triggering the OpenAI embedding generation
-- Once you've set up OpenAI integration properly, you can run the add-vector-search.sql script again
