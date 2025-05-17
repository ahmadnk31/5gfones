-- Drop tables if they exist (in reverse order to avoid dependency issues)
DO $$
BEGIN
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS appointment_items CASCADE;
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS product_variants CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS brands CASCADE;
    DROP TABLE IF EXISTS device_models CASCADE;
    DROP TABLE IF EXISTS device_series CASCADE;
    DROP TABLE IF EXISTS device_types CASCADE;
    DROP TABLE IF EXISTS device_brands CASCADE;
    DROP TABLE IF EXISTS customers CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
    DROP TABLE IF EXISTS payment_methods CASCADE;
    DROP TABLE IF EXISTS repair_statuses CASCADE;
END $$;

-- Create Payment Methods table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Profiles table (for user roles and settings)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'admin')),
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Device-related tables
CREATE TABLE device_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_types (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES device_brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_series (
    id SERIAL PRIMARY KEY,
    device_type_id INTEGER REFERENCES device_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE device_models (
    id SERIAL PRIMARY KEY,
    device_series_id INTEGER REFERENCES device_series(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Product-related tables
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    compatible_with_model_id INTEGER REFERENCES device_models(id) ON DELETE SET NULL,
    image_url TEXT,
    is_repair_part BOOLEAN NOT NULL DEFAULT FALSE,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    in_stock INTEGER NOT NULL DEFAULT 0 CHECK (in_stock >= 0),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100) UNIQUE,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Customers table (linked to auth.users)
CREATE TABLE customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Repair-related tables
CREATE TABLE repair_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE SET NULL,
    device_serial_number VARCHAR(100),
    device_password VARCHAR(100),
    problem_description TEXT NOT NULL,
    diagnosis TEXT,
    appointment_date TIMESTAMP NOT NULL,
    estimated_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    status_id INTEGER REFERENCES repair_statuses(id) ON DELETE SET NULL,
    technician_notes TEXT,
    total_amount DECIMAL(10, 2) CHECK (total_amount >= 0),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_items (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    is_service BOOLEAN DEFAULT FALSE,
    service_description TEXT,
    service_duration INTEGER CHECK (service_duration >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    description TEXT,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount != 0),
    user_uid UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO payment_methods (name) VALUES 
    ('Credit Card'),
    ('Debit Card'),
    ('Cash'),
    ('Bank Transfer'),
    ('Mobile Payment');

INSERT INTO repair_statuses (name, description, color) VALUES 
   >    ('Awaiting Check-In', 'Device not yet received', 'gray'),
    ('Checked In', 'Device received, awaiting diagnosis', 'blue'),
    ('Diagnosed', 'Problem diagnosed, awaiting customer approval', 'purple'),
    ('Approved', 'Repair approved, awaiting parts', 'orange'),
    ('In Progress', 'Repair in progress', 'yellow'),
    ('Completed', 'Repair completed, ready for pickup', 'green'),
    ('Delivered', 'Repaired device delivered to customer', 'green'),
    ('Cancelled', 'Repair cancelled', 'red');

-- Enable Row Level Security (RLS)
DO $$
BEGIN
    ALTER TABLE device_brands ENABLE ROW LEVEL SECURITY;
    ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
    ALTER TABLE device_series ENABLE ROW LEVEL SECURITY;
    ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE repair_statuses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE appointment_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
END $$;

-- Create RLS Policies
CREATE POLICY device_brands_user_isolation ON device_brands
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY device_types_user_isolation ON device_types
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY device_series_user_isolation ON device_series
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY device_models_user_isolation ON device_models
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY brands_user_isolation ON brands
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY categories_user_isolation ON categories
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY products_user_isolation ON products
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY product_variants_user_isolation ON product_variants
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY customers_user_isolation ON customers
    FOR ALL USING (id = auth.uid());

CREATE POLICY profiles_user_isolation ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY orders_user_isolation ON orders
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY order_items_user_isolation ON order_items
    FOR ALL USING (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

CREATE POLICY repair_statuses_user_isolation ON repair_statuses
    FOR ALL USING (true);

CREATE POLICY appointments_user_isolation ON appointments
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY appointment_items_user_isolation ON appointment_items
    FOR ALL USING (appointment_id IN (SELECT id FROM appointments WHERE user_uid = auth.uid()));

CREATE POLICY transactions_user_isolation ON transactions
    FOR ALL USING (user_uid = auth.uid());

CREATE POLICY payment_methods_user_isolation ON payment_methods
    FOR ALL USING (true);