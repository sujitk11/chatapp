'use client';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { type Message } from '@/server/db/schema';

interface ChatInterfaceProps {
  sessionId: string;
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage
}: ChatInterfaceProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="font-semibold">Career Counseling Chat</h2>
        <p className="text-sm text-muted-foreground">
          Get personalized career advice and guidance
        </p>
      </div>
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}