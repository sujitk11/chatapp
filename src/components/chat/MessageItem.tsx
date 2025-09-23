'use client';

import { cn, formatDate } from '@/lib/utils';
import { User, Bot, Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date | string;
  status?: 'sending' | 'sent' | 'delivered';
}

export function MessageItem({ role, content, createdAt, status = 'delivered' }: MessageItemProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-muted/50' : '')}>
      <div className="flex-shrink-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'Career Counselor'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt)}
          </span>
          {isUser && (
            <span className="text-xs text-muted-foreground">
              {status === 'sending' && '• Sending...'}
              {status === 'sent' && <Check className="inline w-3 h-3" />}
              {status === 'delivered' && <CheckCheck className="inline w-3 h-3" />}
            </span>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}