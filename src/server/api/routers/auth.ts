import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { createUser, verifyUser, createSession, destroySession, getSession } from '@/lib/auth';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
  // Register new user
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const user = await createUser(input.email, input.password, input.name);
        await createSession(user.id);
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message === 'User already exists') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),
  
  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await verifyUser(input.email, input.password);
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }
      
      await createSession(user.id);
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),
  
  // Logout
  logout: publicProcedure
    .mutation(async () => {
      await destroySession();
      return { success: true };
    }),
  
  // Get current user
  me: publicProcedure
    .query(async () => {
      const session = await getSession();
      
      if (!session) {
        return null;
      }
      
      return {
        id: session.userId,
        email: session.email,
        name: session.name,
      };
    }),
});