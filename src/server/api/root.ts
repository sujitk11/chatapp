import { createTRPCRouter } from './trpc';
import { sessionRouter } from './routers/session';
import { messageRouter } from './routers/message';
import { chatRouter } from './routers/chat';
import { authRouter } from './routers/auth';

export const appRouter = createTRPCRouter({
  session: sessionRouter,
  message: messageRouter,
  chat: chatRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;