'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import HomePage from '@/app/page';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;

  // Store the chat ID in localStorage for the main component to use
  useEffect(() => {
    if (chatId && chatId !== 'new') {
      localStorage.setItem('activeSessionId', chatId);
    }
  }, [chatId]);

  // Render the main HomePage component with the URL-based chat ID
  return <HomePage urlChatId={chatId} />;
}