import { API_BASE_URL } from "@/lib/api/config"
import { clearSession, getToken } from "@/lib/auth/storage"
import type { ApiError } from "@/types/api"

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean
}

export class ApiRequestError extends Error {
  code: string
  timestamp: string
  status?: number

  constructor(error: ApiError & { status?: number }) {
    super(error.message)
    this.name = "ApiRequestError"
    this.code = error.code
    this.timestamp = error.timestamp
    this.status = error.status
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, headers, ...rest } = options

  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (skipAuth) {
    requestHeaders.delete("Authorization")
  } else {
    const token = getToken()

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "omit",
    ...rest,
    headers: requestHeaders,
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    // Si el token expiró o fue revocado (401) en una ruta protegida (distinta a login)
    if (response.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/authenticate")) {
      clearSession()
      window.dispatchEvent(new CustomEvent("auth:session-expired"))
    }

    const apiError = data as ApiError | null
    const springError = data as {
      status?: number
      error?: string
      path?: string
      message?: string
    } | null

    if (apiError?.code && apiError?.message) {
      throw new ApiRequestError({
        code: apiError.code,
        message: apiError.message,
        timestamp: apiError.timestamp ?? new Date().toISOString(),
        status: response.status,
      })
    }

    if (response.status === 429) {
      throw new ApiRequestError({
        code: "TOO_MANY_REQUESTS",
        message: springError?.message || "Demasiados intentos. Por motivos de seguridad, tu acceso ha sido bloqueado temporalmente.",
        timestamp: new Date().toISOString(),
        status: 429,
      })
    }

    if (springError?.error || springError?.message) {
      throw new ApiRequestError({
        code: String(springError.status ?? response.status),
        message:
          response.status === 403
            ? `Acceso denegado (403) en ${springError.path ?? path}.`
            : springError.message || `${springError.error} (${response.status})`,
        timestamp: new Date().toISOString(),
        status: response.status,
      })
    }

    throw new ApiRequestError({
      code: "UNKNOWN_ERROR",
      message: `Error HTTP ${response.status}`,
      timestamp: new Date().toISOString(),
      status: response.status,
    })
  }

  return data as T
}
