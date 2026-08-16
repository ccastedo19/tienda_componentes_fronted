import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BarChart3, Download, Eye } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
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
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { descargarNotaVentaPdf, getVentas } from "@/services/venta.service"
import type { Venta } from "@/types/venta"

export const Reporte_ventas = () => {
  const [search, setSearch] = useState("")
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Details dialog
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadVentas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getVentas()
      setVentas(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "No se pudieron cargar las ventas."
      setError(msg)
      setVentas([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVentas()
  }, [])

  const handleDownloadPdf = async (v: Venta) => {
    try {
      await descargarNotaVentaPdf(v.id, v.codigoNotaVenta)
    } catch {
      alert("Error al descargar el PDF de la nota de venta.")
    }
  }

  const columns = useMemo<ColumnDef<Venta, unknown>[]>(
    () => [
      {
        id: "numero",
        header: "N°",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination
          return pageIndex * pageSize + row.index + 1
        },
        enableSorting: false,
      },
      {
        accessorKey: "codigoNotaVenta",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nota de Venta" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
            {row.original.codigoNotaVenta}
          </Badge>
        ),
      },
      {
        accessorKey: "vendedorNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendedor" />,
        cell: ({ row }) => <span>{row.original.vendedorNombre}</span>,
      },
      {
        accessorKey: "clienteNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.clienteNombre}</p>
            {row.original.clienteCi && (
              <p className="text-xs text-muted-foreground">NIT: {row.original.clienteCi}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "fechaHora",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha / Hora" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHora)}
          </span>
        ),
      },
      {
        accessorKey: "metodoPago",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Método Pago" />,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.metodoPago === "Efectivo"
                ? "default"
                : row.original.metodoPago === "QR"
                ? "info"
                : "secondary"
            }
          >
            {row.original.metodoPago}
          </Badge>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Cobrado" />,
        cell: ({ row }) => (
          <span className="font-bold text-foreground">Bs. {row.original.total.toFixed(2)}</span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const v = row.original
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setSelectedVenta(v)
                  setIsDetailOpen(true)
                }}
                title="Ver detalle de ítems"
              >
                <Eye className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => void handleDownloadPdf(v)}
                className="gap-1 cursor-pointer"
              >
                <Download className="size-3" />
                PDF
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <BarChart3 className="size-6" />
          Reporte General de Ventas
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Histórico detallado de comprobantes internos de cobro, conciliación de pagos y desglose de artículos (SRS-POS-011).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, cliente o vendedor..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadVentas()}
        >
          Actualizar
        </Button>
      </div>

      {/* Modal Detalle Venta */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Cobro: {selectedVenta?.codigoNotaVenta}</DialogTitle>
            <DialogDescription>
              Operador: {selectedVenta?.vendedorNombre} • Modalidad: {selectedVenta?.metodoPago}
            </DialogDescription>
          </DialogHeader>

          {selectedVenta && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Ítem / Descripción</th>
                      <th className="p-2 text-center">Cant.</th>
                      <th className="p-2 text-right">P. Unit</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedVenta.productos?.map((p, i) => (
                      <tr key={i}>
                        <td className="p-2">
                          <p className="font-medium text-foreground">{p.productoNombre}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Código: {p.sku} {p.numeroSerie ? `• S/N: ${p.numeroSerie}` : ""}
                          </p>
                        </td>
                        <td className="p-2 text-center">{p.cantidad}</td>
                        <td className="p-2 text-right">Bs. {p.precioUnitario.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold">Bs. {p.subtotalNeto.toFixed(2)}</td>
                      </tr>
                    ))}
                    {selectedVenta.servicios?.map((s, i) => (
                      <tr key={i}>
                        <td className="p-2">
                          <p className="font-medium text-foreground">[Servicio] {s.servicioNombre}</p>
                        </td>
                        <td className="p-2 text-center">1</td>
                        <td className="p-2 text-right">Bs. {s.precioFinalAplicado.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold">Bs. {s.subtotalNeto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                {selectedVenta.metodoPago === "Pago Mixto" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Efectivo: Bs. {selectedVenta.montoEfectivo.toFixed(2)} • QR: Bs. {selectedVenta.montoQr.toFixed(2)}</span>
                    <span>Cambio: Bs. {selectedVenta.cambioEfectivo.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-1">
                  <span>TOTAL COBRADO:</span>
                  <span>Bs. {selectedVenta.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadVentas()}
            className="w-full sm:w-auto"
          >
            Reintentar
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ventas}
          searchValue={search}
          searchKeys={["codigoNotaVenta", "clienteNombre", "vendedorNombre", "metodoPago"]}
          emptyMessage="No se encontraron ventas registradas."
        />
      )}
    </div>
  )
}
