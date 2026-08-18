import { useState, useEffect } from "react"
import { Plus, QrCode, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { addSerieToProducto, getSeriesByProducto } from "@/services/producto.service"
import type { Producto, ProductoSerie } from "@/types/producto"

interface ModalSeriesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
}

export function ModalSeries({ open, onOpenChange, producto }: ModalSeriesProps) {
  const [series, setSeries] = useState<ProductoSerie[]>([])
  const [nuevoSerial, setNuevoSerial] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSeries = async () => {
    if (!producto) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getSeriesByProducto(producto.id)
      setSeries(data)
    } catch {
      setError("No se pudieron cargar los números de serie.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && producto) {
      void loadSeries()
      setNuevoSerial("")
      setError(null)
    }
  }, [open, producto])

  const handleAddSerie = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto || !nuevoSerial.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const added = await addSerieToProducto(producto.id, {
        numeroSerieAlfanumerico: nuevoSerial.trim().toUpperCase(),
      })
      setSeries((prev) => [added, ...prev])
      setNuevoSerial("")
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al registrar el número de serie."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!producto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-5" />
            Números de Serie: {producto.nombreComercial}
          </DialogTitle>
          <DialogDescription>
            SRS-CAT-003: Trazabilidad unitaria por número de serie alfanumérico para SKU: <strong>{producto.skuUnico}</strong>.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Formulario para agregar número de serie */}
        <form onSubmit={handleAddSerie} className="flex items-end gap-2 border-b border-border pb-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="serieInput">Registrar Nuevo Serial Físico</Label>
            <Input
              id="serieInput"
              value={nuevoSerial}
              onChange={(e) => setNuevoSerial(e.target.value)}
              placeholder="N° de serie"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="shrink-0">
            <Plus className="size-4" />
            Agregar
          </Button>
        </form>

        {/* Lista de series en stock */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <h4 className="text-xs font-semibold text-foreground">Series Disponibles en Stock ({series.length})</h4>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : series.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No hay números de serie individuales registrados en stock para este artículo.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              {series.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/30 text-xs"
                >
                  <div className="flex items-center gap-2 font-mono font-medium text-foreground">
                    <QrCode className="size-3.5 text-muted-foreground" />
                    <span>{s.numeroSerieAlfanumerico}</span>
                  </div>
                  <Badge variant={s.estado === "En Stock" ? "success" : "secondary"}>
                    {s.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
