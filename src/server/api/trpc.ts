import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/server/db';

// Context type for both API routes and App Router
type Context = {
  db: typeof db;
  user: null | { id: string; email: string };
  req?: CreateNextContextOptions['req'];
  res?: CreateNextContextOptions['res'];
};

// For API routes (if needed in the future)
export const createTRPCContext = async (opts?: CreateNextContextOptions): Promise<Context> => {
  // Dynamic import to avoid circular dependency
  const { getSession } = await import('@/lib/auth');
  
  // Get the session from the cookie
  const session = await getSession();
  const user = session ? { id: session.userId, email: session.email } : null;

  return {
    db,
    user,
    req: opts?.req,
    res: opts?.res,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Public procedure - anyone can use
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication (we'll implement later)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});