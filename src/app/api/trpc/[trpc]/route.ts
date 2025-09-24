import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/api/root';
import { db } from '@/server/db';
import { getSession } from '@/lib/auth';

// Create context for App Router
const createContext = async () => {
  // Get the session from the cookie
  const session = await getSession();
  const user = session ? { id: session.userId, email: session.email } : null;
  
  return {
    db,
    user,
  };
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };