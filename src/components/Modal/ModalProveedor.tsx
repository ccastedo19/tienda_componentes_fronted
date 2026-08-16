import { useState, useEffect } from "react"
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
import { createProveedor, updateProveedor } from "@/services/proveedor.service"
import type { Proveedor } from "@/types/proveedor"

interface ModalProveedorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  proveedor?: Proveedor | null
  onSuccess: () => void
}

export function ModalProveedor({
  open,
  onOpenChange,
  mode,
  proveedor,
  onSuccess,
}: ModalProveedorProps) {
  const [nombreProveedor, setNombreProveedor] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [direccion, setDireccion] = useState("")
  const [estado, setEstado] = useState<"Activo" | "Inactivo">("Activo")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (proveedor && mode === "edit") {
      setNombreProveedor(proveedor.nombreProveedor)
      setTelefono(proveedor.telefono)
      setEmail(proveedor.email || "")
      setDireccion(proveedor.direccion || "")
      setEstado(proveedor.estado)
    } else {
      setNombreProveedor("")
      setTelefono("")
      setEmail("")
      setDireccion("")
      setEstado("Activo")
    }
    setError(null)
  }, [proveedor, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // SRS-PRO-001: Campos obligatorios Nombre del Proveedor y Número Telefónico
    if (!nombreProveedor.trim() || !telefono.trim()) {
      setError("SRS-PRO-001: El Nombre del Proveedor y Número Telefónico son campos obligatorios.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "create") {
        await createProveedor({
          nombreProveedor: nombreProveedor.trim(),
          telefono: telefono.trim(),
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          estado,
        })
      } else if (proveedor) {
        await updateProveedor(proveedor.id, {
          nombreProveedor: nombreProveedor.trim(),
          telefono: telefono.trim(),
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          estado,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al guardar el proveedor."
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
            {mode === "create" ? "Registrar Proveedor" : "Editar Proveedor"}
          </DialogTitle>
          <DialogDescription>
            SRS-PRO-001: Registro de proveedores con datos de contacto requeridos para compras.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del Proveedor / Empresa *</Label>
            <Input
              id="nombre"
              value={nombreProveedor}
              onChange={(e) => setNombreProveedor(e.target.value)}
              placeholder="Ej: Arrow Electronics, DigiKey, Distribuidora Central"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Número Telefónico *</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+591 70000000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={estado} onValueChange={(val) => setEstado(val as "Activo" | "Inactivo")}>
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo (Habilitado para Compras)</SelectItem>
                  <SelectItem value="Inactivo">Inactivo (Deshabilitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@proveedor.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección Física (Opcional)</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Principal #123"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={isLoading}>
              {isLoading ? "Guardando..." : mode === "create" ? "Registrar Proveedor" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
