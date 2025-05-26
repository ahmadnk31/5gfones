-- Create the create_order_from_items RPC function
-- This function creates an order and order items from cart items

CREATE OR REPLACE FUNCTION create_order_from_items(
    items_json TEXT,
    shipping_amount DECIMAL DEFAULT 0,
    tax_amount DECIMAL DEFAULT 0
)
RETURNS TABLE (
    order_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id INTEGER;
    item_record RECORD;
    items_array JSONB;
    total_amount DECIMAL := 0;
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create an order';
    END IF;
    
    -- Parse the JSON items
    items_array := items_json::JSONB;
    
    -- Calculate total amount from items
    FOR item_record IN 
        SELECT 
            (value->>'id')::INTEGER as product_id,
            (value->>'variantId')::INTEGER as variant_id,
            (value->>'quantity')::INTEGER as quantity,
            (value->>'price')::DECIMAL as price
        FROM jsonb_array_elements(items_array) AS value
    LOOP
        total_amount := total_amount + (item_record.price * item_record.quantity);
    END LOOP;
    
    -- Add shipping and tax to total
    total_amount := total_amount + shipping_amount + tax_amount;
    
    -- Create the order
    INSERT INTO orders (
        customer_id,
        total_amount,
        status,
        user_uid,
        created_at
    ) VALUES (
        current_user_id,
        total_amount,
        'pending',
        current_user_id,
        NOW()
    ) RETURNING id INTO new_order_id;
    
    -- Create order items
    FOR item_record IN 
        SELECT 
            (value->>'id')::INTEGER as product_id,
            (value->>'variantId')::INTEGER as variant_id,
            (value->>'quantity')::INTEGER as quantity,
            (value->>'price')::DECIMAL as price
        FROM jsonb_array_elements(items_array) AS value
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            product_variant_id,
            quantity,
            unit_price,
            created_at
        ) VALUES (
            new_order_id,
            item_record.product_id,
            item_record.variant_id,
            item_record.quantity,
            item_record.price,
            NOW()
        );
    END LOOP;
    
    -- Return the order ID
    RETURN QUERY SELECT new_order_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_from_items(TEXT, DECIMAL, DECIMAL) TO authenticated;
