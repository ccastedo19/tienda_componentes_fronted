import { useState, useEffect, useMemo } from "react"
import { UserCheck, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SmartCombobox, type SmartComboboxOption } from "@/components/ui/smart-combobox"
import { ApiRequestError } from "@/lib/api/client"
import { updateOrdenTecnicaTecnico } from "@/services/ordenTecnica.service"
import type { OrdenTecnica } from "@/types/ordenTecnica"
import type { Usuario } from "@/types/usuario"

interface ModalAsignarTecnicoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenTecnica | null
  usuarios: Usuario[]
  onSuccess: (updated: OrdenTecnica) => void
}

export function ModalAsignarTecnico({
  open,
  onOpenChange,
  orden,
  usuarios,
  onSuccess,
}: ModalAsignarTecnicoProps) {
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && orden) {
      setSelectedTecnicoId(orden.tecnicoId || null)
      setError(null)
    }
  }, [open, orden])

  const tecnicoOptions = useMemo<SmartComboboxOption[]>(() => {
    return usuarios
      .filter((u) => u.estado === 1) // Solo usuarios activos
      .map((u) => {
        const full = `${u.nombre} ${u.apellido}`.trim()
        return {
          value: u.id,
          label: full,
          description: `Rol: ${u.rol} • Email: ${u.email}`,
          keywords: `${full} ${u.email} ${u.rol}`,
        }
      })
  }, [usuarios])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orden) return

    setIsLoading(true)
    setError(null)

    try {
      const updated = await updateOrdenTecnicaTecnico(orden.id, selectedTecnicoId)
      onSuccess(updated)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Error al actualizar el personal técnico de la orden."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!orden) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            Asignar / Cambiar Personal Técnico
          </DialogTitle>
          <DialogDescription>
            Orden #{orden.codigoOrden} • Cliente: {orden.clienteNombre}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Técnico Responsable *</Label>
            <SmartCombobox
              options={tecnicoOptions}
              value={selectedTecnicoId}
              onValueChange={setSelectedTecnicoId}
              placeholder="Buscar técnico..."
              emptyMessage="No se encontraron usuarios técnicos activos."
            />
            <p className="text-xs text-muted-foreground">
              Puedes buscar por nombre, apellido, correo electrónico o rol de usuario.
            </p>
          </div>

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
              {isLoading ? "Guardando..." : "Confirmar Asignación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
