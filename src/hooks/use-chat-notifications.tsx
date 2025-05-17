"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { chatService } from "@/lib/chat-service";

interface UseChatNotificationsProps {
  roomName: string;
  username: string;
  isChatOpen: boolean;
}

/**
 * Hook for managing chat notifications and typing indicators
 * @param roomName Name of the chat room
 * @param username Name of the current user
 * @param isChatOpen Whether the chat is currently open
 */
export function useChatNotifications({
  roomName,
  username,
  isChatOpen,
}: UseChatNotificationsProps) {
  const supabase = createClient();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Handle chat notifications and unread messages
  useEffect(() => {
    if (isChatOpen) {
      resetUnreadCount();
    } else {
      // Load initial unread count from database
      const loadUnreadCount = async () => {
        try {
          // Get user info to determine if admin
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user?.id)
            .single();

          const isAdmin = userProfile?.role === "admin";

          // Get unread count
          const count = await chatService.getUnreadCount(roomName, isAdmin);
          setUnreadCount(count);
        } catch (error) {
          console.error("Error loading unread count:", error);
        }
      };

      loadUnreadCount();
    }

    // Create a channel subscription for notifications
    const channel = supabase.channel(`notifications:${roomName}`);

    channel
      .on("broadcast", { event: "message" }, (payload) => {
        // Skip notifications for own messages
        if (payload.payload?.user?.name === username) {
          return;
        }

        // Increase unread count if chat is closed
        if (!isChatOpen) {
          setUnreadCount((prev) => prev + 1);

          // Show notification
          toast.success(
            `New message from ${payload.payload?.user?.name || "Customer"}`,
            {
              description: payload.payload?.content || "You have a new message",
              duration: 5000,
            }
          );
        }
      })
      // Add typing indicator subscription
      .on("broadcast", { event: "typing" }, (payload) => {
        const typingUser = payload.payload?.user;

        // Skip own typing events
        if (typingUser === username) {
          return;
        }

        // Add user to typing list
        setTypingUsers((prev) => {
          if (!prev.includes(typingUser)) {
            return [...prev, typingUser];
          }
          return prev;
        });

        // Remove user after delay
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((user) => user !== typingUser));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, username, isChatOpen, supabase]);

  /**
   * Reset unread count and mark messages as read
   */
  const resetUnreadCount = async () => {
    setUnreadCount(0);

    try {
      // Mark messages as read
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      const isAdmin = userProfile?.role === "admin";

      await chatService.markMessagesAsRead(roomName, isAdmin);
    } catch (error) {
      console.error("Error resetting unread count:", error);
    }
  };

  /**
   * Send a typing indicator to the channel
   */
  const sendTypingIndicator = () => {
    try {
      const channel = supabase.channel(`notifications:${roomName}`);
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { user: username },
      });
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };

  return {
    unreadCount,
    resetUnreadCount,
    typingUsers,
    sendTypingIndicator,
  };
}
