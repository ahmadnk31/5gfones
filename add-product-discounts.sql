-- Add discount fields to products and product_variants tables

-- Add discount_percentage to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add discount_percentage to product_variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add start_date and end_date for managing time-limited discounts on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP;

-- Add start_date and end_date for managing time-limited discounts on variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_discount_percentage ON products(discount_percentage);
CREATE INDEX IF NOT EXISTS idx_product_variants_discount_percentage ON product_variants(discount_percentage);

COMMENT ON COLUMN products.discount_percentage IS 'Percentage discount for this product (0-100)';
COMMENT ON COLUMN products.discount_start_date IS 'Date when the discount becomes active (null = active immediately)';
COMMENT ON COLUMN products.discount_end_date IS 'Date when the discount expires (null = no expiration)';
COMMENT ON COLUMN product_variants.discount_percentage IS 'Percentage discount for this variant (0-100)';
COMMENT ON COLUMN product_variants.discount_start_date IS 'Date when the variant discount becomes active (null = active immediately)';
COMMENT ON COLUMN product_variants.discount_end_date IS 'Date when the variant discount expires (null = no expiration)';
