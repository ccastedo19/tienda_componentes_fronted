import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Moon, Sun, ShieldAlert, Clock } from "lucide-react"

import logo from "@/assets/img/logo.jpg"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { ApiRequestError } from "@/lib/api/client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormErrors = {
  email?: string
  password?: string
  api?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
        }
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, sessionExpiredReason, clearSessionExpiredReason } = useAuth()
  const { theme, setTheme } = useTheme()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY as string | undefined

  // Carga e inicialización dinámica de Cloudflare Turnstile si se proporciona site key
  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainerRef.current) {
      return
    }

    const scriptId = "cf-turnstile-script"
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    const initTurnstile = () => {
      if (window.turnstile && turnstileContainerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstileSiteKey,
            theme: theme === "dark" ? "dark" : "light",
            callback: (token: string) => {
              setTurnstileToken(token)
            },
            "expired-callback": () => {
              setTurnstileToken(null)
            },
            "error-callback": () => {
              setTurnstileToken(null)
            },
          })
        } catch {
          // Ignorar si ya estaba renderizado
        }
      }
    }

    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      script.onload = () => {
        initTurnstile()
      }
      document.head.appendChild(script)
    } else {
      initTurnstile()
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignorar error al desmontar
        }
        widgetIdRef.current = null
      }
    }
  }, [turnstileSiteKey, theme])

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!email.trim()) {
      nextErrors.email = "El correo es obligatorio"
    }

    if (!password) {
      nextErrors.password = "La contraseña es obligatoria"
    }

    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    clearSessionExpiredReason()

    try {
      await login(email.trim(), password, turnstileToken || undefined)

      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/inicio"

      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "No se pudo iniciar sesión. Intenta nuevamente."

      setErrors({ api: message })

      // Resetear widget de Turnstile tras un fallo de autenticación si está activo
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="absolute top-4 right-4 z-10"
        onClick={toggleTheme}
        aria-label="Cambiar tema"
      >
        <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>

      <Card className="relative z-10 w-100 max-w-md shadow-lg">
        <div className="flex items-center justify-center pt-4">
          <img src={logo} alt="logo" className="h-15 w-30 object-cover" />
        </div>
        <CardHeader className="items-center text-center pb-2">
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        </CardHeader>

        <CardContent>
          {sessionExpiredReason ? (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <Clock className="size-4 shrink-0" />
              <span>{sessionExpiredReason}</span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {errors.api ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <ShieldAlert className="size-4 shrink-0" />
                <span>{errors.api}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                value={email}
                aria-invalid={!!errors.email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrors((prev) => ({
                    ...prev,
                    email: undefined,
                    api: undefined,
                  }))
                }}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      api: undefined,
                    }))
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>

              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password}</p>
              ) : null}
            </div>

            {/* Contenedor de Cloudflare Turnstile */}
            {turnstileSiteKey ? (
              <div className="flex justify-center pt-1">
                <div ref={turnstileContainerRef} />
              </div>
            ) : null}

            <Button
              type="submit"
              className="mt-2 w-full cursor-pointer"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-2">
          <p className="text-xs text-muted-foreground">
            Computer City — Versión 1.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
