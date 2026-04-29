import { randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type SessionRecord = {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

type DbModule = typeof import("@workspace/db");

let dbModulePromise: Promise<DbModule> | null = null;
const memorySessions = new Map<string, SessionRecord>();

function isDemoFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function getDbModule(): Promise<DbModule | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  dbModulePromise ??= import("@workspace/db");

  try {
    return await dbModulePromise;
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Session database unavailable; using development memory sessions.");
    return null;
  }
}

function toSessionRecord(input: {
  id: string;
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}): SessionRecord {
  return {
    id: input.id,
    token: input.token,
    userId: input.userId,
    createdAt: input.createdAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
  };
}

function isExpired(expiresAt: string): boolean {
  return Date.now() >= Date.parse(expiresAt);
}

export async function createSession(input: {
  userId: string;
}): Promise<SessionRecord> {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);
  const id = randomUUID();
  const token = randomBytes(32).toString("hex");
  const session = toSessionRecord({
    id,
    token,
    userId: input.userId,
    createdAt,
    expiresAt,
  });

  const dbModule = await getDbModule();

  if (!dbModule) {
    if (!isDemoFallbackEnabled()) {
      throw new Error("Session database is not configured.");
    }

    memorySessions.set(token, session);
    return session;
  }

  const { db, sessionsTable } = dbModule;
  try {
    await db.insert(sessionsTable).values({
      id,
      userId: input.userId,
      token,
      createdAt,
      expiresAt,
    });
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Session insert failed; using development memory session.");
    memorySessions.set(token, session);
  }

  return session;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  const dbModule = await getDbModule();

  if (!dbModule) {
    if (!isDemoFallbackEnabled()) {
      throw new Error("Session database is not configured.");
    }

    const session = memorySessions.get(token);
    if (!session) {
      return null;
    }

    if (isExpired(session.expiresAt)) {
      memorySessions.delete(token);
      return null;
    }

    return session;
  }

  const { db, sessionsTable } = dbModule;
  let session:
    | {
        id: string;
        token: string;
        userId: string;
        createdAt: Date;
        expiresAt: Date;
      }
    | undefined;

  try {
    [session] = await db
      .select({
        id: sessionsTable.id,
        token: sessionsTable.token,
        userId: sessionsTable.userId,
        createdAt: sessionsTable.createdAt,
        expiresAt: sessionsTable.expiresAt,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1);
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Session lookup failed; using development memory session.");
    const sessionRecord = memorySessions.get(token);
    if (sessionRecord && isExpired(sessionRecord.expiresAt)) {
      memorySessions.delete(token);
      return null;
    }

    return sessionRecord ?? null;
  }

  if (!session) {
    return null;
  }

  const sessionRecord = toSessionRecord(session);
  if (isExpired(sessionRecord.expiresAt)) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
    return null;
  }

  return sessionRecord;
}

export async function revokeSession(token: string): Promise<void> {
  const dbModule = await getDbModule();

  if (!dbModule) {
    if (!isDemoFallbackEnabled()) {
      throw new Error("Session database is not configured.");
    }

    memorySessions.delete(token);
    return;
  }

  const { db, sessionsTable } = dbModule;
  try {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Session revoke failed; clearing development memory session.");
    memorySessions.delete(token);
  }
}
