'use client';

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((prev) => (prev === 3 ? 1 : prev + 1));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-3 p-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Career Counselor</span>
          <span className="text-xs text-muted-foreground">
            typing
            <span className="inline-flex items-center gap-0.5 ml-1">
              {[1, 2, 3].map((num) => (
                <span
                  key={num}
                  className="inline-block w-1 h-1 rounded-full"
                  style={{
                    opacity: num <= dotCount ? '1' : '0.3',
                    backgroundColor: num <= dotCount ? 'rgb(100, 100, 100)' : 'rgb(200, 200, 200)',
                  }}
                />
              ))}
            </span>
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap">Thinking...</div>
      </div>
    </div>
  );
}