"use client";

import { useState, useEffect } from "react";
import { RealtimeChat } from "@/components/realtime-chat";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/hooks/use-realtime-chat";
import { generateAIResponse } from "@/lib/ai-chat";
import { chatService } from "@/lib/chat-service";
import { createClient } from "@/lib/supabase/client";

interface CustomerSupportChatProps {
  username: string;
  onClose?: () => void;
}

export const CustomerSupportChat = ({
  username,
  onClose,
}: CustomerSupportChatProps) => {
  const [adminOnline, setAdminOnline] = useState<boolean>(false);
  const [storedMessages, setStoredMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if admin is online and load previous messages
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const initializeChat = async () => {
      try {
        setLoading(true);

        // Check if any admin is online by subscribing to presence
        channel = supabase.channel("online-admins");

        const setupPresence = async () => {
          try {
            channel
              ?.on("presence", { event: "sync" }, () => {
                try {
                  if (!channel) return;
                  const state = channel.presenceState();
                  // Check if any admin is in the presence state
                  const adminsOnline = Object.values(state).some(
                    (presence) =>
                      Array.isArray(presence) &&
                      presence.some((p: any) => p.isAdmin === true)
                  );

                  // Only update if the state has changed to prevent re-renders
                  setAdminOnline((prevState) => {
                    if (prevState !== adminsOnline) {
                      console.log(
                        `Admin online status changed: ${adminsOnline}`
                      );
                      return adminsOnline;
                    }
                    return prevState;
                  });
                } catch (err) {
                  console.error("Error processing presence state:", err);
                }
              })
              .on("presence", { event: "join" }, ({ key, newPresences }) => {
                // Check if an admin joined
                const adminJoined = newPresences.some(
                  (p: any) => p.isAdmin === true
                );
                if (adminJoined) {
                  setAdminOnline(true);
                }
              })
              .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
                // If admin left, recheck if any other admins are still online
                const adminLeft = leftPresences.some(
                  (p: any) => p.isAdmin === true
                );
                if (adminLeft && channel) {
                  const state = channel.presenceState();
                  // Check if any admin is still in the presence state
                  const adminsOnline = Object.values(state).some(
                    (presence) =>
                      Array.isArray(presence) &&
                      presence.some((p: any) => p.isAdmin === true)
                  );
                  setAdminOnline(adminsOnline);
                }
              })
              .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                  // Track user presence
                  await channel?.track({
                    user: username,
                    isAdmin: false,
                    online_at: new Date().toISOString(),
                  });
                }
              });
          } catch (error) {
            console.error("Error setting up presence channel:", error);
            // Default to offline mode
            setAdminOnline(false);
          }
        };

        await setupPresence();

        // Load previous messages from the database
        const previousMessages = await chatService.getMessages(
          "customer-support"
        );

        // If no previous messages, add welcome message
        if (previousMessages.length === 0) {
          const botWelcomeMessage: ChatMessage = {
            id: crypto.randomUUID(),
            content:
              "Hello! I'm the FinOpenPOS AI Assistant. How can I help you today?",
            user: {
              name: "AI Assistant",
            },
            createdAt: new Date().toISOString(),
          };

          setStoredMessages([botWelcomeMessage]);

          // Save welcome message to database
          await chatService.saveMessage(
            botWelcomeMessage,
            "customer-support",
            true
          );
        } else {
          setStoredMessages(previousMessages);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);

        // Fallback to offline mode with welcome message
        const botWelcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content:
            "Hello! I'm the FinOpenPOS AI Assistant. How can I help you today?",
          user: {
            name: "AI Assistant",
          },
          createdAt: new Date().toISOString(),
        };

        setStoredMessages([botWelcomeMessage]);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup function to remove channel subscription when component unmounts
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [username]);

  // Handle incoming chat messages
  const handleMessage = async (messages: ChatMessage[]) => {
    if (!messages.length) return;

    const latestMessage = messages[messages.length - 1];
    const prevMessagesLength = storedMessages.length;

    // Only update stored messages if they've actually changed
    // This prevents infinite loops in the update cycle
    if (
      messages.length !== prevMessagesLength ||
      (latestMessage &&
        !storedMessages.some((msg) => msg.id === latestMessage.id))
    ) {
      setStoredMessages(messages);

      // If we have a new message
      if (latestMessage) {
        try {
          // Persist the latest message to the database if it's new
          if (!storedMessages.some((msg) => msg.id === latestMessage.id)) {
            await chatService.saveMessage(
              latestMessage,
              "customer-support",
              latestMessage.user.name === "AI Assistant"
            );
          }

          // Mark messages as read by the user
          await chatService.markMessagesAsRead("customer-support", false);
        } catch (error) {
          console.error("Error saving message:", error);
        }

        // If admin is offline and the message is from the user, generate an AI response
        // Also check if this is a new message to avoid duplicate AI responses
        const isFromCurrentUser = latestMessage.user.name === username;
        const noRecentAiResponse = !storedMessages.some(
          (msg) =>
            msg.user.name === "AI Assistant" &&
            !msg.isTyping && // Ignore typing indicators
            new Date(msg.createdAt).getTime() >
              new Date(latestMessage.createdAt).getTime()
        );

        if (!adminOnline && isFromCurrentUser && noRecentAiResponse) {
          // Create a unique ID for the typing indicator outside the try block
          // so it's accessible in the catch block
          const typingId = `typing-indicator-${Date.now()}`;
          try {
            // Show typing indicator
            setStoredMessages((prev) => [
              ...prev,
              {
                id: typingId,
                content: "...",
                user: { name: "AI Assistant" },
                createdAt: new Date().toISOString(),
                isTyping: true,
              },
            ]);

            // Generate AI response
            const aiResponse = await generateAIResponse(latestMessage.content);

            // Create AI message with a unique ID
            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              content: aiResponse,
              user: {
                name: "AI Assistant",
              },
              createdAt: new Date().toISOString(),
            };

            // Replace typing indicator with actual message
            setStoredMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId).concat(aiMessage)
            );

            // Persist AI message to database
            await chatService.saveMessage(aiMessage, "customer-support", true);
          } catch (error) {
            console.error("Error generating AI response:", error);

            // Remove typing indicator if there was an error
            setStoredMessages((prev) =>
              prev.filter((msg) => msg.id !== typingId || !msg.isTyping)
            );
          }
        }
      }
    }
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center justify-between p-3 border-b border-border bg-primary text-primary-foreground'>
        <div className='flex flex-col'>
          <h3 className='font-medium'>Customer Support</h3>
          {loading ? (
            <span className='text-xs text-primary-foreground/70'>
              Loading chat history...
            </span>
          ) : adminOnline ? (
            <span className='text-xs text-primary-foreground/70'>
              Support agents are online
            </span>
          ) : (
            <span className='text-xs text-primary-foreground/70'>
              AI assistant is responding
            </span>
          )}
        </div>
        {onClose && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='h-8 w-8 rounded-full hover:bg-primary-foreground/20'
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex-1 overflow-hidden'>
        <RealtimeChat
          roomName='customer-support'
          username={username}
          onMessage={handleMessage}
          messages={storedMessages}
          showTypingIndicator={true}
          onFileUpload={async (file) => {
            try {
              // In a real implementation, you would upload the file
              // to storage and send a message with the file URL
              const fileUrl = URL.createObjectURL(file);

              // Generate unique ID for this file message
              const fileId = crypto.randomUUID();

              // For now, just send a message with the file name
              const fileMessage: ChatMessage = {
                id: fileId,
                content: `Sent file: ${file.name} (this would be a real file attachment in production)`,
                user: { name: username },
                createdAt: new Date().toISOString(),
                attachment: {
                  name: file.name,
                  type: file.type,
                  url: fileUrl,
                  size: file.size,
                },
              };

              // Add the message to stored messages with deduplication
              setStoredMessages((prev) => {
                // Don't add if we already have this message ID
                if (prev.some((msg) => msg.id === fileId)) {
                  return prev;
                }
                return [...prev, fileMessage];
              });

              // Also persist file message to database
              await chatService.saveMessage(
                fileMessage,
                "customer-support",
                false
              );
            } catch (error) {
              console.error("Error handling file upload:", error);
              // Show error toast or notification to the user
            }
          }}
        />
      </div>
    </div>
  );
};
