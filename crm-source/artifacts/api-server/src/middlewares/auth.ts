import type { NextFunction, Request, Response } from "express";
import { getSession, revokeSession, type SessionRecord } from "../auth/sessions";
import { findUserById, toAuthUser, type AuthUser, type UserRole } from "../auth/users";

type AuthContext = {
  token: string;
  session: SessionRecord;
  user: AuthUser;
};

function getBearerToken(req: Request): string | null {
  const header = req.header("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

function getStoredAuthContext(res: Response): AuthContext | null {
  return (res.locals.auth as AuthContext | undefined) ?? null;
}

function respondUnauthorized(res: Response): void {
  res.status(401).json({ message: "Authentication required" });
}

export async function attachAuthContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getBearerToken(req);
    if (!token) {
      next();
      return;
    }

    const session = await getSession(token);
    if (!session) {
      next();
      return;
    }

    const user = await findUserById(session.userId);
    if (!user) {
      await revokeSession(token);
      next();
      return;
    }

    res.locals.auth = {
      token,
      session,
      user: toAuthUser(user),
    } satisfies AuthContext;

    next();
  } catch (error) {
    next(error);
  }
}

export function getAuthContext(res: Response): AuthContext | null {
  return getStoredAuthContext(res);
}

export function requireAuthContext(res: Response): AuthContext | null {
  const auth = getStoredAuthContext(res);
  if (!auth) {
    respondUnauthorized(res);
    return null;
  }

  return auth;
}

export function requireAuthenticated(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!getStoredAuthContext(res)) {
    respondUnauthorized(res);
    return;
  }

  next();
}

export function requireRole(role: UserRole) {
  return function roleGuard(_req: Request, res: Response, next: NextFunction): void {
    const auth = getStoredAuthContext(res);
    if (!auth) {
      respondUnauthorized(res);
      return;
    }

    if (auth.user.role !== role) {
      res.status(403).json({ message: "Insufficient role" });
      return;
    }

    next();
  };
}
