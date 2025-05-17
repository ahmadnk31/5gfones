-- Add images column to product_variants table
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update permissions
GRANT ALL ON product_variants TO authenticated;