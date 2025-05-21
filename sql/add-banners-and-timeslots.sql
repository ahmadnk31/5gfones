-- Banner and TimeSlot tables for 5GPhones

-- Create banners table
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    display_order INTEGER DEFAULT 0,
    target_page VARCHAR(50), -- e.g., 'home', 'repair', 'shop'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_uid UUID NOT NULL REFERENCES auth.users(id)
);

-- Create time slots table
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_appointments INTEGER NOT NULL DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    service_type VARCHAR(50) DEFAULT 'repair', -- e.g., 'repair', 'consultation'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_uid UUID NOT NULL REFERENCES auth.users(id),
    CONSTRAINT unique_timeslot UNIQUE(day_of_week, start_time, service_type)
);

-- Create time slot exclusions table (for holidays, etc.)
CREATE TABLE time_slot_exclusions (
    id SERIAL PRIMARY KEY,
    exclusion_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_uid UUID NOT NULL REFERENCES auth.users(id)
);

-- Create RLS policies for the new tables
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_exclusions ENABLE ROW LEVEL SECURITY;

-- Policies for banners
CREATE POLICY "Banners are viewable by everyone" 
ON banners FOR SELECT USING (true);

CREATE POLICY "Banners can be inserted by admins" 
ON banners FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Banners can be updated by admins" 
ON banners FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
) WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Banners can be deleted by admins" 
ON banners FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Policies for time_slots
CREATE POLICY "Time slots are viewable by everyone" 
ON time_slots FOR SELECT USING (true);

CREATE POLICY "Time slots can be inserted by admins" 
ON time_slots FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Time slots can be updated by admins" 
ON time_slots FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
) WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Time slots can be deleted by admins" 
ON time_slots FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Policies for time_slot_exclusions
CREATE POLICY "Time slot exclusions are viewable by everyone" 
ON time_slot_exclusions FOR SELECT USING (true);

CREATE POLICY "Time slot exclusions can be inserted by admins" 
ON time_slot_exclusions FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Time slot exclusions can be updated by admins" 
ON time_slot_exclusions FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
) WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Time slot exclusions can be deleted by admins" 
ON time_slot_exclusions FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
