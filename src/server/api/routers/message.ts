import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { messages, chatSessions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const messageRouter = createTRPCRouter({
  // Add a message to a session
  create: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
      tokens: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session exists
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Insert message
      const [message] = await ctx.db
        .insert(messages)
        .values({
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          tokens: input.tokens,
        })
        .returning();

      // Update session's updatedAt
      await ctx.db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, input.sessionId));

      return message;
    }),

  // Get messages for a session
  list: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const sessionMessages = await ctx.db.query.messages.findMany({
        where: eq(messages.sessionId, input.sessionId),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        limit: input.limit,
      });

      return {
        messages: sessionMessages,
        nextCursor: sessionMessages.length === input.limit 
          ? sessionMessages[sessionMessages.length - 1]?.id 
          : undefined,
      };
    }),

  // Delete a message
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(messages)
        .where(eq(messages.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      return deleted;
    }),
});