import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  clearSession,
  getToken,
  saveToken,
} from "@/lib/auth/storage"
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "@/services/auth.service"
import type { AuthUser } from "@/types/api"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpiredReason: string | null
  login: (email: string, password: string, turnstileToken?: string) => Promise<void>
  logout: (reason?: string) => Promise<void>
  clearSessionExpiredReason: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchCurrentUser(): Promise<AuthUser> {
  return getCurrentUser()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpiredReason, setSessionExpiredReason] = useState<string | null>(null)

  const clearLocalSession = useCallback((reason?: string) => {
    clearSession()
    setToken(null)
    setUser(null)
    if (reason) {
      setSessionExpiredReason(reason)
    }
  }, [])

  const logout = useCallback(async (reason?: string) => {
    try {
      if (getToken()) {
        await logoutRequest()
      }
    } catch {
      // Si el backend falla, igual cerramos la sesión local.
    } finally {
      clearLocalSession(reason)
    }
  }, [clearLocalSession])

  // Escuchar eventos globales de sesión no autorizada (401 de backend al expirar las 8 horas)
  useEffect(() => {
    const handleSessionExpired = () => {
      clearLocalSession("Tu sesión ha caducado. Por favor, ingresa tus credenciales nuevamente.")
    }

    window.addEventListener("auth:session-expired", handleSessionExpired)
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired)
    }
  }, [clearLocalSession])

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = getToken()

      if (!storedToken) {
        setIsLoading(false)
        return
      }

      setToken(storedToken)

      try {
        const currentUser = await fetchCurrentUser()
        setUser(currentUser)
      } catch {
        clearLocalSession()
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [clearLocalSession])

  const login = useCallback(async (email: string, password: string, turnstileToken?: string) => {
    clearLocalSession()
    setSessionExpiredReason(null)

    const response = await loginRequest({ email, password, turnstileToken })

    saveToken(response.token)
    setToken(response.token)

    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
  }, [clearLocalSession])

  const clearSessionExpiredReason = useCallback(() => {
    setSessionExpiredReason(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      sessionExpiredReason,
      login,
      logout,
      clearSessionExpiredReason,
    }),
    [user, token, isLoading, sessionExpiredReason, login, logout, clearSessionExpiredReason]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider")
  }

  return context
}
