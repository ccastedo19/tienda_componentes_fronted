import { useState, useEffect } from "react"
import { FileText, Plus, Trash2, Download, CheckCircle2 } from "lucide-react"

import { ModalCliente } from "@/components/Modal/ModalCliente"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { findClienteByCi } from "@/services/cliente.service"
import { createCotizacion, descargarCotizacionPdf } from "@/services/cotizacion.service"
import { getProductos } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import type { Cliente } from "@/types/cliente"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"

type LineaCotizacion = {
  id: string
  tipo: "producto" | "servicio"
  productoId?: string
  servicioId?: string
  nombre: string
  sku?: string
  cantidad: number
  precioCotizado: number
}

export const Cotizacion = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])

  // Cliente obligatorio (SRS-POS-013)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ciInput, setCiInput] = useState("")
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  // Configuración Proforma
  const [diasValidez, setDiasValidez] = useState("15")
  const [lineas, setLineas] = useState<LineaCotizacion[]>([])

  // Selectores para agregar líneas
  const [selectedProdId, setSelectedProdId] = useState("")
  const [selectedServId, setSelectedServId] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proformaCreada, setProformaCreada] = useState<{ id: string; codigo: string } | null>(null)

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [prods, servs] = await Promise.all([getProductos(), getServicios()])
        setProductos(prods)
        setServicios(servs)
      } catch {
        // error
      }
    }
    void loadCatalogos()
  }, [])

  const handleBuscarCliente = async () => {
    if (!ciInput.trim()) return
    try {
      const c = await findClienteByCi(ciInput.trim())
      setCliente(c)
      setError(null)
    } catch {
      setCliente(null)
      setError("No se encontró ningún cliente con ese NIT / Cédula. Puedes registrarlo con el botón 'Nuevo'.")
    }
  }

  const handleAddProducto = () => {
    const prod = productos.find((p) => p.id === selectedProdId)
    if (!prod) return

    setLineas([
      ...lineas,
      {
        id: Math.random().toString(),
        tipo: "producto",
        productoId: prod.id,
        nombre: prod.nombreComercial,
        sku: prod.skuUnico,
        cantidad: 1,
        precioCotizado: prod.precioVenta,
      },
    ])
    setSelectedProdId("")
  }

  const handleAddServicio = () => {
    const serv = servicios.find((s) => s.id === selectedServId)
    if (!serv) return

    setLineas([
      ...lineas,
      {
        id: Math.random().toString(),
        tipo: "servicio",
        servicioId: serv.id,
        nombre: serv.nombre,
        cantidad: 1,
        precioCotizado: serv.precioBaseSugerido,
      },
    ])
    setSelectedServId("")
  }

  const handleRemoveLinea = (id: string) => {
    setLineas(lineas.filter((l) => l.id !== id))
  }

  const handleUpdateLinea = (id: string, field: "cantidad" | "precioCotizado", value: number) => {
    setLineas(
      lineas.map((l) => (l.id === id ? { ...l, [field]: Math.max(1, value) } : l))
    )
  }

  const totalEstimado = lineas.reduce((acc, l) => acc + l.cantidad * l.precioCotizado, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cliente) {
      setError("SRS-POS-013: Es obligatorio asociar a un cliente registrado con NIT / Cédula.")
      return
    }
    if (lineas.length === 0) {
      setError("Debes incluir al menos un producto o servicio en la proforma.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const nueva = await createCotizacion({
        clienteId: cliente.id,
        diasValidez: parseInt(diasValidez, 10) || 15,
        productos: lineas
          .filter((l) => l.tipo === "producto")
          .map((l) => ({
            productoId: l.productoId!,
            cantidad: l.cantidad,
          })),
        servicios: lineas
          .filter((l) => l.tipo === "servicio")
          .map((l) => ({
            servicioId: l.servicioId!,
            precioFinalAplicado: l.precioCotizado,
          })),
      })

      setProformaCreada({ id: nueva.id, codigo: nueva.codigoProforma })
      setLineas([])
      setCliente(null)
      setCiInput("")

      await descargarCotizacionPdf(nueva.id, nueva.codigoProforma).catch(() => null)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al emitir la cotización."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <FileText className="size-6" />
          Emisión de Cotizaciones (Proformas Comerciales)
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          SRS-POS-013 / 014: Genera cotizaciones formales vinculadas al NIT / Cédula del cliente sin comprometer el stock físico.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error en la Cotización</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {proformaCreada && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-foreground">
            ¡Proforma {proformaCreada.codigo} generada exitosamente!
          </AlertTitle>
          <AlertDescription className="mt-1 flex items-center justify-between">
            <span>Se ha descargado automáticamente el documento PDF.</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void descargarCotizacionPdf(proformaCreada.id, proformaCreada.codigo)}
              className="gap-1 bg-background text-foreground"
            >
              <Download className="size-3.5" />
              Re-descargar PDF
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Datos del Cliente y Vigencia</CardTitle>
            <CardDescription>
              La cotización requiere un cliente formal con NIT / Cédula para garantizar trazabilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ci">NIT / Cédula del Cliente *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ci"
                    placeholder="Ej: 12345678"
                    value={ciInput}
                    onChange={(e) => setCiInput(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleBuscarCliente}>
                    Buscar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsClientModalOpen(true)}
                    className="text-xs shrink-0"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Nuevo
                  </Button>
                </div>

                {cliente ? (
                  <div className="p-2.5 rounded-md bg-muted/40 border border-border text-xs flex items-center justify-between mt-2">
                    <span className="font-medium text-foreground">
                      {cliente.nombre} {cliente.apellido} • Tel: {cliente.telefono || "-"}
                    </span>
                    <Badge variant="success">Cliente Identificado</Badge>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    * Ingresa el NIT / Cédula y haz clic en Buscar para asociar el cliente.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="validez">Días de Validez de la Proforma *</Label>
                <Input
                  id="validez"
                  type="number"
                  min="1"
                  max="90"
                  value={diasValidez}
                  onChange={(e) => setDiasValidez(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lapso durante el cual los precios cotizados se mantienen vigentes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Ítems a Cotizar</CardTitle>
            <CardDescription>
              Selecciona productos del catálogo o servicios técnicos para armar la propuesta.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Agregar Componente / Producto</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedProdId} onValueChange={(val) => setSelectedProdId(val ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar producto...">
                        {productos.find((p) => p.id === selectedProdId)?.nombreComercial}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombreComercial} (Bs. {p.precioVenta.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddProducto} disabled={!selectedProdId}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Agregar Servicio Técnico</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedServId} onValueChange={(val) => setSelectedServId(val ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar servicio...">
                        {servicios.find((s) => s.id === selectedServId)?.nombre}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre} (Bs. {s.precioBaseSugerido.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddServicio} disabled={!selectedServId}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2.5 text-left">Ítem / Descripción</th>
                    <th className="p-2.5 text-center w-24">Cant.</th>
                    <th className="p-2.5 text-right w-28">P. Cotizado (Bs.)</th>
                    <th className="p-2.5 text-right w-28">Subtotal (Bs.)</th>
                    <th className="p-2.5 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No hay ítems agregados a la cotización.
                      </td>
                    </tr>
                  ) : (
                    lineas.map((l) => (
                      <tr key={l.id}>
                        <td className="p-2.5">
                          <div className="font-medium text-foreground">{l.nombre}</div>
                          <span className="text-[10px] text-muted-foreground">
                            {l.tipo === "producto" ? `Código: ${l.sku}` : "Mano de Obra"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) =>
                              handleUpdateLinea(l.id, "cantidad", parseInt(e.target.value, 10) || 1)
                            }
                            className="h-7 text-center text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.precioCotizado}
                            onChange={(e) =>
                              handleUpdateLinea(
                                l.id,
                                "precioCotizado",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 text-right text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-right font-bold text-foreground">
                          Bs. {(l.cantidad * l.precioCotizado).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveLinea(l.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <span className="font-semibold text-foreground">TOTAL ESTIMADO:</span>
              <span className="text-lg font-bold text-foreground">Bs. {totalEstimado.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              type="submit"
              disabled={isSubmitting || lineas.length === 0 || !cliente}
              className="w-full sm:w-auto font-semibold"
            >
              {isSubmitting ? "Emitiendo..." : "Emitir Cotización y Descargar PDF"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <ModalCliente
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        mode="create"
        onSuccess={(nuevo) => {
          setCliente(nuevo)
          setCiInput(nuevo.ci || "")
        }}
      />
    </div>
  )
}
