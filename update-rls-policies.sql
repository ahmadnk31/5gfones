-- Drop existing RLS policies
DROP POLICY IF EXISTS device_brands_user_isolation ON device_brands;
DROP POLICY IF EXISTS device_types_user_isolation ON device_types;
DROP POLICY IF EXISTS device_series_user_isolation ON device_series;
DROP POLICY IF EXISTS device_models_user_isolation ON device_models;
DROP POLICY IF EXISTS brands_user_isolation ON brands;
DROP POLICY IF EXISTS categories_user_isolation ON categories;
DROP POLICY IF EXISTS products_user_isolation ON products;
DROP POLICY IF EXISTS product_variants_user_isolation ON product_variants;
DROP POLICY IF EXISTS customers_user_isolation ON customers;
DROP POLICY IF EXISTS profiles_user_isolation ON profiles;
DROP POLICY IF EXISTS orders_user_isolation ON orders;
DROP POLICY IF EXISTS order_items_user_isolation ON order_items;
DROP POLICY IF EXISTS appointments_user_isolation ON appointments;
DROP POLICY IF EXISTS appointment_items_user_isolation ON appointment_items;
DROP POLICY IF EXISTS transactions_user_isolation ON transactions;

-- Create READ policies - only show records that belong to the authenticated user
CREATE POLICY device_brands_read ON device_brands
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY device_types_read ON device_types
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY device_series_read ON device_series
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY device_models_read ON device_models
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY brands_read ON brands
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY categories_read ON categories
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY products_read ON products
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY product_variants_read ON product_variants
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY customers_read ON customers
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY profiles_read ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY orders_read ON orders
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY order_items_read ON order_items
    FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

CREATE POLICY appointments_read ON appointments
    FOR SELECT USING (user_uid = auth.uid());

CREATE POLICY appointment_items_read ON appointment_items
    FOR SELECT USING (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()));

CREATE POLICY transactions_read ON transactions
    FOR SELECT USING (user_uid = auth.uid());

-- Keep these policies as they were
CREATE POLICY repair_statuses_read ON repair_statuses
    FOR SELECT USING (true);

CREATE POLICY payment_methods_read ON payment_methods
    FOR SELECT USING (true);

-- Create INSERT policies - allow inserts if the authenticated user sets their UID
CREATE POLICY device_brands_insert ON device_brands
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_types_insert ON device_types
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_series_insert ON device_series
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_models_insert ON device_models
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY brands_insert ON brands
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY categories_insert ON categories
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY products_insert ON products
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY product_variants_insert ON product_variants
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY customers_insert ON customers
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY orders_insert ON orders
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY order_items_insert ON order_items
    FOR INSERT WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

CREATE POLICY appointments_insert ON appointments
    FOR INSERT WITH CHECK (user_uid = auth.uid());

CREATE POLICY appointment_items_insert ON appointment_items
    FOR INSERT WITH CHECK (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()));

CREATE POLICY transactions_insert ON transactions
    FOR INSERT WITH CHECK (user_uid = auth.uid());

-- Create UPDATE policies - allow updates on user's own records
CREATE POLICY device_brands_update ON device_brands
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_types_update ON device_types
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_series_update ON device_series
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY device_models_update ON device_models
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY brands_update ON brands
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY categories_update ON categories
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY products_update ON products
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY product_variants_update ON product_variants
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY customers_update ON customers
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY orders_update ON orders
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY order_items_update ON order_items
    FOR UPDATE USING (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid())) 
    WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

CREATE POLICY appointments_update ON appointments
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

CREATE POLICY appointment_items_update ON appointment_items
    FOR UPDATE USING (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()))
    WITH CHECK (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()));

CREATE POLICY transactions_update ON transactions
    FOR UPDATE USING (user_uid = auth.uid()) WITH CHECK (user_uid = auth.uid());

-- Create DELETE policies - allow deletion of user's own records
CREATE POLICY device_brands_delete ON device_brands
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY device_types_delete ON device_types
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY device_series_delete ON device_series
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY device_models_delete ON device_models
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY brands_delete ON brands
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY categories_delete ON categories
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY products_delete ON products
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY product_variants_delete ON product_variants
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY customers_delete ON customers
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY profiles_delete ON profiles
    FOR DELETE USING (id = auth.uid());

CREATE POLICY orders_delete ON orders
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY order_items_delete ON order_items
    FOR DELETE USING (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

CREATE POLICY appointments_delete ON appointments
    FOR DELETE USING (user_uid = auth.uid());

CREATE POLICY appointment_items_delete ON appointment_items
    FOR DELETE USING (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()));

CREATE POLICY transactions_delete ON transactions
    FOR DELETE USING (user_uid = auth.uid());

-- Storage bucket policy (if needed)
CREATE POLICY storage_images_policy ON storage.objects
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (bucket_id = 'images');