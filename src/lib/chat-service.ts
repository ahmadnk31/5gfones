import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

/**
 * Service for interacting with chat messages in the database
 */
export const chatService = {
  /**
   * Saves a chat message to the database
   */
  async saveMessage(message: ChatMessage, roomName: string, isAiMessage: boolean = false): Promise<void> {
    try {
      const supabase = createClient()
      
      // Get the room ID (or create if it doesn't exist)
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', roomName)
        .single()
      
      if (roomError || !room) {
        console.error('Error getting chat room:', roomError)
        return
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Save the message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: user?.id || null,
          username: message.user.name,
          content: message.content,
          is_ai_message: isAiMessage,
          read_by_admin: isAiMessage || message.user.name.includes('Admin'),
          read_by_user: !isAiMessage && !message.user.name.includes('Admin'),
          created_at: message.createdAt
        })
      
      if (messageError) {
        console.error('Error saving message:', messageError)
      }
    } catch (error) {
      console.error('Error in saveMessage:', error)
    }
  },
  
  /**
   * Gets previous chat messages from the database
   */
  async getMessages(roomName: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const supabase = createClient()
      
      // Get the room ID
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', roomName)
        .single()
      
      if (roomError || !room) {
        console.error('Error getting chat room:', roomError)
        return []
      }
      
      // Get messages for the room
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(limit)
      
      if (messagesError) {
        console.error('Error getting messages:', messagesError)
        return []
      }
      
      // Convert to ChatMessage format
      return messages.map(msg => ({
        id: msg.id.toString(),
        content: msg.content,
        user: {
          name: msg.username
        },
        createdAt: msg.created_at
      }))
    } catch (error) {
      console.error('Error in getMessages:', error)
      return []
    }
  },
  
  /**
   * Mark messages as read by admin or user
   */
  async markMessagesAsRead(roomName: string, isAdmin: boolean): Promise<void> {
    try {
      const supabase = createClient()
      
      // Get the room ID
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', roomName)
        .single()
      
      if (roomError || !room) {
        console.error('Error getting chat room:', roomError)
        return
      }
      
      // Update messages
      const { error: updateError } = await supabase
        .from('chat_messages')
        .update({
          read_by_admin: isAdmin ? true : undefined,
          read_by_user: !isAdmin ? true : undefined
        })
        .eq('room_id', room.id)
        .eq(isAdmin ? 'read_by_admin' : 'read_by_user', false)
      
      if (updateError) {
        console.error('Error marking messages as read:', updateError)
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error)
    }
  },
  
  /**
   * Get unread message count for a room
   */
  async getUnreadCount(roomName: string, isAdmin: boolean): Promise<number> {
    try {
      const supabase = createClient()
      
      // Get the room ID
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', roomName)
        .single()
      
      if (roomError || !room) {
        console.error('Error getting chat room:', roomError)
        return 0
      }
      
      // Count unread messages
      const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .eq(isAdmin ? 'read_by_admin' : 'read_by_user', false)
      
      if (countError) {
        console.error('Error counting unread messages:', countError)
        return 0
      }
      
      return count || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }
}
