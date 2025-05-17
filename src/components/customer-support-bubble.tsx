"use client";

import { useState, useEffect, useMemo } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CustomerSupportChat } from "@/components/customer-support-chat";
import { useChatNotifications } from "@/hooks/use-chat-notifications";

interface CustomerSupportBubbleProps {
  username: string;
}

export const CustomerSupportBubble = ({
  username,
}: CustomerSupportBubbleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize chat notifications parameters to prevent unnecessary re-renders
  const chatNotificationsParams = useMemo(
    () => ({
      roomName: "customer-support",
      username,
      isChatOpen: isOpen,
    }),
    [username, isOpen]
  );

  const { unreadCount, resetUnreadCount } = useChatNotifications(
    chatNotificationsParams
  );
  // Enhanced toggle chat function with improved state management
  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Reset unread count when opening the chat
    if (newIsOpen) {
      resetUnreadCount();
    }
  };

  // Also reset unread count when component mounts if chat is open
  useEffect(() => {
    if (isOpen) {
      resetUnreadCount();
    }
  }, [isOpen, resetUnreadCount]);

  return (
    <div className='fixed bottom-4 right-4 z-50 flex flex-col items-end'>
      {/* Expanded Chat */}
      {isOpen && (
        <div className='mb-3 animate-in fade-in slide-in-from-right-5 duration-300'>
          <div className='w-[350px] h-[450px] bg-white rounded-lg shadow-lg overflow-hidden border border-border'>
            <CustomerSupportChat
              username={username}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}{" "}
      {/* Bubble Button */}
      <div className='relative'>
        {!isOpen && unreadCount > 0 && (
          <span className='absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold z-10'>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <Button
          onClick={toggleChat}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            isOpen
              ? "bg-muted hover:bg-muted/90"
              : "bg-primary hover:bg-primary/90"
          )}
          aria-label={isOpen ? "Close support chat" : "Open support chat"}
        >
          {isOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <MessageSquare className='h-6 w-6' />
          )}
        </Button>
      </div>
    </div>
  );
};
