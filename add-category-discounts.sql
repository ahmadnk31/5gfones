-- Add category_discounts table to store collection-specific discount information
CREATE TABLE IF NOT EXISTS category_discounts (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    description TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS Policy for category_discounts table
ALTER TABLE category_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY category_discounts_user_isolation ON category_discounts
    FOR ALL USING (user_uid = auth.uid());

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up the trigger on category_discounts table
CREATE TRIGGER update_category_discounts_timestamp
BEFORE UPDATE ON category_discounts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add indexes for performance
CREATE INDEX idx_category_discounts_category_id ON category_discounts(category_id);
CREATE INDEX idx_category_discounts_is_active ON category_discounts(is_active);
CREATE INDEX idx_category_discounts_date_range ON category_discounts(start_date, end_date);
