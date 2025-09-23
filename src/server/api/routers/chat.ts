import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { messages, chatSessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { generateAIResponse } from '@/server/lib/ai';

export const chatRouter = createTRPCRouter({
  // Send a message and get AI response
  sendMessage: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session exists
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.sessionId),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            limit: 10, // Get last 10 messages for context
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Save user message
      const [userMessage] = await ctx.db
        .insert(messages)
        .values({
          sessionId: input.sessionId,
          role: 'user',
          content: input.message,
        })
        .returning();

      // Generate AI response
      try {
        const aiResponse = await generateAIResponse({
          message: input.message,
          previousMessages: session.messages,
          sessionContext: {
            title: session.title,
            summary: session.summary,
          },
        });

        // Save AI response
        const [assistantMessage] = await ctx.db
          .insert(messages)
          .values({
            sessionId: input.sessionId,
            role: 'assistant',
            content: aiResponse.content,
            tokens: aiResponse.tokens,
          })
          .returning();

        // Update session's updatedAt
        await ctx.db
          .update(chatSessions)
          .set({ updatedAt: new Date() })
          .where(eq(chatSessions.id, input.sessionId));

        return {
          userMessage,
          assistantMessage,
        };
      } catch (error) {
        console.error('AI Response Error:', error);
        
        // Save error message
        const [errorMessage] = await ctx.db
          .insert(messages)
          .values({
            sessionId: input.sessionId,
            role: 'assistant',
            content: 'I apologize, but I encountered an error while processing your request. Please try again.',
          })
          .returning();

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate AI response',
        });
      }
    }),

  // Stream a message response (for future enhancement)
  streamMessage: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      message: z.string().min(1),
    }))
    .subscription(async function* ({ ctx, input }) {
      // This is a placeholder for streaming implementation
      // We'll implement this later if needed
      yield { type: 'start' as const };
      yield { type: 'token' as const, content: 'Streaming not yet implemented' };
      yield { type: 'end' as const };
    }),
});