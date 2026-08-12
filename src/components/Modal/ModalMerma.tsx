import { useState, useEffect } from "react"
import { AlertOctagon, Plus, Trash2, DollarSign } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { createMerma } from "@/services/merma.service"
import type { Producto } from "@/types/producto"

interface ModalMermaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productos: Producto[]
  onSuccess: () => void
}

type LineaMermaFisica = {
  productoId: string
  nombre: string
  sku: string
  cantidad: number
  costoUnitario: number
}

export function ModalMerma({
  open,
  onOpenChange,
  productos,
  onSuccess,
}: ModalMermaProps) {
  const [tipoMerma, setTipoMerma] = useState<"Pérdida Física" | "Pérdida en Efectivo Mostrador">("Pérdida Física")
  const [observacion, setObservacion] = useState("")

  // Para Pérdida Física
  const [lineasFisicas, setLineasFisicas] = useState<LineaMermaFisica[]>([])
  const [selectedProdId, setSelectedProdId] = useState("")

  // Para Pérdida en Efectivo Mostrador
  const [montoPerdidaEfectivo, setMontoPerdidaEfectivo] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTipoMerma("Pérdida Física")
      setObservacion("")
      setLineasFisicas([])
      setSelectedProdId("")
      setMontoPerdidaEfectivo("")
      setError(null)
    }
  }, [open])

  const handleAddProductoFisico = () => {
    const prod = productos.find((p) => p.id === selectedProdId)
    if (!prod) return

    setLineasFisicas([
      ...lineasFisicas,
      {
        productoId: prod.id,
        nombre: prod.nombreComercial,
        sku: prod.skuUnico,
        cantidad: 1,
        costoUnitario: prod.precioCosto,
      },
    ])
    setSelectedProdId("")
  }

  const handleRemoveLineaFisica = (idx: number) => {
    setLineasFisicas(lineasFisicas.filter((_, i) => i !== idx))
  }

  const handleUpdateCantidadFisica = (idx: number, cantidad: number) => {
    const updated = [...lineasFisicas]
    updated[idx] = { ...updated[idx], cantidad: Math.max(1, cantidad) }
    setLineasFisicas(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!observacion.trim()) {
      setError("SRS-INV-004: La justificación técnica u observación de la merma es obligatoria.")
      return
    }

    if (tipoMerma === "Pérdida Física" && lineasFisicas.length === 0) {
      setError("Debes agregar al menos un artículo averiado o con pérdida física.")
      return
    }

    if (tipoMerma === "Pérdida en Efectivo Mostrador") {
      const monto = parseFloat(montoPerdidaEfectivo)
      if (isNaN(monto) || monto <= 0) {
        setError("El monto de la pérdida en efectivo debe ser un número mayor a 0.")
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      if (tipoMerma === "Pérdida Física") {
        await createMerma({
          tipoMerma,
          observacion: observacion.trim(),
          items: lineasFisicas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            valorEconomico: l.cantidad * l.costoUnitario,
          })),
        })
      } else {
        const monto = parseFloat(montoPerdidaEfectivo)
        await createMerma({
          tipoMerma,
          observacion: observacion.trim(),
          items: [
            {
              productoId: null,
              cantidad: 1,
              valorEconomico: monto,
            },
          ],
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al registrar la merma."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="size-5" />
            Declaración de Merma y Pérdidas
          </DialogTitle>
          <DialogDescription>
            SRS-INV-003 / SRS-INV-004: Registro y deducción justificada de existencias físicas averiadas o descuadre de efectivo.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tipoMerma">Tipo de Merma *</Label>
            <Select
              value={tipoMerma}
              onValueChange={(val) =>
                setTipoMerma((val ?? "Pérdida Física") as "Pérdida Física" | "Pérdida en Efectivo Mostrador")
              }
            >
              <SelectTrigger id="tipoMerma" className="w-full">
                <SelectValue placeholder="Selecciona tipo de merma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pérdida Física">
                  Pérdida Física (Componentes dañados/averiados - Descuenta stock y Kardex)
                </SelectItem>
                <SelectItem value="Pérdida en Efectivo Mostrador">
                  Pérdida en Efectivo Mostrador (Descuenta del arqueo de caja activa)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs">Justificación Obligatoria (SRS-INV-004) *</Label>
            <Textarea
              id="obs"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Explica detalladamente la causa de la pérdida o avería..."
              rows={2}
              required
            />
          </div>

          {tipoMerma === "Pérdida Física" ? (
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">Artículos Físicos Dañados / Mermados</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedProdId} onValueChange={(val) => setSelectedProdId(val ?? "")}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Seleccionar producto del inventario..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productos
                      .filter((p) => p.stockActual > 0)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombreComercial} (Stock actual: {p.stockActual} un.)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddProductoFisico}
                  disabled={!selectedProdId}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {lineasFisicas.length > 0 && (
                <div className="space-y-1.5">
                  {lineasFisicas.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{l.nombre}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          SKU: {l.sku} • Costo: ${l.costoUnitario.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={l.cantidad}
                          onChange={(e) =>
                            handleUpdateCantidadFisica(i, parseInt(e.target.value, 10) || 1)
                          }
                          className="h-7 w-16 text-center text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveLineaFisica(i)}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label htmlFor="montoEf">Monto en Efectivo a Deducir de la Caja Activa ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="montoEf"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoPerdidaEfectivo}
                  onChange={(e) => setMontoPerdidaEfectivo(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                SRS-CAJ-006: Este importe se restará automáticamente del saldo esperado de la sesión de caja activa.
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
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Declarando..." : "Declarar y Deducir Merma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
