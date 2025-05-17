-- Chat history and customer support tables

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_ai_message BOOLEAN DEFAULT FALSE,
    read_by_admin BOOLEAN DEFAULT FALSE, 
    read_by_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_participants table to track who's in which chat
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('customer', 'admin', 'ai')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- For chat_rooms: anyone can view, only admins can create/modify
CREATE POLICY chat_rooms_view ON chat_rooms 
    FOR SELECT USING (true);
    
CREATE POLICY chat_rooms_insert ON chat_rooms 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    
CREATE POLICY chat_rooms_update ON chat_rooms 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- For chat_messages: users can view messages in rooms they're participating in
CREATE POLICY chat_messages_view ON chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        ) OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can insert messages in rooms they're participating in
CREATE POLICY chat_messages_insert ON chat_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        ) OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- For chat_participants: admins can view all, users can only view their own
CREATE POLICY chat_participants_view ON chat_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create default customer support room
INSERT INTO chat_rooms (name) 
VALUES ('customer-support')
ON CONFLICT (name) DO NOTHING;
