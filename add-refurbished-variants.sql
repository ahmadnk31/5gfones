-- Add has_variations field to refurbished_products table
ALTER TABLE refurbished_products ADD COLUMN has_variations BOOLEAN NOT NULL DEFAULT FALSE;

-- Create refurbished product variants table
CREATE TABLE refurbished_product_variants (
    id SERIAL PRIMARY KEY,
    refurbished_product_id INTEGER REFERENCES refurbished_products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create variant images table for refurbished products
CREATE TABLE refurbished_variant_images (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER REFERENCES refurbished_product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE refurbished_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE refurbished_variant_images ENABLE ROW LEVEL SECURITY;

-- Create policies for refurbished product variants
CREATE POLICY refurbished_product_variants_user_isolation ON refurbished_product_variants 
  USING (user_uid = auth.uid() OR user_uid IN (SELECT member_id FROM organization_members WHERE user_id = auth.uid()))
  WITH CHECK (user_uid = auth.uid());

-- Create policies for refurbished variant images
CREATE POLICY refurbished_variant_images_user_isolation ON refurbished_variant_images 
  USING (user_uid = auth.uid() OR user_uid IN (SELECT member_id FROM organization_members WHERE user_id = auth.uid()))
  WITH CHECK (user_uid = auth.uid());
