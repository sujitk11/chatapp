'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { type Message } from '@/server/db/schema';
import { MessageSquare, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  pendingMessageId?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function MessageList({ messages, isLoading, isStreaming, onSuggestionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or loader appears
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading, isStreaming]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="text-center space-y-6 mb-8">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">How can I help you today?</h3>
              <p className="text-muted-foreground">
                I&apos;m here to assist with your career journey
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center font-medium">Try asking about:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
              <button 
                onClick={() => onSuggestionClick?.('I am thinking about changing careers. What should I consider?')}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Career transitions</div>
                    <div className="text-xs text-muted-foreground mt-1">Explore new paths and opportunities</div>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => onSuggestionClick?.('Can you help me improve my resume?')}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Resume tips</div>
                    <div className="text-xs text-muted-foreground mt-1">Improve your job application materials</div>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => onSuggestionClick?.('How should I prepare for an upcoming interview?')}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Interview preparation</div>
                    <div className="text-xs text-muted-foreground mt-1">Get ready for your next opportunity</div>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => onSuggestionClick?.('What skills should I develop for career growth?')}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-border transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Skill development</div>
                    <div className="text-xs text-muted-foreground mt-1">Identify areas for growth</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0 p-4">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isStreamingMsg = isLast && message.role === 'assistant' && isStreaming;
          const isPending = message.id.startsWith('temp-');
          
          return (
            <MessageItem
              key={`${message.id}-${index}`}
              role={message.role as 'user' | 'assistant'}
              content={message.content}
              createdAt={message.createdAt}
              status={message.role === 'user' ? (isPending ? 'sending' : 'delivered') : undefined}
              isStreaming={isStreamingMsg}
              isLastMessage={isLast}
            />
          );
        })}
        
        {/* Show typing indicator when processing but not streaming */}
        {isLoading && !isStreaming && <TypingIndicator />}
        
        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  );
}