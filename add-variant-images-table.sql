-- Check if the variant_images table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'variant_images') THEN
        -- Create the variant_images table if it doesn't exist
        CREATE TABLE variant_images (
            id SERIAL PRIMARY KEY,
            variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            user_uid UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Enable Row Level Security (RLS)
        ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS Policy
        CREATE POLICY variant_images_user_isolation ON variant_images
            FOR ALL USING (user_uid = auth.uid());
        
        -- Grant permissions to authenticated users
        GRANT ALL ON variant_images TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE variant_images_id_seq TO authenticated;
        
        RAISE NOTICE 'variant_images table created successfully';
    ELSE
        RAISE NOTICE 'variant_images table already exists';
    END IF;
END $$;