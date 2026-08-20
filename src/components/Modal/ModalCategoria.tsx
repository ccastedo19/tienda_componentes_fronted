import { useState, useEffect, useMemo } from "react"
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
import { SmartCombobox, type SmartComboboxOption } from "@/components/ui/smart-combobox"
import { ApiRequestError } from "@/lib/api/client"
import { createCategoria, updateCategoria } from "@/services/categoria.service"
import type { Categoria } from "@/types/categoria"

interface ModalCategoriaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  categoria?: Categoria | null
  categoriasDisponibles: Categoria[]
  /** Padre preseleccionado al crear (null = raíz). */
  defaultCategoriaPadreId?: string | null
  /** Si true, no permite cambiar la categoría padre. */
  lockParent?: boolean
  onSuccess: () => void
}

export function ModalCategoria({
  open,
  onOpenChange,
  mode,
  categoria,
  categoriasDisponibles,
  defaultCategoriaPadreId = null,
  lockParent = false,
  onSuccess,
}: ModalCategoriaProps) {
  const [nombre, setNombre] = useState("")
  const [categoriaPadreId, setCategoriaPadreId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    if (categoria && mode === "edit") {
      setNombre(categoria.nombre)
      setCategoriaPadreId(categoria.categoriaPadreId || null)
    } else {
      setNombre("")
      setCategoriaPadreId(defaultCategoriaPadreId ?? null)
    }
    setError(null)
  }, [categoria, mode, open, defaultCategoriaPadreId])

  const categoriasFiltradas = useMemo(() => {
    return categoriasDisponibles.filter((c) => mode === "create" || c.id !== categoria?.id)
  }, [categoriasDisponibles, mode, categoria])

  const categoriaPadreOptions = useMemo<SmartComboboxOption[]>(() => {
    return categoriasFiltradas.map((c) => ({
      value: c.id,
      label: c.nombre,
      description: c.categoriaPadreNombre
        ? `Subcategoría de: ${c.categoriaPadreNombre}`
        : "Categoría Raíz",
      keywords: `${c.nombre} ${c.categoriaPadreNombre || ""}`,
    }))
  }, [categoriasFiltradas])

  const padreNombre = useMemo(() => {
    if (!categoriaPadreId) return null
    return categoriasDisponibles.find((c) => c.id === categoriaPadreId)?.nombre ?? null
  }, [categoriaPadreId, categoriasDisponibles])

  const isSubcategoriaCreate = mode === "create" && Boolean(categoriaPadreId)
  const isRaizCreate = mode === "create" && !categoriaPadreId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError("El nombre de la categoría es obligatorio.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "create") {
        await createCategoria({
          nombre: nombre.trim(),
          categoriaPadreId: categoriaPadreId || null,
        })
      } else if (categoria) {
        await updateCategoria(categoria.id, {
          nombre: nombre.trim(),
          categoriaPadreId: categoriaPadreId || null,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al guardar la categoría."
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
            {mode === "edit"
              ? "Editar Categoría"
              : isSubcategoriaCreate
                ? "Nueva Subcategoría"
                : "Nueva Categoría Raíz"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Modifica la información o categoría padre del catálogo."
              : isSubcategoriaCreate
                ? `Se creará bajo “${padreNombre ?? "la categoría seleccionada"}”.`
                : "Registra una categoría principal del catálogo."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre de la Categoría *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de categoría"
              required
            />
          </div>

          {lockParent ? (
            <div className="space-y-1.5">
              <Label>Categoría Padre</Label>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {isRaizCreate
                  ? "Ninguna (Categoría Raíz)"
                  : padreNombre ?? "Categoría seleccionada"}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="padre">Categoría Padre (Opcional)</Label>
              <SmartCombobox
                options={categoriaPadreOptions}
                value={categoriaPadreId}
                onValueChange={setCategoriaPadreId}
                placeholder="Categoría padre (opcional)..."
                emptyMessage="No se encontraron categorías padre disponibles."
              />
              <p className="text-[11px] text-muted-foreground">
                Si no seleccionas ninguna, se registrará como Categoría Principal.
              </p>
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
              {isLoading
                ? "Guardando..."
                : mode === "create"
                  ? isSubcategoriaCreate
                    ? "Crear Subcategoría"
                    : "Crear Categoría"
                  : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
