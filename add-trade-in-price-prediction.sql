-- Add tables for advanced phone trade-in price prediction system

-- Table for storing device-specific pricing factors
CREATE TABLE IF NOT EXISTS device_pricing_factors (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE CASCADE,
    factor_name VARCHAR(50) NOT NULL,
    factor_value DECIMAL(10, 2) NOT NULL,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_model_id, factor_name)
);

-- Table for device-specific value adjustments based on storage capacity
CREATE TABLE IF NOT EXISTS storage_price_adjustments (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE CASCADE,
    storage_capacity VARCHAR(50) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_model_id, storage_capacity)
);

-- Table for device value adjustments based on color
CREATE TABLE IF NOT EXISTS color_price_adjustments (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE CASCADE,
    color VARCHAR(50) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_model_id, color)
);

-- Table for device value adjustments based on accessories
CREATE TABLE IF NOT EXISTS accessory_price_adjustments (
    id SERIAL PRIMARY KEY,
    accessory_type VARCHAR(50) NOT NULL, -- 'charger', 'box', 'earphones', etc.
    device_brand_id INTEGER REFERENCES device_brands(id) ON DELETE CASCADE,
    price_adjustment DECIMAL(10, 2) NOT NULL,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(accessory_type, device_brand_id)
);

-- Table for market value trends (updated periodically)
CREATE TABLE IF NOT EXISTS market_value_trends (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE CASCADE,
    trend_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_change_percent DECIMAL(5, 2) NOT NULL, -- Positive or negative percentage
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_model_id, trend_date)
);

-- Table for storing the prediction model parameters (configurable by admin)
CREATE TABLE IF NOT EXISTS price_prediction_parameters (
    id SERIAL PRIMARY KEY,
    parameter_name VARCHAR(50) NOT NULL UNIQUE,
    parameter_value DECIMAL(10, 4) NOT NULL,
    description TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default parameters for the prediction model
INSERT INTO price_prediction_parameters (parameter_name, parameter_value, description, user_uid)
VALUES 
    ('base_charger_value', 10.00, 'Base value adjustment for including a charger', auth.uid()),
    ('base_box_value', 15.00, 'Base value adjustment for including the original box', auth.uid()),
    ('base_accessories_value', 20.00, 'Base value adjustment for including accessories', auth.uid()),
    ('market_trend_weight', 0.80, 'Weight given to market trends in value calculation', auth.uid()),
    ('minimum_value_percent', 0.10, 'Minimum value as percentage of original price regardless of condition', auth.uid())
ON CONFLICT (parameter_name) DO NOTHING;

-- Set up RLS policies
ALTER TABLE device_pricing_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessory_price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_value_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_prediction_parameters ENABLE ROW LEVEL SECURITY;

-- All users can view pricing data
CREATE POLICY device_pricing_factors_select ON device_pricing_factors FOR SELECT USING (true);
CREATE POLICY storage_price_adjustments_select ON storage_price_adjustments FOR SELECT USING (true);
CREATE POLICY color_price_adjustments_select ON color_price_adjustments FOR SELECT USING (true);
CREATE POLICY accessory_price_adjustments_select ON accessory_price_adjustments FOR SELECT USING (true);
CREATE POLICY market_value_trends_select ON market_value_trends FOR SELECT USING (true);
CREATE POLICY price_prediction_parameters_select ON price_prediction_parameters FOR SELECT USING (true);

-- Only admins can modify pricing data
CREATE POLICY device_pricing_factors_admin ON device_pricing_factors
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY storage_price_adjustments_admin ON storage_price_adjustments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY color_price_adjustments_admin ON color_price_adjustments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY accessory_price_adjustments_admin ON accessory_price_adjustments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY market_value_trends_admin ON market_value_trends
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY price_prediction_parameters_admin ON price_prediction_parameters
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create a function to calculate the trade-in price
CREATE OR REPLACE FUNCTION calculate_trade_in_price(
    p_device_model_id INTEGER,
    p_condition_id INTEGER,
    p_storage_capacity VARCHAR(50),
    p_color VARCHAR(50),
    p_has_charger BOOLEAN,
    p_has_box BOOLEAN,
    p_has_accessories BOOLEAN
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    base_price DECIMAL(10, 2);
    condition_multiplier DECIMAL(3, 2);
    storage_adjustment DECIMAL(10, 2) := 0;
    color_adjustment DECIMAL(10, 2) := 0;
    charger_value DECIMAL(10, 2) := 0;
    box_value DECIMAL(10, 2) := 0;
    accessories_value DECIMAL(10, 2) := 0;
    market_trend_adjustment DECIMAL(10, 2) := 0;
    final_price DECIMAL(10, 2);
    brand_id INTEGER;
    minimum_value_percent DECIMAL(5, 4);
BEGIN
    -- Get the device brand ID
    SELECT device_types.brand_id INTO brand_id
    FROM device_models
    JOIN device_series ON device_models.device_series_id = device_series.id
    JOIN device_types ON device_series.device_type_id = device_types.id
    WHERE device_models.id = p_device_model_id;

    -- Get base price from trade_in_prices table
    SELECT base_price INTO base_price
    FROM trade_in_prices
    WHERE device_model_id = p_device_model_id 
    AND (storage_capacity = p_storage_capacity OR storage_capacity IS NULL)
    AND (color = p_color OR color IS NULL)
    ORDER BY 
        CASE WHEN storage_capacity = p_storage_capacity THEN 0 ELSE 1 END,
        CASE WHEN color = p_color THEN 0 ELSE 1 END
    LIMIT 1;

    -- If no specific price found, use a default based on brand
    IF base_price IS NULL THEN
        -- Get brand name
        SELECT name INTO STRICT brand_id
        FROM device_brands
        WHERE id = brand_id;
        
        -- Set default price based on brand
        CASE brand_id
            WHEN 'Apple' THEN base_price := 300;
            WHEN 'Samsung' THEN base_price := 250;
            WHEN 'Google' THEN base_price := 200;
            WHEN 'OnePlus' THEN base_price := 180;
            WHEN 'LG' THEN base_price := 150;
            WHEN 'Motorola' THEN base_price := 120;
            ELSE base_price := 100;
        END CASE;
    END IF;
    
    -- Get condition multiplier
    SELECT multiplier INTO condition_multiplier
    FROM phone_conditions
    WHERE id = p_condition_id;
    
    IF condition_multiplier IS NULL THEN
        condition_multiplier := 0.5; -- Default if condition not found
    END IF;
    
    -- Get storage capacity adjustment
    SELECT price_adjustment INTO storage_adjustment
    FROM storage_price_adjustments
    WHERE device_model_id = p_device_model_id AND storage_capacity = p_storage_capacity;
    
    -- Get color adjustment
    SELECT price_adjustment INTO color_adjustment
    FROM color_price_adjustments
    WHERE device_model_id = p_device_model_id AND color = p_color;
    
    -- Get accessory values
    IF p_has_charger THEN
        SELECT COALESCE(
            (SELECT price_adjustment FROM accessory_price_adjustments 
             WHERE accessory_type = 'charger' AND device_brand_id = brand_id),
            (SELECT parameter_value FROM price_prediction_parameters 
             WHERE parameter_name = 'base_charger_value')
        ) INTO charger_value;
    END IF;
    
    IF p_has_box THEN
        SELECT COALESCE(
            (SELECT price_adjustment FROM accessory_price_adjustments 
             WHERE accessory_type = 'box' AND device_brand_id = brand_id),
            (SELECT parameter_value FROM price_prediction_parameters 
             WHERE parameter_name = 'base_box_value')
        ) INTO box_value;
    END IF;
    
    IF p_has_accessories THEN
        SELECT COALESCE(
            (SELECT price_adjustment FROM accessory_price_adjustments 
             WHERE accessory_type = 'accessories' AND device_brand_id = brand_id),
            (SELECT parameter_value FROM price_prediction_parameters 
             WHERE parameter_name = 'base_accessories_value')
        ) INTO accessories_value;
    END IF;
    
    -- Get market trend adjustment
    SELECT COALESCE(value_change_percent, 0) * 
           (SELECT parameter_value FROM price_prediction_parameters WHERE parameter_name = 'market_trend_weight')
    INTO market_trend_adjustment
    FROM market_value_trends
    WHERE device_model_id = p_device_model_id
    ORDER BY trend_date DESC
    LIMIT 1;
    
    -- Get minimum value percent
    SELECT parameter_value INTO minimum_value_percent
    FROM price_prediction_parameters 
    WHERE parameter_name = 'minimum_value_percent';
    
    -- Calculate the final price
    final_price := (base_price * GREATEST(condition_multiplier, minimum_value_percent)) + 
                  storage_adjustment + color_adjustment + 
                  charger_value + box_value + accessories_value;
    
    -- Apply market trend adjustment (percentage)
    final_price := final_price * (1 + market_trend_adjustment / 100);
    
    -- Round to nearest dollar
    RETURN ROUND(final_price, 2);
END;
$$ LANGUAGE plpgsql;
