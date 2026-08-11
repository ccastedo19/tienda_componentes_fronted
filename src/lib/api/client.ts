import { API_BASE_URL } from "@/lib/api/config"
import { getToken } from "@/lib/auth/storage"
import type { ApiError } from "@/types/api"

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean
}

export class ApiRequestError extends Error {
  code: string
  timestamp: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = "ApiRequestError"
    this.code = error.code
    this.timestamp = error.timestamp
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
    const apiError = data as ApiError | null
    const springError = data as {
      status?: number
      error?: string
      path?: string
    } | null

    if (apiError?.code && apiError?.message) {
      throw new ApiRequestError({
        code: apiError.code,
        message: apiError.message,
        timestamp: apiError.timestamp ?? new Date().toISOString(),
      })
    }

    if (springError?.error) {
      throw new ApiRequestError({
        code: String(springError.status ?? response.status),
        message:
          response.status === 403
            ? `Acceso denegado (403) en ${springError.path ?? path}. El backend debe permitir POST en este endpoint (Spring Security / CSRF).`
            : `${springError.error} (${response.status})`,
        timestamp: new Date().toISOString(),
      })
    }

    throw new ApiRequestError({
      code: "UNKNOWN_ERROR",
      message: `Error HTTP ${response.status}`,
      timestamp: new Date().toISOString(),
    })
  }

  return data as T
}
