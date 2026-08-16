import { useState, useEffect, useMemo } from "react"
import { Plus, Trash2, Wrench, User, CheckCircle2 } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { createOrdenTecnica } from "@/services/ordenTecnica.service"
import type { Cliente } from "@/types/cliente"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { Usuario } from "@/types/usuario"

interface ModalOrdenTecnicaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientes: Cliente[]
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
  clientes,
  productos,
  servicios,
  tecnicos,
  onSuccess,
}: ModalOrdenTecnicaProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string | null>(null)
  const [diagnostico, setDiagnostico] = useState("")
  const [observaciones, setObservaciones] = useState("")

  const [componentes, setComponentes] = useState<ComponenteSeleccionado[]>([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioSeleccionado[]>([])

  const [selectedProdId, setSelectedProdId] = useState<string | null>(null)
  const [selectedServId, setSelectedServId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedClienteId(null)
      setSelectedTecnicoId(null)
      setDiagnostico("")
      setObservaciones("")
      setComponentes([])
      setServiciosSeleccionados([])
      setSelectedProdId(null)
      setSelectedServId(null)
      setError(null)
    }
  }, [open])

  // Options para SmartCombobox
  const clienteOptions = useMemo<SmartComboboxOption[]>(() => {
    return clientes
      .filter((c) => c.estado === "Activo")
      .map((c) => {
        const full = `${c.nombre} ${c.apellido}`.trim()
        return {
          value: c.id,
          label: full,
          description: `CI/NIT: ${c.ci || "S/N"} • Tel: ${c.telefono || "S/T"}`,
          keywords: `${full} ${c.ci || ""} ${c.telefono || ""} ${c.email || ""}`,
        }
      })
  }, [clientes])

  const tecnicoOptions = useMemo<SmartComboboxOption[]>(() => {
    return tecnicos
      .filter((t) => t.estado === 1)
      .map((t) => {
        const full = `${t.nombre} ${t.apellido}`.trim()
        return {
          value: t.id,
          label: full,
          description: `Rol: ${t.rol} • Email: ${t.email}`,
          keywords: `${full} ${t.email} ${t.rol}`,
        }
      })
  }, [tecnicos])

  const productoOptions = useMemo<SmartComboboxOption[]>(() => {
    return productos
      .filter((p) => p.stockDisponible > 0)
      .map((p) => ({
        value: p.id,
        label: p.nombreComercial,
        description: `Código: ${p.skuUnico} • Disp: ${p.stockDisponible} un. • Precio: Bs. ${p.precioVenta.toFixed(2)}`,
        keywords: `${p.nombreComercial} ${p.skuUnico}`,
      }))
  }, [productos])

  const servicioOptions = useMemo<SmartComboboxOption[]>(() => {
    return servicios.map((s) => ({
      value: s.id,
      label: s.nombre,
      description: `Sugerido: Bs. ${s.precioBaseSugerido.toFixed(2)}`,
      keywords: `${s.nombre} ${s.precioBaseSugerido}`,
    }))
  }, [servicios])

  const clienteSeleccionado = useMemo(() => {
    return clientes.find((c) => c.id === selectedClienteId) ?? null
  }, [clientes, selectedClienteId])

  const handleAddComponente = () => {
    if (!selectedProdId) return
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
    setSelectedProdId(null)
  }

  const handleAddServicio = () => {
    if (!selectedServId) return
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
    setSelectedServId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClienteId) {
      setError("Debes buscar y seleccionar un cliente registrado.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createOrdenTecnica({
        clienteId: selectedClienteId,
        tecnicoId: selectedTecnicoId,
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
            <Wrench className="size-5 text-primary" />
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
            <Label>Cliente Titular (Búsqueda Smart) *</Label>
            <SmartCombobox
              options={clienteOptions}
              value={selectedClienteId}
              onValueChange={setSelectedClienteId}
              placeholder="Buscar cliente por nombre, CI, NIT o teléfono..."
              emptyMessage="No se encontraron clientes activos."
            />
            {clienteSeleccionado && (
              <div className="p-2.5 rounded-md bg-muted/40 border border-border text-xs flex items-center justify-between">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}{clienteSeleccionado.ci ? ` • CI/NIT: ${clienteSeleccionado.ci}` : ""}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  Identificado
                </span>
              </div>
            )}
          </div>

          {/* Técnico Asignado */}
          <div className="space-y-1.5">
            <Label>Técnico Responsable (Opcional)</Label>
            <SmartCombobox
              options={tecnicoOptions}
              value={selectedTecnicoId}
              onValueChange={setSelectedTecnicoId}
              placeholder="Escribe para buscar un técnico responsable..."
              emptyMessage="No se encontraron técnicos disponibles."
            />
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

          {/* Observaciones */}
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observaciones / Accesorios Entregados</Label>
            <Textarea
              id="obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Cargador original, funda, detalles estéticos..."
              rows={2}
            />
          </div>

          {/* Componentes a reservar */}
          <div className="space-y-2 pt-1 border-t border-border">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              Repuestos / Componentes a Reservar (SRS-CAT-006)
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SmartCombobox
                  options={productoOptions}
                  value={selectedProdId}
                  onValueChange={setSelectedProdId}
                  placeholder="Buscar componente o repuesto por nombre o SKU..."
                  emptyMessage="No hay productos con existencias disponibles."
                />
              </div>
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
                    <span>
                      {c.nombre} <span className="text-muted-foreground font-mono">(Código: {c.sku})</span>
                    </span>
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
            <Label className="text-xs font-semibold flex items-center gap-1.5">
        
              Mano de Obra / Servicios Técnicos
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SmartCombobox
                  options={servicioOptions}
                  value={selectedServId}
                  onValueChange={setSelectedServId}
                  placeholder="Buscar servicio técnico..."
                  emptyMessage="No se encontraron servicios."
                />
              </div>
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
                    <span className="font-semibold text-foreground">Bs {s.precioAplicado.toFixed(2)}</span>
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
            <Button type="submit" disabled={isLoading || !selectedClienteId}>
              {isLoading ? "Creando..." : "Crear Orden y Retener Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
