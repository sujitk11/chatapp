'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, X, CheckSquare } from 'lucide-react';
import { type ChatSession } from '@/server/db/schema';
import { SessionCard } from './SessionCard';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionClick: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onDeleteMultiple?: (sessionIds: string[]) => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSessionClick,
  onNewSession,
  onDeleteSession,
  onDeleteMultiple
}: SessionListProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    sessionId?: string;
    multiple?: boolean;
  }>({ open: false });

  const handleToggleSelect = (sessionId: string) => {
    const newSelection = new Set(selectedSessions);
    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }
    setSelectedSessions(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)));
    }
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    setSelectedSessions(new Set());
  };

  const handleDeleteClick = (sessionId: string) => {
    setDeleteConfirm({
      open: true,
      sessionId,
      multiple: false
    });
  };

  const handleDeleteMultipleClick = () => {
    if (selectedSessions.size > 0) {
      setDeleteConfirm({
        open: true,
        multiple: true
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.multiple && onDeleteMultiple) {
      onDeleteMultiple(Array.from(selectedSessions));
      setSelectedSessions(new Set());
      setIsSelecting(false);
    } else if (deleteConfirm.sessionId && onDeleteSession) {
      onDeleteSession(deleteConfirm.sessionId);
    }
    setDeleteConfirm({ open: false });
  };

  return (
    <>
      <div className="w-80 border-r flex flex-col h-full bg-muted/10">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Chats</h2>
          <Button 
            onClick={onNewSession} 
            className="w-full justify-start" 
            variant="secondary"
            size="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          
          {sessions.length > 0 && (
            <div className="mt-2">
              {!isSelecting ? (
                <Button
                  onClick={() => setIsSelecting(true)}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckSquare className="h-3 w-3 mr-2" />
                  Select Multiple
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSelectAll}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      {selectedSessions.size === sessions.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={handleCancelSelection}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedSessions.size > 0 && (
                    <Button
                      onClick={handleDeleteMultipleClick}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedSessions.size} Selected
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "New Chat" to start</p>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                {sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className={`
                      flex items-center gap-2 rounded-lg px-2 py-1
                      transition-all duration-200
                      ${isSelecting && selectedSessions.has(session.id) 
                        ? 'bg-primary/10 scale-[0.98]' 
                        : ''
                      }
                    `}
                  >
                    {isSelecting && (
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={() => handleToggleSelect(session.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <SessionCard
                        id={session.id}
                        title={session.title}
                        summary={session.summary}
                        updatedAt={session.updatedAt}
                        onClick={() => {
                          if (!isSelecting) {
                            onSessionClick(session.id);
                          } else {
                            handleToggleSelect(session.id);
                          }
                        }}
                        onDelete={!isSelecting && onDeleteSession ? () => handleDeleteClick(session.id) : undefined}
                        isActive={!isSelecting && session.id === activeSessionId}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.multiple
                ? `This will permanently delete ${selectedSessions.size} chat session${selectedSessions.size > 1 ? 's' : ''} and all associated messages. This action cannot be undone.`
                : 'This will permanently delete this chat session and all its messages. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}