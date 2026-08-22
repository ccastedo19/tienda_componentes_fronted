import { Eye, ShoppingCart, User, Clock, FileText, Wrench, Package, Hash, CheckCircle2, Receipt } from "lucide-react"
import { useNavigate } from "react-router-dom"

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
import { formatDateTime } from "@/lib/format-date"
import type { OrdenTecnica } from "@/types/ordenTecnica"

interface ModalDetalleOrdenTecnicaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenTecnica | null
  onVerTicketRollo?: (orden: OrdenTecnica) => void
}

export function ModalDetalleOrdenTecnica({
  open,
  onOpenChange,
  orden,
  onVerTicketRollo,
}: ModalDetalleOrdenTecnicaProps) {
  const navigate = useNavigate()

  if (!orden) return null

  const isPagada = orden.estado === "Pagada" || Boolean(orden.ventaId)

  const totalServicios =
    orden.servicios?.reduce((acc, s) => acc + (s.precioAplicado || 0), 0) ?? 0

  const handleIrAlPos = () => {
    onOpenChange(false)
    navigate("/venta", { state: { ordenTecnica: orden } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              <DialogTitle className="text-lg">
                Detalle de Orden Técnica #{orden.codigoOrden}
              </DialogTitle>
            </div>
            <Badge
              variant={
                orden.estado === "Pendiente"
                  ? "warning"
                  : orden.estado === "En Proceso"
                  ? "info"
                  : orden.estado === "Finalizada"
                  ? "secondary"
                  : orden.estado === "Pagada"
                  ? "success"
                  : "destructive"
              }
              className={isPagada ? "gap-1" : ""}
            >
              {isPagada && <CheckCircle2 className="size-3" />}
              {orden.estado}
            </Badge>
          </div>
          <DialogDescription>
            Información de recepción, diagnóstico, repuestos retenidos y mano de obra técnica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Ficha General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <span className="text-xs text-muted-foreground">Cliente</span>
              <p className="font-semibold text-foreground">{orden.clienteNombre}</p>
              <p className="text-xs text-muted-foreground">CI / NIT: {orden.clienteCi}</p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Técnico Asignado</span>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                {orden.tecnicoNombre || "Sin asignar"}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Fecha Ingreso
              </span>
              <p className="text-xs font-medium text-foreground">
                {formatDateTime(orden.fechaHoraIngreso)}
              </p>
            </div>

            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Fecha Finalización / Liquidación
              </span>
              <p className="text-xs font-medium text-foreground">
                {orden.fechaHoraFinalizacion
                  ? formatDateTime(orden.fechaHoraFinalizacion)
                  : "En curso / Pendiente"}
              </p>
            </div>
          </div>

          {/* Sección si la orden fue PAGADA en POS */}
          {isPagada && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                  <Receipt className="size-4" />
                  <span>Liquidación Registrada en POS</span>
                </div>
                <Badge variant="success">COBRO COMPLETADO</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Comprobante:</span>
                  <p className="font-mono font-bold text-foreground">{orden.codigoNotaVenta || "Nota de Venta"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Monto Cobrado:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    Bs. {(orden.montoTotalCobrado ?? 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Método Pago:</span>
                  <p className="font-medium text-foreground">{orden.metodoPagoVenta || "Efectivo"}</p>
                </div>
              </div>

              {onVerTicketRollo && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      onOpenChange(false)
                      onVerTicketRollo(orden)
                    }}
                    className="w-full sm:w-auto bg-background cursor-pointer gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
                  >
                    <FileText className="size-3.5" />
                    Ver Comprobante 
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Diagnóstico y Observaciones */}
          <div className="space-y-2">
            <div className="p-3 rounded-lg border border-border bg-background space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <FileText className="size-3.5 text-primary" />
                <span>Diagnóstico del Problema / Falla Reportada</span>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {orden.diagnostico || "Sin diagnóstico registrado."}
              </p>
            </div>

            {orden.observaciones && (
              <div className="p-3 rounded-lg border border-border bg-background space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Observaciones Adicionales / Accesorios</span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {orden.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Componentes / Repuestos Utilizados */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Package className="size-3.5 text-primary" />
              <span>Componentes y Repuestos Utilizados (SRS-CAT-006)</span>
            </div>

            {orden.componentes && orden.componentes.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Código / SKU</th>
                      <th className="p-2">N° Serie</th>
                      <th className="p-2 text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orden.componentes.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 font-medium text-foreground">{comp.productoNombre}</td>
                        <td className="p-2 font-mono text-muted-foreground">{comp.sku}</td>
                        <td className="p-2 font-mono text-muted-foreground">
                          {comp.numeroSerie ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Hash className="size-3" />
                              {comp.numeroSerie}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-2 text-right font-semibold">{comp.cantidad} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No se registraron repuestos ni componentes físicos en esta orden.
              </div>
            )}
          </div>

          {/* Servicios Técnicos / Mano de Obra */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Wrench className="size-3.5 text-primary" />
              <span>Servicios Técnicos y Mano de Obra</span>
            </div>

            {orden.servicios && orden.servicios.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2">Servicio</th>
                      <th className="p-2 text-right">Precio Aplicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orden.servicios.map((serv, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 font-medium text-foreground">{serv.servicioNombre}</td>
                        <td className="p-2 text-right font-semibold text-foreground">
                          Bs. {serv.precioAplicado.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 font-semibold border-t border-border">
                    <tr>
                      <td className="p-2">Total Mano de Obra</td>
                      <td className="p-2 text-right text-primary font-bold">
                        Bs. {totalServicios.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No se registraron servicios técnicos en esta orden.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          {!isPagada && orden.estado !== "Cancelada" && (
            <Button
              type="button"
              onClick={handleIrAlPos}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            >
              <ShoppingCart className="size-4 mr-1.5" />
              Cobrar en POS / Facturar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
