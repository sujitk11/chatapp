'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { SessionList } from '@/components/chat/SessionList';
import { api } from '@/app/providers';
import { generateSessionId } from '@/lib/utils';

export default function HomePage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch sessions
  const { data: sessions = [], refetch: refetchSessions } = api.session.list.useQuery({
    userId: undefined, // Anonymous for now
  });

  // Fetch active session with messages
  const { data: activeSession, refetch: refetchMessages } = api.session.getById.useQuery(
    { id: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchSessions();
    },
  });

  // Create session mutation
  const createSession = api.session.create.useMutation({
    onSuccess: (newSession) => {
      setActiveSessionId(newSession.id);
      refetchSessions();
    },
  });

  // Delete session mutation
  const deleteSession = api.session.delete.useMutation({
    onSuccess: () => {
      refetchSessions();
      if (activeSessionId === deleteSession.variables?.id) {
        setActiveSessionId(null);
      }
    },
  });

  // Create initial session if none exist
  useEffect(() => {
    if (sessions.length === 0 && !createSession.isPending) {
      handleNewSession();
    }
  }, [sessions]);

  const handleNewSession = () => {
    createSession.mutate({
      title: 'New Career Consultation',
    });
  };

  const handleSendMessage = async (message: string) => {
    if (!activeSessionId) {
      // Create a new session if none exists
      const newSession = await createSession.mutateAsync({
        title: 'Career Consultation',
      });
      setActiveSessionId(newSession.id);
      
      // Send message to new session
      sendMessage.mutate({
        sessionId: newSession.id,
        message,
      });
    } else {
      sendMessage.mutate({
        sessionId: activeSessionId,
        message,
      });
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteSession.mutate({ id: sessionId });
    }
  };

  return (
    <div className="flex h-screen">
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId || undefined}
        onSessionClick={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
      {activeSessionId && (
        <ChatInterface
          sessionId={activeSessionId}
          messages={activeSession?.messages || []}
          isLoading={sendMessage.isPending}
          onSendMessage={handleSendMessage}
        />
      )}
      {!activeSessionId && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Career Counseling Chat</h2>
            <p>Select a conversation or start a new one to begin.</p>
          </div>
        </div>
      )}
    </div>
  );
}