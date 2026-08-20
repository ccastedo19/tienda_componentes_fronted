import { useState, useEffect, useMemo } from "react"
import { Plus, Trash2, ShoppingBag, AlertTriangle } from "lucide-react"

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
import { createCompra } from "@/services/compra.service"
import type { Producto } from "@/types/producto"
import type { Proveedor } from "@/types/proveedor"

interface ModalCompraProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedores: Proveedor[]
  productos: Producto[]
  onSuccess: (alertas?: string[]) => void
}

type LineaCompra = {
  productoId: string
  nombre: string
  sku: string
  costoAnterior: number
  cantidad: number
  costoUnitario: number
}

export function ModalCompra({
  open,
  onOpenChange,
  proveedores,
  productos,
  onSuccess,
}: ModalCompraProps) {
  const [proveedorId, setProveedorId] = useState<string | null>(null)
  const [lineas, setLineas] = useState<LineaCompra[]>([])
  const [selectedProdId, setSelectedProdId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proveedoresActivos = useMemo(
    () => proveedores.filter((p) => p.estado === "Activo"),
    [proveedores]
  )

  const proveedorOptions = useMemo<SmartComboboxOption[]>(() => {
    return proveedoresActivos.map((p) => ({
      value: p.id,
      label: p.nombreProveedor,
      description: `Tel: ${p.telefono} • Email: ${p.email || "S/E"}`,
      keywords: `${p.nombreProveedor} ${p.telefono} ${p.email || ""}`,
    }))
  }, [proveedoresActivos])

  const productoOptions = useMemo<SmartComboboxOption[]>(() => {
    return productos.map((p) => ({
      value: p.id,
      label: p.nombreComercial,
      description: `Código: ${p.skuUnico} • Costo actual: Bs. ${p.precioCosto.toFixed(2)} • Stock: ${p.stockActual}`,
      keywords: `${p.nombreComercial} ${p.skuUnico}`,
    }))
  }, [productos])

  useEffect(() => {
    if (open) {
      setProveedorId(proveedoresActivos[0]?.id || null)
      setLineas([])
      setSelectedProdId(null)
      setError(null)
    }
  }, [open, proveedoresActivos])

  const handleAddProducto = () => {
    if (!selectedProdId) return
    const prod = productos.find((p) => p.id === selectedProdId)
    if (!prod) return

    setLineas([
      ...lineas,
      {
        productoId: prod.id,
        nombre: prod.nombreComercial,
        sku: prod.skuUnico,
        costoAnterior: prod.precioCosto,
        cantidad: 1,
        costoUnitario: prod.precioCosto,
      },
    ])
    setSelectedProdId(null)
  }

  const handleRemoveLinea = (idx: number) => {
    setLineas(lineas.filter((_, i) => i !== idx))
  }

  const handleUpdateLinea = (idx: number, field: "cantidad" | "costoUnitario", val: number) => {
    const updated = [...lineas]
    updated[idx] = { ...updated[idx], [field]: val }
    setLineas(updated)
  }

  const totalCompra = lineas.reduce((acc, l) => acc + l.cantidad * l.costoUnitario, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proveedorId) {
      setError("SRS-PRO-002: Debes seleccionar un proveedor activo registrado.")
      return
    }
    if (lineas.length === 0) {
      setError("Debes agregar al menos un producto a la orden de compra.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await createCompra({
        proveedorId,
        items: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
        })),
      })
      onSuccess(res.alertasVariacionCosto)
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al registrar la compra."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            Nueva Compra de Inventario (Recepción)
          </DialogTitle>
          <DialogDescription>
            SRS-PRO-002 / SRS-INV-005: Incremento de existencias, cálculo de costo promedio ponderado y registro inmutable en Kardex.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prov">Proveedor Activo (SRS-PRO-002) *</Label>
            <SmartCombobox
              options={proveedorOptions}
              value={proveedorId}
              onValueChange={setProveedorId}
              placeholder="Buscar proveedor..."
              emptyMessage="No se encontraron proveedores activos."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Agregar Producto del Catálogo</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SmartCombobox
                  options={productoOptions}
                  value={selectedProdId}
                  onValueChange={setSelectedProdId}
                  placeholder="Buscar producto..."
                  emptyMessage="No se encontraron productos en el catálogo."
                />
              </div>
              <Button type="button" onClick={handleAddProducto} disabled={!selectedProdId}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2.5 text-left">Producto</th>
                  <th className="p-2.5 text-center w-24">Cantidad</th>
                  <th className="p-2.5 text-right w-28">Costo Unit. (Bs.)</th>
                  <th className="p-2.5 text-right w-28">Subtotal (Bs.)</th>
                  <th className="p-2.5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No hay productos agregados a la orden.
                    </td>
                  </tr>
                ) : (
                  lineas.map((l, i) => {
                    const isHigherCost = l.costoUnitario > l.costoAnterior
                    return (
                      <tr key={i}>
                        <td className="p-2.5">
                          <div className="font-medium text-foreground">{l.nombre}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Código: {l.sku} • Costo anterior: Bs. {l.costoAnterior.toFixed(2)}
                          </div>
                          {isHigherCost && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="size-3" />
                              Supera costo histórico (SRS-INV-005)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) =>
                              handleUpdateLinea(i, "cantidad", parseInt(e.target.value, 10) || 1)
                            }
                            className="h-7 text-center text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.costoUnitario || ""}
                            onChange={(e) =>
                              handleUpdateLinea(
                                i,
                                "costoUnitario",
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="h-7 text-right text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right font-medium text-foreground">
                          Bs. {(l.cantidad * l.costoUnitario).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveLinea(i)}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {lineas.length > 0 && (
                <tfoot className="bg-muted/50 border-t border-border font-semibold">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right">
                      Total Compra:
                    </td>
                    <td className="p-2.5 text-right text-primary">
                      Bs. {totalCompra.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
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
            <Button type="submit" disabled={isLoading || lineas.length === 0}>
              {isLoading ? "Procesando..." : "Ingresar Compra al Inventario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
