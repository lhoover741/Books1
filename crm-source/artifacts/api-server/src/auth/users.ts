import { eq } from "drizzle-orm";
import { verifyPassword } from "./password";

export type UserRole = "client" | "admin";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type AuthUser = Omit<UserRecord, "password">;

type DbModule = typeof import("@workspace/db");

let dbModulePromise: Promise<DbModule> | null = null;

const DEMO_USERS: UserRecord[] = [
  {
    id: "user-client-100",
    name: "Morgan Reader",
    email: "client@booksandbrews.app",
    role: "client",
    password: "brew-client-2026",
  },
  {
    id: "user-admin-100",
    name: "Rowan Harper",
    email: "admin@booksandbrews.app",
    role: "admin",
    password: "admin123",
  },
];

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

    console.warn("Auth database unavailable; using development demo users.");
    return null;
  }
}

function toUserRecordFromDb(input: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
}): UserRecord {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    password: input.passwordHash,
  };
}

async function findDbUserById(id: string): Promise<UserRecord | null> {
  const dbModule = await getDbModule();
  if (!dbModule) {
    return null;
  }

  const { db, usersTable } = dbModule;

  let user:
    | {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        passwordHash: string;
      }
    | undefined;

  try {
    [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        passwordHash: usersTable.passwordHash,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Auth user lookup failed; using development demo fallback.");
    return null;
  }

  if (!user) {
    return null;
  }

  return toUserRecordFromDb(user);
}

async function findDbUserByEmail(email: string): Promise<UserRecord | null> {
  const dbModule = await getDbModule();
  if (!dbModule) {
    return null;
  }

  const { db, usersTable } = dbModule;

  let user:
    | {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        passwordHash: string;
      }
    | undefined;

  try {
    [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        passwordHash: usersTable.passwordHash,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);
  } catch (error) {
    if (!isDemoFallbackEnabled()) {
      throw error;
    }

    console.warn("Auth user lookup failed; using development demo fallback.");
    return null;
  }

  if (!user) {
    return null;
  }

  return toUserRecordFromDb(user);
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const dbUser = await findDbUserById(id);
  if (dbUser) {
    return dbUser;
  }

  return isDemoFallbackEnabled() ? DEMO_USERS.find((user) => user.id === id) ?? null : null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const dbUser = await findDbUserByEmail(normalizedEmail);
  if (dbUser) {
    return dbUser;
  }

  return isDemoFallbackEnabled()
    ? DEMO_USERS.find((user) => user.email === normalizedEmail) ?? null
    : null;
}

export async function validateCredentials(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  return verifyPassword(password, user.password) ? user : null;
}

export function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
