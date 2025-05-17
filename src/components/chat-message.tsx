import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-realtime-chat";
import { Paperclip, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  // Check if message has an attachment or is a typing indicator
  const hasAttachment = !!message.attachment;
  const isTypingIndicator = message.isTyping;

  return (
    <div
      className={`flex mt-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={cn("max-w-[75%] w-fit flex flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 text-xs px-3", {
              "justify-end flex-row-reverse": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className='text-foreground/50 text-xs'>
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "py-2 px-3 rounded-xl text-sm w-fit",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
            isTypingIndicator && "animate-pulse"
          )}
        >
          {/* Text content */}
          <div>{message.content}</div>

          {/* File Attachment */}
          {hasAttachment && (
            <div className="mt-2 border rounded-md p-2 flex items-center gap-2">
              <div className="bg-background/10 p-1 rounded">
                <File className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-medium truncate">{message?.attachment.name}</div>
                <div className="text-xs opacity-70">
                  {formatFileSize(message?.attachment.size)}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title="Download file"
                onClick={() => {
                  if (message.attachment?.url) {
                    window.open(message.attachment.url, '_blank');
                  }
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Message Status */}
        {isOwnMessage && message.status && (
          <span className="text-xs text-muted-foreground px-3">
            {message.status}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
}

