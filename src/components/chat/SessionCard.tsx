'use client';

import { formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  id: string;
  title: string;
  summary?: string | null;
  updatedAt: Date | string;
  messageCount?: number;
  onClick: () => void;
  onDelete?: () => void;
  isActive?: boolean;
}

export function SessionCard({
  title,
  updatedAt,
  messageCount,
  onClick,
  onDelete,
  isActive
}: SessionCardProps) {
  return (
    <div 
      className={`
        group relative cursor-pointer rounded-lg px-3 py-2.5
        transition-all duration-200
        ${isActive 
          ? 'bg-accent text-accent-foreground' 
          : 'hover:bg-accent/50'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
              {title}
            </h3>
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(updatedAt)}</span>
            {messageCount !== undefined && (
              <>
                <span>•</span>
                <span>{messageCount} messages</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}