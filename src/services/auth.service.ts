import { AUTH_LOGIN_PATH } from "@/lib/api/config"
import { apiRequest } from "@/lib/api/client"
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "@/types/api"
import type {
  Usuario,
  CreateUsuarioRequest,
  UpdateUsuarioRequest,
} from "@/types/usuario"

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
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

export async function getUsers(estado?: number, incluirEliminados = false): Promise<Usuario[]> {
  const params = new URLSearchParams()
  if (estado !== undefined) params.append("estado", String(estado))
  if (incluirEliminados) params.append("incluirEliminados", "true")

  const query = params.toString() ? `?${params.toString()}` : ""
  return apiRequest<Usuario[]>(`/auth/users${query}`, {
    method: "GET",
  })
}

export async function getUserById(id: string): Promise<Usuario> {
  return apiRequest<Usuario>(`/auth/users/${id}`, {
    method: "GET",
  })
}

export async function registerUser(payload: CreateUsuarioRequest): Promise<Usuario> {
  return apiRequest<Usuario>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateUser(id: string, payload: UpdateUsuarioRequest): Promise<Usuario> {
  return apiRequest<Usuario>(`/auth/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deactivateUser(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/auth/users/${id}`, {
    method: "DELETE",
  })
}

export async function changeUserStatus(id: string, estado: number): Promise<Usuario> {
  return apiRequest<Usuario>(`/auth/users/${id}/estado?estado=${estado}`, {
    method: "PATCH",
  })
}