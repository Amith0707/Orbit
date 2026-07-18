import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken } from "./tokenStore";
import { emitAuthEvent } from "./authEvents";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{ accessToken: string }>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  return response.data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const isAuthRoute = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/register");

    if (error.response?.status !== 401 || !original || original._retry || isAuthRoute) {
      if (error.response?.status === 401 && !isAuthRoute) emitAuthEvent("unauthorized");
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    try {
      const newToken = await refreshPromise;
      setAccessToken(newToken);
      original.headers.set("Authorization", `Bearer ${newToken}`);
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      emitAuthEvent("unauthorized");
      return Promise.reject(refreshError);
    }
  }
);

export interface ApiErrorPayload {
  error: { message: string; details?: unknown };
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as ApiErrorPayload | undefined;
    return payload?.error?.message ?? fallback;
  }
  return fallback;
}
