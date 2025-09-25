'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled, placeholder = "Ask about career advice..." }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <div className="absolute bottom-3 right-2">
            <Button
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground gap-2">
        <Sparkles className="h-3 w-3" />
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}