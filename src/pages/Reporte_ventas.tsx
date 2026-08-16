import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { BarChart3, Eye } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalPdfViewer } from "@/components/Modal/ModalPdfViewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import {
  descargarNotaVentaPdf,
  getNotaVentaPdfObjectUrl,
  getVentas,
} from "@/services/venta.service"
import type { Venta } from "@/types/venta"

export const Reporte_ventas = () => {
  const [search, setSearch] = useState("")
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pdfVenta, setPdfVenta] = useState<Venta | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)

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

  useEffect(() => {
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const openNotaVentaPdf = async (venta: Venta) => {
    setPdfVenta(venta)
    setIsPdfModalOpen(true)
    setIsLoadingPdf(true)

    try {
      const url = await getNotaVentaPdfObjectUrl(venta.id)
      setPdfUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return url
      })
    } catch {
      setError("No se pudo cargar el PDF de la nota de venta.")
      setIsPdfModalOpen(false)
      setPdfVenta(null)
    } finally {
      setIsLoadingPdf(false)
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
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void openNotaVentaPdf(v)}
              className="cursor-pointer gap-1"
            >
              <Eye className="size-3" />
              Ver nota
            </Button>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <BarChart3 className="size-6" />
          Reporte General de Ventas
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Histórico detallado de comprobantes internos de cobro, conciliación de pagos y desglose de
          artículos.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, cliente o vendedor..."
        />
        <Button type="button" variant="outline" onClick={() => void loadVentas()}>
          Actualizar
        </Button>
      </div>

      <ModalPdfViewer
        open={isPdfModalOpen}
        onOpenChange={(open) => {
          setIsPdfModalOpen(open)
          if (!open) {
            setPdfVenta(null)
            setPdfUrl((prev) => {
              if (prev) window.URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
        title={`Nota de venta ${pdfVenta?.codigoNotaVenta ?? ""}`}
        description="Visualiza, descarga o imprime el comprobante de la venta."
        pdfUrl={pdfUrl}
        isLoading={isLoadingPdf}
        iframeTitle="Nota de venta PDF"
        onDownload={() => {
          if (!pdfVenta) return
          void descargarNotaVentaPdf(pdfVenta.id, pdfVenta.codigoNotaVenta)
        }}
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
