import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { chatSessions } from '@/server/db/schema';
import { eq, desc, sql, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const sessionRouter = createTRPCRouter({
  // Create a new chat session
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      userId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(chatSessions)
        .values({
          title: input.title,
          userId: input.userId || null,
        })
        .returning();

      return session;
    }),

  // Get all sessions for a user (or anonymous) with pagination
  list: publicProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db
        .select()
        .from(chatSessions)
        .where(
          input.userId 
            ? eq(chatSessions.userId, input.userId)
            : isNull(chatSessions.userId)
        )
        .orderBy(desc(chatSessions.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(chatSessions)
        .where(
          input.userId 
            ? eq(chatSessions.userId, input.userId)
            : isNull(chatSessions.userId)
        );

      return {
        sessions,
        total: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  // Get a single session with messages
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.id),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return session;
    }),

  // Update session title or summary
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      summary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(chatSessions)
        .set({
          ...(input.title && { title: input.title }),
          ...(input.summary && { summary: input.summary }),
          updatedAt: new Date(),
        })
        .where(eq(chatSessions.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return updated;
    }),

  // Delete a session
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(chatSessions)
        .where(eq(chatSessions.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return deleted;
    }),
});