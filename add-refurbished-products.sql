-- Add refurbished products table to the database

-- Check if the refurbished_products table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refurbished_products') THEN
        -- Create the refurbished_products table if it doesn't exist
        CREATE TABLE refurbished_products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            condition VARCHAR(50) NOT NULL CHECK (condition IN ('excellent', 'good', 'fair')),
            original_price DECIMAL(10, 2) NOT NULL CHECK (original_price >= 0),
            refurbished_price DECIMAL(10, 2) NOT NULL CHECK (refurbished_price >= 0),
            discount_percentage INTEGER GENERATED ALWAYS AS (
                CASE 
                    WHEN original_price > 0 
                    THEN ROUND(((original_price - refurbished_price) / original_price) * 100)
                    ELSE 0
                END
            ) STORED,
            brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            compatible_with_model_id INTEGER REFERENCES device_models(id) ON DELETE SET NULL,
            warranty_months INTEGER NOT NULL DEFAULT 6,
            in_stock INTEGER NOT NULL DEFAULT 0 CHECK (in_stock >= 0),
            is_featured BOOLEAN NOT NULL DEFAULT FALSE,
            refurbishment_date DATE DEFAULT CURRENT_DATE,
            user_uid UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create the refurbished_product_images table
        CREATE TABLE refurbished_product_images (
            id SERIAL PRIMARY KEY,
            refurbished_product_id INTEGER NOT NULL REFERENCES refurbished_products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            user_uid UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create the refurbished_product_specs table for technical specifications
        CREATE TABLE refurbished_product_specs (
            id SERIAL PRIMARY KEY,
            refurbished_product_id INTEGER NOT NULL REFERENCES refurbished_products(id) ON DELETE CASCADE,
            spec_name VARCHAR(100) NOT NULL,
            spec_value TEXT NOT NULL,
            user_uid UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Enable Row Level Security (RLS)
        ALTER TABLE refurbished_products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE refurbished_product_images ENABLE ROW LEVEL SECURITY;
        ALTER TABLE refurbished_product_specs ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS Policies
        CREATE POLICY refurbished_products_user_isolation ON refurbished_products
            FOR ALL USING (user_uid = auth.uid());
        
        CREATE POLICY refurbished_product_images_user_isolation ON refurbished_product_images
            FOR ALL USING (user_uid = auth.uid());
        
        CREATE POLICY refurbished_product_specs_user_isolation ON refurbished_product_specs
            FOR ALL USING (user_uid = auth.uid());
        
        -- Grant permissions to authenticated users
        GRANT ALL ON refurbished_products TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE refurbished_products_id_seq TO authenticated;
        
        GRANT ALL ON refurbished_product_images TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE refurbished_product_images_id_seq TO authenticated;
        
        GRANT ALL ON refurbished_product_specs TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE refurbished_product_specs_id_seq TO authenticated;
        
        RAISE NOTICE 'Refurbished products tables created successfully';
    ELSE
        RAISE NOTICE 'Refurbished products tables already exist';
    END IF;
END $$;
