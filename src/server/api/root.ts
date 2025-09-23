import { createTRPCRouter } from './trpc';
import { sessionRouter } from './routers/session';
import { messageRouter } from './routers/message';
import { chatRouter } from './routers/chat';

export const appRouter = createTRPCRouter({
  session: sessionRouter,
  message: messageRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;