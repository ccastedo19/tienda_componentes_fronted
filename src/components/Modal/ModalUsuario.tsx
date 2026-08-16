import { useState, useEffect } from "react"
import { Check, X, Eye, EyeOff, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/lib/api/client"
import { registerUser, updateUser } from "@/services/auth.service"
import type { Usuario } from "@/types/usuario"

interface ModalUsuarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  usuario?: Usuario | null
  onSuccess: (usuario: Usuario) => void
}

export function ModalUsuario({
  open,
  onOpenChange,
  mode,
  usuario,
  onSuccess,
}: ModalUsuarioProps) {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState<"Administrador" | "Vendedor">("Vendedor")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (usuario && mode === "edit") {
      setNombre(usuario.nombre)
      setApellido(usuario.apellido)
      setEmail(usuario.email)
      setRol(usuario.rol)
      setPassword("")
    } else {
      setNombre("")
      setApellido("")
      setEmail("")
      setPassword("")
      setRol("Vendedor")
    }
    setError(null)
  }, [usuario, mode, open])

  // Validaciones SRS-SEC-002
  const hasMinLength = password.length >= 12
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[~!@#$%^&*]/.test(password)
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      setError("Por favor completa los campos obligatorios.")
      return
    }

    if (mode === "create" && !isPasswordValid) {
      setError("La contraseña no cumple con los requisitos de seguridad obligatorios.")
      return
    }

    setIsLoading(true)

    try {
      if (mode === "create") {
        const nuevo = await registerUser({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim().toLowerCase(),
          password,
          rol,
        })
        onSuccess(nuevo)
      } else if (usuario) {
        const actualizado = await updateUser(usuario.id, {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim().toLowerCase(),
          rol,
        })
        onSuccess(actualizado)
      }
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al guardar el usuario."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Registrar Nuevo Personal" : "Editar Personal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crea una cuenta para un administrador o vendedor en el sistema."
              : "Modifica los datos del usuario seleccionado."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.perez@empresa.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rol">Rol Asignado *</Label>
            <Select value={rol} onValueChange={(val) => setRol((val ?? "Vendedor") as "Administrador" | "Vendedor")}>
              <SelectTrigger id="rol" className="w-full">
                <SelectValue placeholder="Selecciona un rol">
                  {rol === "Administrador" ? "Administrador (Control Total)" : "Vendedor (POS y Consultas)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vendedor">Vendedor (POS y Consultas)</SelectItem>
                <SelectItem value="Administrador">Administrador (Control Total)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña Obligatoria *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Indicador de Complejidad SRS-SEC-002 */}
              <div className="space-y-1 rounded-md border border-border bg-muted/40 p-2.5 text-xs">
                <p className="font-medium text-foreground">Requisitos de Complejidad (SRS-SEC-002):</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {hasMinLength ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    <span>12+ caracteres</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {hasUpper ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    <span>1 mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {hasLower ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    <span>1 minúscula</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {hasNumber ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    <span>1 número</span>
                  </div>
                  <div className={`col-span-2 flex items-center gap-1 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {hasSpecial ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    <span>1 carácter especial (~!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
