'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { SessionList } from '@/components/chat/SessionListWithMultiSelect';
import { Header } from '@/components/layout/Header';
import { api } from '@/app/providers';
import { type Message } from '@/server/db/schema';

interface HomePageProps {
  urlChatId?: string;
}

export default function HomePage({ urlChatId }: HomePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showLoader, setShowLoader] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const pendingUserMessageRef = useRef<Message | null>(null);
  const pendingAssistantMessageRef = useRef<Message | null>(null);
  const skipSyncRef = useRef(false);

  // Get current user
  const { data: currentUser, isLoading: userLoading, dataUpdatedAt: userDataUpdatedAt } = api.auth.me.useQuery();

  // Track previous user to detect changes
  const prevUserRef = useRef<string | null | undefined>(undefined);

  // Fetch sessions - only fetch after we know user status
  const { data: sessionData, refetch: refetchSessions } = api.session.list.useQuery(
    {
      userId: currentUser?.id,
      limit: 20,
      offset: 0,
    },
    {
      enabled: !userLoading, // Only fetch sessions after user loading is done
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale
      cacheTime: 0, // Don't cache
    }
  );
  
  // CRITICAL: Only use sessions if they match current auth state
  const sessions = React.useMemo(() => {
    if (!sessionData?.sessions) return [];
    
    // If logged out, filter to only show anonymous sessions
    if (!currentUser) {
      return sessionData.sessions.filter(s => !s.userId);
    }
    
    // If logged in, filter to only show user's sessions
    return sessionData.sessions.filter(s => s.userId === currentUser.id);
  }, [sessionData?.sessions, currentUser]);

  // Only fetch session if we have a valid UUID
  const isValidUUID = activeSessionId && 
    activeSessionId.length === 36 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activeSessionId);

  // Fetch active session messages - skip if no valid session ID
  const { data: activeSession, refetch: refetchMessages } = api.session.getById.useQuery(
    { id: activeSessionId || '' },
    { 
      enabled: Boolean(isValidUUID && activeSessionId),
      retry: false,
      staleTime: 5000, // Keep data fresh for 5 seconds
    }
  );

  // Update local messages when switching sessions
  useEffect(() => {
    // Only sync with server data when:
    // 1. We have messages from the server
    // 2. We're not currently streaming
    // 3. We're not in the middle of a mutation
    // 4. We haven't explicitly skipped sync (after sending a message)
    if (activeSession?.messages && !isStreaming && !pendingUserMessageRef.current && !skipSyncRef.current) {
      setLocalMessages(activeSession.messages);
    }
  }, [activeSession?.messages, activeSessionId, isStreaming]);

  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onMutate: async ({ message }) => {
      // Prevent syncing with server data while we're mutating
      skipSyncRef.current = true;
      
      // Add user message immediately to local state
      const tempUserMsg: Message = {
        id: `temp-user-${Date.now()}`,
        sessionId: activeSessionId!,
        role: 'user',
        content: message,
        createdAt: new Date(),
        updatedAt: new Date(),
        tokens: null,
      };
      
      pendingUserMessageRef.current = tempUserMsg;
      setLocalMessages(prev => [...prev, tempUserMsg]);
      setShowLoader(true);
    },
    onSuccess: (data) => {
      // Get the actual saved messages
      const savedUserMessage = data.userMessage;
      const savedAssistantMessage = data.assistantMessage;
      
      // Replace temp user message with real one
      const tempUserId = pendingUserMessageRef.current?.id;
      pendingUserMessageRef.current = null;
      
      setLocalMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserId);
        return [...filtered, savedUserMessage];
      });
      
      // Immediately start streaming (no delay)
      setShowLoader(false);
      setIsStreaming(true);
      
      const tempAssistantMsg: Message = {
        ...savedAssistantMessage,
        content: '', // Start with empty content for streaming
      };
      
      pendingAssistantMessageRef.current = tempAssistantMsg;
      setLocalMessages(prev => [...prev, tempAssistantMsg]);
      
      // Stream the text
      const fullText = savedAssistantMessage.content;
      let index = 0;
      
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      
      streamIntervalRef.current = setInterval(() => {
        if (index < fullText.length) {
          const chunk = fullText.slice(0, index + 5); // Faster streaming
          
          // Update the assistant message content
          setLocalMessages(prev => {
            const msgs = [...prev];
            const lastMsgIndex = msgs.findIndex(m => m.id === savedAssistantMessage.id);
            if (lastMsgIndex !== -1) {
              msgs[lastMsgIndex] = {
                ...msgs[lastMsgIndex],
                content: chunk
              };
            }
            return msgs;
          });
          
          index += 5;
        } else {
          // Streaming complete
          clearInterval(streamIntervalRef.current!);
          streamIntervalRef.current = null;
          setIsStreaming(false);
          pendingAssistantMessageRef.current = null;
          
          // Update with full content
          setLocalMessages(prev => {
            const msgs = [...prev];
            const lastMsgIndex = msgs.findIndex(m => m.id === savedAssistantMessage.id);
            if (lastMsgIndex !== -1) {
              msgs[lastMsgIndex] = savedAssistantMessage;
            }
            return msgs;
          });
          
          // Only refetch sessions list, not messages
          refetchSessions();
          
          // Re-enable syncing after a delay to ensure state is stable
          setTimeout(() => {
            skipSyncRef.current = false;
          }, 100);
        }
      }, 10); // Faster interval
    },
    onError: () => {
      setShowLoader(false);
      setIsStreaming(false);
      
      // Remove the temp user message on error
      const tempUserId = pendingUserMessageRef.current?.id;
      pendingUserMessageRef.current = null;
      skipSyncRef.current = false;
      
      if (tempUserId) {
        setLocalMessages(prev => prev.filter(m => m.id !== tempUserId));
      }
    }
  });

  // Track newly created sessions to avoid redirect issues
  const newSessionRef = useRef<string | null>(null);

  // Create session mutation
  const createSession = api.session.create.useMutation({
    onSuccess: async (newSession) => {
      // Mark this as a new session to prevent redirect
      newSessionRef.current = newSession.id;
      setActiveSessionId(newSession.id);
      setLocalMessages([]);
      
      // Refetch sessions first to include the new one
      await refetchSessions();
      
      // Then navigate to the new chat
      router.push(`/chat/${newSession.id}`);
    },
  });

  // Delete session mutation
  const deleteSession = api.session.delete.useMutation({
    onSuccess: () => {
      refetchSessions();
      if (activeSessionId === deleteSession.variables?.id) {
        router.push('/');
        setActiveSessionId(null);
        setLocalMessages([]);
      }
    },
  });

  // Delete multiple sessions
  const deleteMultipleSessions = api.session.deleteMultiple.useMutation({
    onSuccess: (data) => {
      refetchSessions();
      if (activeSessionId && data.deletedIds.includes(activeSessionId)) {
        router.push('/');
        setActiveSessionId(null);
        setLocalMessages([]);
      }
    },
  });

  // Initialize from URL or localStorage
  useEffect(() => {
    // Don't initialize if we're loading, or creating a session, or already initialized
    if (hasInitialized.current || userLoading || sessionData === undefined || createSession.isPending) return;
    hasInitialized.current = true;

    // Use URL chat ID if available
    if (urlChatId && urlChatId !== 'new') {
      // Don't redirect if this is a newly created session
      if (newSessionRef.current === urlChatId) {
        setActiveSessionId(urlChatId);
        newSessionRef.current = null; // Clear the flag
        return;
      }
      
      // Verify this session belongs to current user
      if (sessions.some(s => s.id === urlChatId)) {
        setActiveSessionId(urlChatId);
      } else {
        // Session doesn't belong to user, redirect to home
        router.push('/');
        setActiveSessionId(null);
      }
      return;
    }

    // Check pathname for chat ID
    if (pathname.startsWith('/chat/')) {
      const chatId = pathname.split('/')[2];
      if (chatId && chatId !== 'new') {
        // Don't redirect if this is a newly created session
        if (newSessionRef.current === chatId) {
          setActiveSessionId(chatId);
          newSessionRef.current = null; // Clear the flag
          return;
        }
        
        // Verify this session belongs to current user
        if (sessions.some(s => s.id === chatId)) {
          setActiveSessionId(chatId);
        } else {
          // Session doesn't belong to user, redirect to home
          router.push('/');
          setActiveSessionId(null);
        }
        return;
      }
    }

    // Fallback to localStorage only if session belongs to user
    const storedId = localStorage.getItem('activeSessionId');
    if (storedId && sessions.some(s => s.id === storedId)) {
      setActiveSessionId(storedId);
      router.push(`/chat/${storedId}`);
    } else if (storedId) {
      // Clear invalid session from localStorage
      localStorage.removeItem('activeSessionId');
    }
  }, [urlChatId, pathname, sessions, router, userLoading]);

  // Update localStorage when active session changes
  useEffect(() => {
    if (activeSessionId) {
      // Only store if session belongs to current user
      if (sessions.some(s => s.id === activeSessionId)) {
        localStorage.setItem('activeSessionId', activeSessionId);
      }
    } else {
      localStorage.removeItem('activeSessionId');
    }
  }, [activeSessionId, sessions]);

  // Cleanup and handle user changes
  useEffect(() => {
    if (userLoading) return;
    
    const currentUserId = currentUser?.id || null;
    
    // Detect user change (login/logout)
    if (prevUserRef.current !== undefined && prevUserRef.current !== currentUserId) {
      console.log('[Auth Change] User changed from', prevUserRef.current, 'to', currentUserId);
      
      // User changed - clear everything immediately
      setActiveSessionId(null);
      setLocalMessages([]);
      localStorage.removeItem('activeSessionId');
      hasInitialized.current = false;
      
      // Stop any streaming
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      
      // Navigate to home
      if (pathname.startsWith('/chat/')) {
        router.push('/');
      }
      
      // Force refetch sessions for new user state
      refetchSessions();
    }
    
    prevUserRef.current = currentUserId;
    
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [currentUser, userLoading, pathname, router, refetchSessions]);

  const handleNewSession = () => {
    // Stop any ongoing streaming
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    setIsStreaming(false);
    pendingUserMessageRef.current = null;
    pendingAssistantMessageRef.current = null;
    skipSyncRef.current = false; // Reset sync flag
    
    createSession.mutate({
      title: 'New Career Consultation',
      userId: currentUser?.id, // Pass current user ID if logged in
    });
  };

  const handleSessionClick = (sessionId: string) => {
    // Stop any ongoing streaming
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    router.push(`/chat/${sessionId}`);
    setActiveSessionId(sessionId);
    setLocalMessages([]);
    setShowLoader(false);
    setIsStreaming(false);
    pendingUserMessageRef.current = null;
    pendingAssistantMessageRef.current = null;
    skipSyncRef.current = false; // Allow syncing when switching sessions
  };

  const handleSendMessage = async (message: string) => {
    if (!activeSessionId || sendMessage.isPending || !message.trim() || isStreaming) return;
    
    sendMessage.mutate({
      sessionId: activeSessionId,
      message: message.trim(),
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession.mutate({ id: sessionId });
  };

  const handleDeleteMultiple = (sessionIds: string[]) => {
    deleteMultipleSessions.mutate({ ids: sessionIds });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId || undefined}
          onSessionClick={handleSessionClick}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onDeleteMultiple={handleDeleteMultiple}
        />
        
        {activeSessionId && (
          <div className="flex-1 flex overflow-hidden">
            <ChatInterface
              sessionId={activeSessionId}
              messages={localMessages}
              isLoading={showLoader}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
        
        {!activeSessionId && sessions.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">
                {currentUser ? `Welcome back, ${currentUser.name || currentUser.email}!` : 'Welcome to Career Counseling Chat'}
              </h2>
              <p className="text-muted-foreground">Get personalized career advice and guidance</p>
              <button
                onClick={handleNewSession}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                disabled={createSession.isPending}
              >
                Start Your First Chat
              </button>
            </div>
          </div>
        )}
        
        {!activeSessionId && sessions.length > 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Select a Conversation</h2>
              <p className="text-muted-foreground">Choose a chat from the sidebar or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}