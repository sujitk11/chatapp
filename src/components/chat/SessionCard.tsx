'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { MessageCircle, Trash2 } from 'lucide-react';
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
  summary,
  updatedAt,
  messageCount,
  onClick,
  onDelete,
  isActive
}: SessionCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${isActive ? 'border-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-sm font-medium line-clamp-1">
              {title}
            </CardTitle>
            {summary && (
              <CardDescription className="text-xs line-clamp-2">
                {summary}
              </CardDescription>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatDate(updatedAt)}</span>
              {messageCount !== undefined && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {messageCount}
                </span>
              )}
            </div>
          </div>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}