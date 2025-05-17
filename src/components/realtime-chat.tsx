"use client";

import { cn } from "@/lib/utils";
import { ChatMessageItem } from "@/components/chat-message";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { type ChatMessage, useRealtimeChat } from "@/hooks/use-realtime-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatNotifications } from "@/hooks/use-chat-notifications";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
  showTypingIndicator?: boolean;
  onFileUpload?: (file: File) => Promise<void>;
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
  showTypingIndicator = false,
  onFileUpload,
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  });
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Get typing indicators from the hook - with memoized hook params to prevent re-renders
  const chatNotificationsParams = useMemo(
    () => ({
      roomName,
      username,
      isChatOpen: true,
    }),
    [roomName, username]
  ); // Only recreate when roomName or username changes

  const { typingUsers, sendTypingIndicator } = useChatNotifications(
    chatNotificationsParams
  );

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  // Use a ref to track previous message length to prevent unnecessary callbacks
  const prevMessagesLengthRef = useRef(allMessages.length);

  useEffect(() => {
    // Only call onMessage if the messages have actually changed (new messages added)
    if (
      onMessage &&
      allMessages.length > 0 &&
      allMessages.length !== prevMessagesLengthRef.current
    ) {
      prevMessagesLengthRef.current = allMessages.length;
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !onFileUpload) return;

      try {
        setIsUploading(true);
        const file = e.target.files[0];
        await onFileUpload(file);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onFileUpload]
  );

  // Handle typing detection
  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);
      if (showTypingIndicator) {
        sendTypingIndicator();
      }
    },
    [showTypingIndicator, sendTypingIndicator]
  );

  // Handle message sending
  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  return (
    <div className='flex flex-col h-full w-full bg-background text-foreground antialiased'>
      {/* Messages */}
      <div ref={containerRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
        {allMessages.length === 0 ? (
          <div className='text-center text-sm text-muted-foreground'>
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className='space-y-1'>
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            return (
              <div
                key={message.id}
                className='animate-in fade-in slide-in-from-bottom-4 duration-300'
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Typing Indicators */}
      {showTypingIndicator && typingUsers.length > 0 && (
        <div className='px-4 py-1 text-xs text-muted-foreground animate-pulse'>
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className='flex w-full items-center gap-2 border-t border-border p-4'
      >
        {/* Hidden file input */}
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          onChange={handleFileSelect}
          disabled={!isConnected || !onFileUpload}
        />

        {/* File upload button */}
        {onFileUpload && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='flex-shrink-0'
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
          >
            {isUploading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Paperclip className='h-4 w-4' />
            )}
          </Button>
        )}

        {/* Message input */}
        <Input
          className={cn(
            "rounded-full bg-background text-sm transition-all duration-300",
            isConnected && newMessage.trim() ? "flex-1" : "flex-1"
          )}
          type='text'
          value={newMessage}
          onChange={handleTyping}
          placeholder='Type a message...'
          disabled={!isConnected || isUploading}
        />

        {/* Send button */}
        {isConnected && newMessage.trim() && (
          <Button
            className='flex-shrink-0 aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300'
            type='submit'
            disabled={!isConnected}
          >
            <Send className='h-4 w-4' />
          </Button>
        )}
      </form>
    </div>
  );
};
