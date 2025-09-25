'use client';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { type Message } from '@/server/db/schema';

interface ChatInterfaceProps {
  sessionId: string;
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatInterface({
  messages,
  isLoading,
  isStreaming,
  onSendMessage
}: ChatInterfaceProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4 flex justify-between items-center bg-background">
        <div>
          <h2 className="font-semibold">Career Counseling Chat</h2>
          <p className="text-sm text-muted-foreground">
            Get personalized career advice and guidance
          </p>
        </div>
        <ThemeToggle />
      </div>
      
      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages} 
          isLoading={isLoading} 
          isStreaming={isStreaming} 
          onSuggestionClick={onSendMessage}
        />
      </div>
      
      {/* Input - Sticky at bottom */}
      <div className="flex-shrink-0 bg-background border-t">
        <MessageInput onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}