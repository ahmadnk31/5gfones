-- Fix the infinite recursion in chat support policies

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS chat_rooms_insert ON chat_rooms;
DROP POLICY IF EXISTS chat_rooms_update ON chat_rooms;
DROP POLICY IF EXISTS chat_messages_view ON chat_messages;
DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
DROP POLICY IF EXISTS chat_participants_view ON chat_participants;

-- Recreate policies without circular references
-- For chat_rooms: anyone can view, only admins can create/modify
CREATE POLICY chat_rooms_insert ON chat_rooms 
    FOR INSERT WITH CHECK (
        -- Check directly if the user's role is admin without using EXISTS
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );
    
CREATE POLICY chat_rooms_update ON chat_rooms 
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- For chat_messages: users can view messages in rooms they're participating in
CREATE POLICY chat_messages_view ON chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        ) OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Users can insert messages in rooms they're participating in
CREATE POLICY chat_messages_insert ON chat_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        ) OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- For chat_participants: admins can view all, users can only view their own
CREATE POLICY chat_participants_view ON chat_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Add update policy for chat_messages to allow marking as read
CREATE POLICY chat_messages_update ON chat_messages
    FOR UPDATE USING (
        user_id = auth.uid() OR
        room_id IN (
            SELECT room_id FROM chat_participants 
            WHERE user_id = auth.uid()
        ) OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Add delete policy for chat_messages (optional, for cleanup)
CREATE POLICY chat_messages_delete ON chat_messages
    FOR DELETE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );
