'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionCard } from './SessionCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { type ChatSession } from '@/server/db/schema';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionClick,
  onNewSession,
  onDeleteSession
}: SessionListProps) {
  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNewSession} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                summary={session.summary}
                updatedAt={session.updatedAt}
                onClick={() => onSessionClick(session.id)}
                onDelete={onDeleteSession ? () => onDeleteSession(session.id) : undefined}
                isActive={session.id === activeSessionId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}