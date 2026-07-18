import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setAccessToken } from "@/lib/http/tokenStore";
import { onAuthEvent } from "@/lib/http/authEvents";
import { loginRequest, registerRequest, refreshRequest, logoutRequest } from "../api/auth";
import type { CurrentUser, LoginPayload, RegisterPayload } from "../types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    refreshRequest()
      .then(({ user: refreshedUser, accessToken }) => {
        if (cancelled) return;
        setAccessToken(accessToken);
        setUser(refreshedUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return onAuthEvent("unauthorized", () => {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedInUser, accessToken } = await loginRequest(payload);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: newUser, accessToken } = await registerRequest(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      queryClient.clear();
    }
  }, [queryClient]);

  const updateCurrentUser = useCallback((patch: Partial<CurrentUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, updateCurrentUser }),
    [status, user, login, register, logout, updateCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
