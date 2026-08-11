import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Moon, Sun } from "lucide-react"

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

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { theme, setTheme } = useTheme()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    try {
      await login(email.trim(), password)

      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/inicio"

      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "No se pudo iniciar sesión. Intenta nuevamente."

      setErrors({ api: message })
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
        <div className="flex items-center justify-center">
          <img src={logo} alt="logo" className="h-15 w-30 object-cover" />
        </div>
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {errors.api ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.api}
              </p>
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
                <p className="text-sm text-destructive">{errors.email}</p>
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
                <p className="text-sm text-destructive">{errors.password}</p>
              ) : null}
            </div>

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

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Computer City — Versión 1.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
