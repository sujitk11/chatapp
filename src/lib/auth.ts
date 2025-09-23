import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple password hashing (in production, use bcrypt or argon2)
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + process.env.AUTH_SECRET || 'default-secret')
    .digest('hex');
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Session management
export async function createSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  // Store session in cookie
  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  // In a real app, you'd also store this in a sessions table
  // For now, we'll encode the userId in the token
  const encodedSession = Buffer.from(JSON.stringify({ userId, token: sessionToken })).toString('base64');
  (await cookies()).set('user_session', encodedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  
  return sessionToken;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  
  if (!sessionCookie) return null;
  
  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });
    
    if (!user) return null;
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('user_session');
}

// User operations
export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = hashPassword(password);
  
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
  }).returning();
  
  return user;
}

export async function verifyUser(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (!user || !user.passwordHash) {
    return null;
  }
  
  if (!comparePassword(password, user.passwordHash)) {
    return null;
  }
  
  return user;
}