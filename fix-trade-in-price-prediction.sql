-- Fix for trade-in price prediction function

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS calculate_trade_in_price;

-- Create the function with proper error handling and parameter types
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
    brand_name TEXT;
    minimum_value_percent DECIMAL(5, 4) := 0.1; -- Default value if not found in parameters
    param_value DECIMAL(10, 4);
BEGIN
    -- Get the device brand ID
    SELECT dt.brand_id INTO brand_id
    FROM device_models dm
    JOIN device_series ds ON dm.device_series_id = ds.id
    JOIN device_types dt ON ds.device_type_id = dt.id
    WHERE dm.id = p_device_model_id;
    
    IF brand_id IS NULL THEN
        RAISE NOTICE 'Brand ID not found for device model %', p_device_model_id;
        brand_id := 1; -- Default to ID 1 if not found
    END IF;

    -- Get the brand name 
    SELECT name INTO brand_name
    FROM device_brands
    WHERE id = brand_id;

    IF brand_name IS NULL THEN
        brand_name := 'Default';
    END IF;

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
        CASE brand_name
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
    
    -- Get storage capacity adjustment if the table exists
    BEGIN
        SELECT price_adjustment INTO storage_adjustment
        FROM storage_price_adjustments
        WHERE device_model_id = p_device_model_id AND storage_capacity = p_storage_capacity
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist yet, use default 0
        storage_adjustment := 0;
    END;
    
    -- Get color adjustment if the table exists
    BEGIN
        SELECT price_adjustment INTO color_adjustment
        FROM color_price_adjustments
        WHERE device_model_id = p_device_model_id AND color = p_color
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist yet, use default 0
        color_adjustment := 0;
    END;
    
    -- Get accessory values if the table exists
    IF p_has_charger THEN
        BEGIN
            SELECT price_adjustment INTO charger_value
            FROM accessory_price_adjustments
            WHERE accessory_type = 'charger' AND device_brand_id = brand_id
            LIMIT 1;
        EXCEPTION WHEN undefined_table THEN
            -- Use default value
            charger_value := 10;
        END;
        
        IF charger_value IS NULL THEN
            charger_value := 10; -- Default charger value
        END IF;
    END IF;
    
    IF p_has_box THEN
        BEGIN
            SELECT price_adjustment INTO box_value
            FROM accessory_price_adjustments
            WHERE accessory_type = 'box' AND device_brand_id = brand_id
            LIMIT 1;
        EXCEPTION WHEN undefined_table THEN
            -- Use default value
            box_value := 15;
        END;
        
        IF box_value IS NULL THEN
            box_value := 15; -- Default box value
        END IF;
    END IF;
    
    IF p_has_accessories THEN
        BEGIN
            SELECT price_adjustment INTO accessories_value
            FROM accessory_price_adjustments
            WHERE accessory_type = 'accessories' AND device_brand_id = brand_id
            LIMIT 1;
        EXCEPTION WHEN undefined_table THEN
            -- Use default value
            accessories_value := 20;
        END;
        
        IF accessories_value IS NULL THEN
            accessories_value := 20; -- Default accessories value
        END IF;
    END IF;
    
    -- Get market trend adjustment if the table exists
    BEGIN
        SELECT value_change_percent INTO market_trend_adjustment
        FROM market_value_trends
        WHERE device_model_id = p_device_model_id
        ORDER BY trend_date DESC
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist yet, use default 0
        market_trend_adjustment := 0;
    END;
    
    IF market_trend_adjustment IS NULL THEN
        market_trend_adjustment := 0;
    END IF;
    
    -- Try to get minimum value percent from parameters
    BEGIN
        SELECT parameter_value INTO minimum_value_percent
        FROM price_prediction_parameters 
        WHERE parameter_name = 'minimum_value_percent'
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist yet, use default 0.1 (10%)
        minimum_value_percent := 0.1;
    END;
    
    IF minimum_value_percent IS NULL THEN
        minimum_value_percent := 0.1; -- Default 10%
    END IF;
    
    -- Calculate the final price
    final_price := (base_price * GREATEST(condition_multiplier, minimum_value_percent)) + 
                  COALESCE(storage_adjustment, 0) + COALESCE(color_adjustment, 0) + 
                  COALESCE(charger_value, 0) + COALESCE(box_value, 0) + COALESCE(accessories_value, 0);
    
    -- Apply market trend adjustment (percentage) if it exists
    IF market_trend_adjustment IS NOT NULL AND market_trend_adjustment != 0 THEN
        -- Get the weight parameter
        BEGIN
            SELECT parameter_value INTO param_value
            FROM price_prediction_parameters 
            WHERE parameter_name = 'market_trend_weight'
            LIMIT 1;
        EXCEPTION WHEN undefined_table THEN
            param_value := 0.8; -- Default weight
        END;
        
        IF param_value IS NULL THEN
            param_value := 0.8; -- Default weight
        END IF;
        
        final_price := final_price * (1 + (market_trend_adjustment / 100) * param_value);
    END IF;
    
    -- Round to nearest dollar
    RETURN ROUND(final_price, 2);
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and return a default value
        RAISE NOTICE 'Error in calculate_trade_in_price: %', SQLERRM;
        RETURN 100.00; -- Return a default value on error
END;
$$ LANGUAGE plpgsql;
