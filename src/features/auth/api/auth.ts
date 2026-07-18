import { api } from "@/lib/http/apiClient";
import type { CurrentUser, LoginPayload, RegisterPayload } from "../types";

interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function refreshRequest(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/refresh");
  return data;
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}

export async function fetchMe(): Promise<CurrentUser> {
  const { data } = await api.get<{ user: CurrentUser }>("/auth/me");
  return data.user;
}
