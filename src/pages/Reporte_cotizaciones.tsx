import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"

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
  descargarCotizacionPdf,
  getCotizacionPdfObjectUrl,
  getCotizaciones,
} from "@/services/cotizacion.service"
import type { Cotizacion } from "@/types/cotizacion"

export const Reporte_cotizaciones = () => {
  const [search, setSearch] = useState("")
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pdfCotizacion, setPdfCotizacion] = useState<Cotizacion | null>(null)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)

  const loadCotizaciones = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCotizaciones()
      setCotizaciones(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar las cotizaciones."
      setError(msg)
      setCotizaciones([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCotizaciones()
  }, [])

  useEffect(() => {
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const openProformaPdf = async (cotizacion: Cotizacion) => {
    setPdfCotizacion(cotizacion)
    setIsPdfModalOpen(true)
    setIsLoadingPdf(true)

    try {
      const url = await getCotizacionPdfObjectUrl(cotizacion.id)
      setPdfUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return url
      })
    } catch {
      setError("No se pudo cargar el PDF de la cotización.")
      setIsPdfModalOpen(false)
      setPdfCotizacion(null)
    } finally {
      setIsLoadingPdf(false)
    }
  }

  const columns = useMemo<ColumnDef<Cotizacion, unknown>[]>(
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
        accessorKey: "codigoProforma",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Código Proforma" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
            {row.original.codigoProforma}
          </Badge>
        ),
      },
      {
        accessorKey: "clienteNombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente Titular" />
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.clienteNombre}</p>
            <p className="text-xs text-muted-foreground">NIT: {row.original.clienteCi}</p>
          </div>
        ),
      },
      {
        accessorKey: "fechaHora",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha Emisión" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHora)}
          </span>
        ),
      },
      {
        accessorKey: "diasValidez",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Validez" />,
        cell: ({ row }) => <span>{row.original.diasValidez} días</span>,
      },
      {
        accessorKey: "totalEstimado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Estimado" />
        ),
        cell: ({ row }) => (
          <span className="font-bold text-foreground">
            Bs. {row.original.totalEstimado.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const st = row.original.estado
          if (st === "Pendiente") return <Badge variant="warning">Pendiente</Badge>
          if (st === "Convertida en Venta")
            return <Badge variant="success">Convertida en Venta</Badge>
          return <Badge variant="destructive">Vencida</Badge>
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void openProformaPdf(row.original)}
            className="cursor-pointer gap-1"
          >
            <Eye className="size-3" />
            Ver proforma
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Reporte de Cotizaciones Emitidas
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Histórico de proformas comerciales con estado de conversión en venta.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar cotización..."
        />
        <Button type="button" variant="outline" onClick={() => void loadCotizaciones()}>
          Actualizar
        </Button>
      </div>

      <ModalPdfViewer
        open={isPdfModalOpen}
        onOpenChange={(open) => {
          setIsPdfModalOpen(open)
          if (!open) {
            setPdfCotizacion(null)
            setPdfUrl((prev) => {
              if (prev) window.URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
        title={`Proforma ${pdfCotizacion?.codigoProforma ?? ""}`}
        description="Visualiza, descarga o imprime la cotización."
        pdfUrl={pdfUrl}
        isLoading={isLoadingPdf}
        iframeTitle="Proforma PDF"
        onDownload={() => {
          if (!pdfCotizacion) return
          void descargarCotizacionPdf(pdfCotizacion.id, pdfCotizacion.codigoProforma)
        }}
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCotizaciones()}
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
          data={cotizaciones}
          searchValue={search}
          searchKeys={["codigoProforma", "clienteNombre", "clienteCi", "estado"]}
          emptyMessage="No se encontraron cotizaciones registradas."
        />
      )}
    </div>
  )
}
