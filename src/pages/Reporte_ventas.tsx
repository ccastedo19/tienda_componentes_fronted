import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BarChart3, Eye, Calendar, CalendarDays, RotateCcw, Banknote, TrendingUp, DollarSign } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalTicketVenta } from "@/components/Modal/ModalTicketVenta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime, getLocalDateString, extractLocalDateString } from "@/lib/format-date"
import { getVentas } from "@/services/venta.service"
import type { Venta } from "@/types/venta"

export const Reporte_ventas = () => {
  const [search, setSearch] = useState("")
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")

  // Ticket Viewer
  const [ticketVenta, setTicketVenta] = useState<Venta | null>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

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

  const openNotaVentaTicket = (venta: Venta) => {
    setTicketVenta(venta)
    setIsTicketModalOpen(true)
  }

  const handleFiltroHoy = () => {
    const today = getLocalDateString(new Date())
    setFechaInicio(today)
    setFechaFin(today)
  }

  const handleLimpiarFechas = () => {
    setFechaInicio("")
    setFechaFin("")
  }

  // Filtrado de ventas por rango de fechas (respetando hora local del cliente)
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.fechaHora) return true
      const fechaVenta = extractLocalDateString(v.fechaHora)
      if (fechaInicio && fechaVenta < fechaInicio) return false
      if (fechaFin && fechaVenta > fechaFin) return false
      return true
    })
  }, [ventas, fechaInicio, fechaFin])

  // Cálculo de totales acumulados
  const resumenTotales = useMemo(() => {
    const totalFacturado = ventasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0)
    const totalCosto = ventasFiltradas.reduce((acc, v) => acc + (v.costoTotal || 0), 0)
    const totalGanancia = ventasFiltradas.reduce((acc, v) => acc + (v.gananciaNeta || 0), 0)
    const margenGlobal = totalFacturado > 0 ? (totalGanancia / totalFacturado) * 100 : 0
    return {
      totalFacturado,
      totalCosto,
      totalGanancia,
      margenGlobal,
      cantidad: ventasFiltradas.length,
    }
  }, [ventasFiltradas])

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
              <p className="text-xs text-muted-foreground">NIT/CI: {row.original.clienteCi}</p>
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
        id: "gananciaNeta",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ganancia / Beneficio (PMP)" />,
        cell: ({ row }) => {
          const ganancia = row.original.gananciaNeta ?? 0
          const porcentaje = row.original.margenPorcentaje ?? 0
          const isPositive = ganancia >= 0

          return (
            <div className="flex flex-col text-xs">
              <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {isPositive ? "+" : ""}Bs. {ganancia.toFixed(2)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Margen: {porcentaje.toFixed(1)}%
              </span>
            </div>
          )
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const v = row.original
          return (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => openNotaVentaTicket(v)}
              className="cursor-pointer gap-1"
            >
              <Eye className="size-3" />
              Ver ticket
            </Button>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <BarChart3 className="size-6" />
          Reporte General de Ventas y Ganancias
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Histórico de facturación, conciliación de pagos y auditoría de rentabilidad por producto mediante costo promedio ponderado (PMP).
        </p>
      </div>

      {/* Tarjetas de Consolidado Financiero para las Ventas Filtradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground font-medium">Total Facturado</CardTitle>
            <Banknote className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-xl font-bold text-foreground">
              Bs. {resumenTotales.totalFacturado.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {resumenTotales.cantidad} venta(s) registradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground font-medium">Costo Total Mercancía (PMP)</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-xl font-bold text-muted-foreground">
              Bs. {resumenTotales.totalCosto.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Costo de adquisición ponderado
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Ganancia / Beneficio Total</CardTitle>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              Bs. {resumenTotales.totalGanancia.toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Beneficio neto acumulado
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground font-medium">Margen Promedio Global</CardTitle>
            <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {resumenTotales.margenGlobal.toFixed(1)}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Rentabilidad global sobre ventas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Filtros por Fecha */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="size-4 text-primary" />
            <span>Filtrar Reporte por Fecha</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={fechaInicio && fechaInicio === new Date().toISOString().split("T")[0] && fechaFin === fechaInicio ? "default" : "outline"}
              size="xs"
              onClick={handleFiltroHoy}
              className="cursor-pointer gap-1"
            >
              <Calendar className="size-3.5" />
              Ventas de Hoy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleLimpiarFechas}
              className="cursor-pointer gap-1 text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              Ver Todas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-border/60">
          <div className="space-y-1">
            <Label htmlFor="fechaInicio" className="text-xs text-muted-foreground">Fecha Desde</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fechaFin" className="text-xs text-muted-foreground">Fecha Hasta</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Buscador General</Label>
            <DataTableSearch
              value={search}
              onChange={setSearch}
              placeholder="Buscar por comprobante, cliente o vendedor..."
            />
          </div>
        </div>
      </div>

      <ModalTicketVenta
        open={isTicketModalOpen}
        onOpenChange={(open) => {
          setIsTicketModalOpen(open)
          if (!open) setTicketVenta(null)
        }}
        venta={ticketVenta}
      />

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
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={ventasFiltradas}
            searchValue={search}
            searchKeys={["codigoNotaVenta", "clienteNombre", "vendedorNombre", "metodoPago"]}
            emptyMessage="No se encontraron ventas registradas para el rango de fechas seleccionado."
          />

          {/* Pie de Tabla con Resumen Inmutable */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-muted-foreground">
              Mostrando <strong className="text-foreground">{ventasFiltradas.length}</strong> de <strong className="text-foreground">{ventas.length}</strong> ventas registradas en el sistema.
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-muted-foreground">Total Ventas:</span>{" "}
                <strong className="text-foreground">Bs. {resumenTotales.totalFacturado.toFixed(2)}</strong>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-muted-foreground font-medium">Ganancia Total:</span>{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +Bs. {resumenTotales.totalGanancia.toFixed(2)}
                </strong>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-muted-foreground">Margen Promedio:</span>{" "}
                <strong className="text-blue-600 dark:text-blue-400">{resumenTotales.margenGlobal.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
