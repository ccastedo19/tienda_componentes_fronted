import { AUTH_LOGIN_PATH } from "@/lib/api/config"
import { apiRequest } from "@/lib/api/client"
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "@/types/api"
export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(AUTH_LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuth: true,
  })
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
  })
}

export async function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  })
}