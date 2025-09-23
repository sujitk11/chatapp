'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './MessageItem';
import { type Message } from '@/server/db/schema';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Ask me anything about your career goals, job search, or professional development.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-0">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            role={message.role as 'user' | 'assistant'}
            content={message.content}
            createdAt={message.createdAt}
          />
        ))}
        {isLoading && (
          <div className="flex gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2 w-24 bg-muted rounded animate-pulse" />
              <div className="h-2 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}