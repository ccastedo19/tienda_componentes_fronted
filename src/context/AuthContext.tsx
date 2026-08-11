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
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchCurrentUser(): Promise<AuthUser> {
  return getCurrentUser()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearLocalSession = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

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

  const login = useCallback(async (email: string, password: string) => {
    clearLocalSession()

    const response = await loginRequest({ email, password })

    saveToken(response.token)
    setToken(response.token)

    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
  }, [clearLocalSession])

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await logoutRequest()
      }
    } catch {
      // Si el backend falla, igual cerramos la sesión local.
    } finally {
      clearLocalSession()
    }
  }, [clearLocalSession])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
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
