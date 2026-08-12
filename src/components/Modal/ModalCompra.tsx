import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [proveedorId, setProveedorId] = useState("")
  const [lineas, setLineas] = useState<LineaCompra[]>([])
  const [selectedProdId, setSelectedProdId] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proveedoresActivos = proveedores.filter((p) => p.estado === "Activo")

  useEffect(() => {
    if (open) {
      setProveedorId(proveedoresActivos[0]?.id || "")
      setLineas([])
      setSelectedProdId("")
      setError(null)
    }
  }, [open])

  const handleAddProducto = () => {
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
    setSelectedProdId("")
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
            <ShoppingBag className="size-5" />
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
            <Select value={proveedorId} onValueChange={(val) => setProveedorId(val ?? "")}>
              <SelectTrigger id="prov" className="w-full">
                <SelectValue placeholder="Selecciona proveedor activo" />
              </SelectTrigger>
              <SelectContent>
                {proveedoresActivos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombreProveedor} • Tel: {p.telefono}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Agregar Producto del Catálogo</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProdId} onValueChange={(val) => setSelectedProdId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar componente o producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombreComercial} (SKU: {p.skuUnico} • Costo actual: ${p.precioCosto.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <th className="p-2.5 text-right w-28">Costo Unit. ($)</th>
                  <th className="p-2.5 text-right w-28">Subtotal ($)</th>
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
                            SKU: {l.sku} • Costo anterior: ${l.costoAnterior.toFixed(2)}
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
                            value={l.costoUnitario}
                            onChange={(e) =>
                              handleUpdateLinea(
                                i,
                                "costoUnitario",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 text-right text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right font-bold text-foreground">
                          ${(l.cantidad * l.costoUnitario).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveLinea(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <span className="font-semibold text-foreground">TOTAL DE COMPRA:</span>
            <span className="text-lg font-bold text-foreground">${totalCompra.toFixed(2)}</span>
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
              {isLoading ? "Registrando..." : "Confirmar Recepción de Inventario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
