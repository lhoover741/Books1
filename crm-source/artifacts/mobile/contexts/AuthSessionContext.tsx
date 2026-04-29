import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  type AuthUser,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const TOKEN_KEY = "books-brews-auth-token";
const ADMIN_PASSWORD_RESET_REQUIRED_KEY = "books-brews-admin-password-reset-required";
const ADMIN_EMAIL = "admin@booksandbrews.app";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

type LoginInput = {
  email: string;
  password: string;
};

type LoginResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

type PasswordChangeResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

type AuthSessionContextValue = {
  status: AuthStatus;
  isLoading: boolean;
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  requiresPasswordReset: boolean;
  login: (input: LoginInput) => Promise<LoginResult>;
  completeFirstLoginPasswordChange: (newPassword: string) => Promise<PasswordChangeResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function normalizeAuthError(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const payload = (error as { data?: unknown }).data;
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }

  return "We could not sign you in with those credentials.";
}

function normalizePasswordChangeError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (error && typeof error === "object" && "data" in error) {
    const payload = (error as { data?: unknown }).data;
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }

  return "We could not update your password. Please try again.";
}

function resolveApiBaseUrl(): string | null {
  const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitApiUrl) {
    return explicitApiUrl.replace(/\/+$/, "");
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  if (!domain) {
    return null;
  }

  return `https://${domain}`.replace(/\/+$/, "");
}

function buildApiUrl(pathname: string): string {
  const baseUrl = resolveApiBaseUrl();
  return baseUrl ? `${baseUrl}${pathname}` : pathname;
}

async function parseErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as unknown;
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  } catch {
    // Ignore parsing errors and fall back to status text.
  }

  return null;
}

async function updatePasswordInBackend(args: {
  accessToken: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const candidates = [
    {
      path: "/api/auth/change-password",
      method: "POST",
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
    },
    {
      path: "/api/auth/password",
      method: "PATCH",
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
    },
    {
      path: "/api/auth/password",
      method: "POST",
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
    },
  ] as const;

  for (const candidate of candidates) {
    const response = await fetch(buildApiUrl(candidate.path), {
      method: candidate.method,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${args.accessToken}`,
      },
      body: JSON.stringify(candidate.body),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 404 || response.status === 405) {
      continue;
    }

    const message = await parseErrorMessage(response);
    throw new Error(
      message ?? `Password update failed (${response.status} ${response.statusText || "error"}).`,
    );
  }

  throw new Error("Password update endpoint is unavailable in the backend configuration.");
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => token);
    return () => {
      setAuthTokenGetter(null);
    };
  }, [token]);

  const clearSession = useMemo(
    () =>
      async function clearSessionState() {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
        queryClient.clear();
        setToken(null);
        setUser(null);
        setRequiresPasswordReset(false);
        setStatus("unauthenticated");
      },
    [queryClient],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (!isMounted) {
        return;
      }

      if (!storedToken) {
        setStatus("unauthenticated");
        return;
      }

      setToken(storedToken);

      try {
        const me = await getMe({
          headers: { authorization: `Bearer ${storedToken}` },
        });

        if (!isMounted) {
          return;
        }

        setUser(me.user);
        await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
        setRequiresPasswordReset(false);
        setStatus("authenticated");
      } catch {
        if (!isMounted) {
          return;
        }

        await clearSession();
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      isLoading: status === "loading",
      user,
      role: user?.role ?? null,
      requiresPasswordReset,
      async login(input) {
        try {
          const normalizedEmail = input.email.trim().toLowerCase();
          const session = await loginRequest({
            email: normalizedEmail,
            password: input.password,
          });

          const shouldForceReset = false;

          await AsyncStorage.setItem(TOKEN_KEY, session.accessToken);
          if (shouldForceReset) {
            await AsyncStorage.setItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY, "true");
          } else {
            await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
          }

          queryClient.clear();
          setToken(session.accessToken);
          setUser(session.user);
          setRequiresPasswordReset(shouldForceReset);
          setStatus("authenticated");

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeAuthError(error),
          };
        }
      },
      async completeFirstLoginPasswordChange(newPassword) {
        if (!token || !user || user.role !== "admin") {
          return { ok: false, error: "You must be signed in as an admin to change password." };
        }

        const normalizedPassword = newPassword.trim();
        if (normalizedPassword.length < 8) {
          return { ok: false, error: "Use at least 8 characters for your new password." };
        }

        try {
          await updatePasswordInBackend({
            accessToken: token,
            currentPassword: "",
            newPassword: normalizedPassword,
          });

          await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
          setRequiresPasswordReset(false);

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizePasswordChangeError(error),
          };
        }
      },
      async logout() {
        if (token) {
          try {
            await logoutRequest({
              headers: { authorization: `Bearer ${token}` },
            });
          } catch {
            // Intentionally ignore logout API errors during local session cleanup.
          }
        }

        await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
        setRequiresPasswordReset(false);
        await clearSession();
      },
      async refreshSession() {
        if (!token) {
          setUser(null);
          setRequiresPasswordReset(false);
          setStatus("unauthenticated");
          return;
        }

        try {
          const me = await getMe();
          setUser(me.user);
          if (me.user.role !== "admin") {
            await AsyncStorage.removeItem(ADMIN_PASSWORD_RESET_REQUIRED_KEY);
            setRequiresPasswordReset(false);
          }
          setStatus("authenticated");
        } catch {
          await clearSession();
        }
      },
    }),
    [clearSession, queryClient, requiresPasswordReset, status, token, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }
  return value;
}
