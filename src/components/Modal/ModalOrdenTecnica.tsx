import { useState, useEffect } from "react"
import { Plus, Trash2, Wrench } from "lucide-react"

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
import { findClienteByCi } from "@/services/cliente.service"
import { createOrdenTecnica } from "@/services/ordenTecnica.service"
import type { Cliente } from "@/types/cliente"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { Usuario } from "@/types/usuario"

interface ModalOrdenTecnicaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productos: Producto[]
  servicios: Servicio[]
  tecnicos: Usuario[]
  onSuccess: () => void
}

type ComponenteSeleccionado = {
  productoId: string
  nombre: string
  sku: string
  cantidad: number
}

type ServicioSeleccionado = {
  servicioId: string
  nombre: string
  precioAplicado: number
}

export function ModalOrdenTecnica({
  open,
  onOpenChange,
  productos,
  servicios,
  tecnicos,
  onSuccess,
}: ModalOrdenTecnicaProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ciSearch, setCiSearch] = useState("")
  const [tecnicoId, setTecnicoId] = useState<string>("none")
  const [diagnostico, setDiagnostico] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const [componentes, setComponentes] = useState<ComponenteSeleccionado[]>([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioSeleccionado[]>([])

  const [selectedProdId, setSelectedProdId] = useState("")
  const [selectedServId, setSelectedServId] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCliente(null)
      setCiSearch("")
      setTecnicoId("none")
      setDiagnostico("")
      setObservaciones("")
      setComponentes([])
      setServiciosSeleccionados([])
      setError(null)
    }
  }, [open])

  const handleBuscarCliente = async () => {
    if (!ciSearch.trim()) return
    try {
      const c = await findClienteByCi(ciSearch.trim())
      setCliente(c)
      setError(null)
    } catch {
      setCliente(null)
      setError("No se encontró el cliente con ese CI.")
    }
  }

  const handleAddComponente = () => {
    const prod = productos.find((p) => p.id === selectedProdId)
    if (!prod) return

    if (prod.stockDisponible < 1) {
      setError(`Stock insuficiente para reservar: ${prod.nombreComercial}`)
      return
    }

    setComponentes([
      ...componentes,
      {
        productoId: prod.id,
        nombre: prod.nombreComercial,
        sku: prod.skuUnico,
        cantidad: 1,
      },
    ])
    setSelectedProdId("")
  }

  const handleAddServicio = () => {
    const s = servicios.find((item) => item.id === selectedServId)
    if (!s) return

    setServiciosSeleccionados([
      ...serviciosSeleccionados,
      {
        servicioId: s.id,
        nombre: s.nombre,
        precioAplicado: s.precioBaseSugerido,
      },
    ])
    setSelectedServId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) {
      setError("Debes buscar y asociar un cliente registrado con CI.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createOrdenTecnica({
        clienteId: cliente.id,
        tecnicoId: tecnicoId === "none" ? null : tecnicoId,
        diagnostico: diagnostico.trim(),
        observaciones: observaciones.trim(),
        componentes: componentes.map((c) => ({
          productoId: c.productoId,
          cantidad: c.cantidad,
        })),
        servicios: serviciosSeleccionados.map((s) => ({
          servicioId: s.servicioId,
          precioAplicado: s.precioAplicado,
        })),
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al registrar la orden técnica."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="size-5" />
            Nueva Orden de Servicio Técnico / Recepción
          </DialogTitle>
          <DialogDescription>
            SRS-CAT-006: Reserva componentes de inventario en 'stockReservado' y asigna técnicos y diagnóstico.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="ci">Cliente Titular (Búsqueda por CI) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ci"
                placeholder="Ingresa CI del cliente..."
                value={ciSearch}
                onChange={(e) => setCiSearch(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleBuscarCliente}>
                Buscar
              </Button>
            </div>
            {cliente && (
              <div className="p-2.5 rounded-md bg-muted/40 border border-border text-xs flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {cliente.nombre} {cliente.apellido} • Tel: {cliente.telefono}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Identificado</span>
              </div>
            )}
          </div>

          {/* Técnico Asignado */}
          <div className="space-y-1.5">
            <Label htmlFor="tecnico">Técnico Responsable</Label>
            <Select value={tecnicoId} onValueChange={(val) => setTecnicoId(val ?? "none")}>
              <SelectTrigger id="tecnico" className="w-full">
                <SelectValue placeholder="Selecciona un técnico (opcional)">
                  {tecnicoId === "none"
                    ? "-- Sin asignar --"
                    : tecnicos.find((t) => t.id === tecnicoId)
                      ? `${tecnicos.find((t) => t.id === tecnicoId)?.nombre} ${tecnicos.find((t) => t.id === tecnicoId)?.apellido}`
                      : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Sin asignar --</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre} {t.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Diagnóstico */}
          <div className="space-y-1.5">
            <Label htmlFor="diag">Diagnóstico Técnico Inicial</Label>
            <Textarea
              id="diag"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Describe la falla reportada por el cliente..."
              rows={2}
            />
          </div>

          {/* Componentes a reservar */}
          <div className="space-y-2 pt-1 border-t border-border">
            <Label className="text-xs font-semibold">Repuestos / Componentes a Reservar (SRS-CAT-006)</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedProdId} onValueChange={(val) => setSelectedProdId(val ?? "")}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Seleccionar repuesto del inventario...">
                    {productos.find((p) => p.id === selectedProdId)?.nombreComercial}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {productos
                    .filter((p) => p.stockDisponible > 0)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombreComercial} ({p.stockDisponible} disp.)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={handleAddComponente} disabled={!selectedProdId}>
                <Plus className="size-3.5" />
              </Button>
            </div>

            {componentes.length > 0 && (
              <div className="space-y-1">
                {componentes.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs"
                  >
                    <span>{c.nombre} (SKU: {c.sku})</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setComponentes(componentes.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Servicios técnicos asignados */}
          <div className="space-y-2 pt-1 border-t border-border">
            <Label className="text-xs font-semibold">Mano de Obra / Servicios Técnicos</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedServId} onValueChange={(val) => setSelectedServId(val ?? "")}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Seleccionar servicio de mano de obra...">
                    {servicios.find((s) => s.id === selectedServId)?.nombre}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} (${s.precioBaseSugerido.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={handleAddServicio} disabled={!selectedServId}>
                <Plus className="size-3.5" />
              </Button>
            </div>

            {serviciosSeleccionados.length > 0 && (
              <div className="space-y-1">
                {serviciosSeleccionados.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border text-xs"
                  >
                    <span>{s.nombre}</span>
                    <span className="font-semibold">${s.precioAplicado.toFixed(2)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setServiciosSeleccionados(serviciosSeleccionados.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            <Button type="submit" disabled={isLoading || !cliente}>
              {isLoading ? "Creando..." : "Crear Orden y Retener Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
