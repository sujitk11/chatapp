import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { messages, chatSessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { generateAIResponse, generateSessionTitle } from '@/server/lib/ai';

export const chatRouter = createTRPCRouter({
  // Send a message and get AI response with simulated streaming
  sendMessage: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session exists and user has access
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

      // Check if user has access to this session
      const currentUserId = ctx.user?.id;
      if (session.userId !== currentUserId) {
        // If session has a userId and it doesn't match current user, deny access
        if (session.userId && session.userId !== currentUserId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }
        // If user is logged in but session is anonymous, deny access
        if (currentUserId && !session.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this session',
          });
        }
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

        // Update session's updatedAt and title if it's the first real message
        const updates: { updatedAt: Date; title?: string } = { updatedAt: new Date() };
        
        // Generate better title from first message
        if (session.messages.length === 0 && (session.title === 'New Career Consultation' || session.title === 'Career Consultation')) {
          updates.title = await generateSessionTitle(input.message);
        }
        
        await ctx.db
          .update(chatSessions)
          .set(updates)
          .where(eq(chatSessions.id, input.sessionId));

        return {
          userMessage,
          assistantMessage,
        };
      } catch (error) {
        console.error('AI Response Error:', error);
        
        // Save error message
        await ctx.db
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
});