-- Create tables for Phone Trade-in / Sell Your Phone feature

-- Create a table for phone condition options
CREATE TABLE IF NOT EXISTS phone_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    multiplier DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for trade-in base prices for each device model
CREATE TABLE IF NOT EXISTS trade_in_prices (
    id SERIAL PRIMARY KEY,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE CASCADE,
    base_price DECIMAL(10, 2) NOT NULL,
    storage_capacity VARCHAR(50),
    color VARCHAR(50),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for phone trade-in/sell requests
CREATE TABLE IF NOT EXISTS phone_trade_ins (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_model_id INTEGER REFERENCES device_models(id) ON DELETE SET NULL,
    condition_id INTEGER REFERENCES phone_conditions(id) ON DELETE SET NULL,
    storage_capacity VARCHAR(50),
    color VARCHAR(50),
    description TEXT,
    images TEXT[],
    has_charger BOOLEAN DEFAULT FALSE,
    has_box BOOLEAN DEFAULT FALSE,
    has_accessories BOOLEAN DEFAULT FALSE,
    estimated_value DECIMAL(10, 2),
    offered_value DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an audit log for trade-in status updates
CREATE TABLE IF NOT EXISTS trade_in_audit_log (
    id SERIAL PRIMARY KEY,
    trade_in_id INTEGER REFERENCES phone_trade_ins(id) ON DELETE CASCADE,
    status_from VARCHAR(50),
    status_to VARCHAR(50) NOT NULL,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default conditions
INSERT INTO phone_conditions (name, description, multiplier)
VALUES 
    ('Like New', 'Device shows no signs of use, has all original accessories, and is in perfect working condition.', 1.00),
    ('Excellent', 'Device shows minimal signs of wear, has all accessories, and is in perfect working condition.', 0.90),
    ('Good', 'Device shows normal signs of use, may be missing some accessories, but is in good working condition.', 0.80),
    ('Fair', 'Device shows significant wear, may have cosmetic damage, but is still fully functional.', 0.65),
    ('Poor', 'Device has significant cosmetic damage and may have some functional issues.', 0.40)
ON CONFLICT (name) DO NOTHING;

-- Set up RLS policies
ALTER TABLE phone_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_in_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_in_audit_log ENABLE ROW LEVEL SECURITY;

-- Phone conditions - readable by all authenticated users
CREATE POLICY phone_conditions_select ON phone_conditions
    FOR SELECT
    USING (true);

-- Admin-only policies for conditions
CREATE POLICY phone_conditions_insert ON phone_conditions
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY phone_conditions_update ON phone_conditions
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Trade-in prices - admins can do everything
CREATE POLICY trade_in_prices_admin ON trade_in_prices
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Trade-in prices - all users can view
CREATE POLICY trade_in_prices_select ON trade_in_prices
    FOR SELECT
    USING (true);

-- Phone trade-ins - users can see their own submissions
CREATE POLICY trade_ins_user_select ON phone_trade_ins
    FOR SELECT
    USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Phone trade-ins - users can submit their own
CREATE POLICY trade_ins_user_insert ON phone_trade_ins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Phone trade-ins - users can update their own pending submissions
CREATE POLICY trade_ins_user_update ON phone_trade_ins
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Phone trade-ins - admins can update any submission
CREATE POLICY trade_ins_admin_update ON phone_trade_ins
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Audit log - admins can view all
CREATE POLICY audit_log_admin_select ON trade_in_audit_log
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Audit log - users can view their own
CREATE POLICY audit_log_user_select ON trade_in_audit_log
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM phone_trade_ins ti
        WHERE ti.id = trade_in_id AND ti.user_id = auth.uid()
    ));

-- Audit log - only insertable, not updatable
CREATE POLICY audit_log_insert ON trade_in_audit_log
    FOR INSERT
    WITH CHECK (true);
