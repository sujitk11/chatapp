import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { chatSessions } from '@/server/db/schema';
import { eq, desc, sql, isNull, inArray } from 'drizzle-orm';
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
          userId: input.userId || ctx.user?.id || null,
        })
        .returning();

      return session;
    }),

  // Get all sessions for a user (or anonymous) with pagination
  list: publicProcedure
    .input(z.object({
      userId: z.string().uuid().optional().nullable(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
      showAll: z.boolean().optional(), // Temporary flag to show all sessions
    }))
    .query(async ({ ctx, input }) => {
      // Get current user from context - this comes from the auth session
      const currentUserId = ctx.user?.id;
      
      let sessions;
      let count;
      
      // CRITICAL: Enforce strict session filtering based on auth status
      if (currentUserId) {
        // User is logged in - show ONLY their sessions
        sessions = await ctx.db
          .select()
          .from(chatSessions)
          .where(eq(chatSessions.userId, currentUserId))
          .orderBy(desc(chatSessions.updatedAt))
          .limit(input.limit)
          .offset(input.offset);
          
        const [countResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(chatSessions)
          .where(eq(chatSessions.userId, currentUserId));
        count = countResult.count;
      } else {
        // User is NOT logged in - show ONLY anonymous sessions
        sessions = await ctx.db
          .select()
          .from(chatSessions)
          .where(isNull(chatSessions.userId))
          .orderBy(desc(chatSessions.updatedAt))
          .limit(input.limit)
          .offset(input.offset);
          
        const [countResult] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(chatSessions)
          .where(isNull(chatSessions.userId));
        count = countResult.count;
      }

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
      // Validate input
      if (!input.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Session ID is required',
        });
      }
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
      // First check if user owns this session
      const session = await ctx.db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, input.id),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      const currentUserId = ctx.user?.id;
      // Check ownership
      if (session.userId !== currentUserId) {
        if (session.userId || (!session.userId && currentUserId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this session',
          });
        }
      }

      const [deleted] = await ctx.db
        .delete(chatSessions)
        .where(eq(chatSessions.id, input.id))
        .returning();

      return deleted;
    }),

  // Delete multiple sessions
  deleteMultiple: publicProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(chatSessions)
        .where(inArray(chatSessions.id, input.ids))
        .returning();

      return {
        deletedIds: deleted.map(d => d.id),
        count: deleted.length,
      };
    }),
});