import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { History, AlertTriangle } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { getHistorialCajas } from "@/services/caja.service"
import type { Caja } from "@/types/caja"

export const Historial_caja = () => {
  const [search, setSearch] = useState("")
  const [historial, setHistorial] = useState<Caja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistorial = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getHistorialCajas()
      setHistorial(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudo cargar el historial de cajas. Intenta nuevamente."
      setError(msg)
      setHistorial([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadHistorial()
  }, [])

  const columns = useMemo<ColumnDef<Caja, unknown>[]>(
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
        accessorKey: "usuarioNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Apertura Por" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.usuarioNombre}</span>,
      },
      {
        id: "usuarioCierreNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cierre Por" />,
        cell: ({ row }) => {
          const cierreNombre = row.original.usuarioCierreNombre
          if (!row.original.fechaHoraCierre) {
            return <span className="text-xs text-muted-foreground italic">En curso</span>
          }
          if (!cierreNombre || cierreNombre === row.original.usuarioNombre) {
            return <span className="text-xs text-muted-foreground">{row.original.usuarioNombre}</span>
          }
          return (
            <div className="flex flex-col text-xs">
              <span className="font-medium text-primary">{cierreNombre}</span>
              <span className="text-[10px] text-muted-foreground">(Administrador)</span>
            </div>
          )
        },
      },
      {
        accessorKey: "fechaHoraApertura",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Apertura" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHoraApertura)}
          </span>
        ),
      },
      {
        accessorKey: "fechaHoraCierre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cierre" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.fechaHoraCierre ? formatDateTime(row.original.fechaHoraCierre) : "En curso (Abierta)"}
          </span>
        ),
      },
      {
        accessorKey: "montoInicial",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto Inicial" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">Bs. {row.original.montoInicial.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "montoEsperado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo Esperado" />,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">Bs. {row.original.montoEsperado.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "recuentoFisico",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Recuento Físico" />,
        cell: ({ row }) => {
          const rec = row.original.recuentoFisico
          return <span>{rec !== null && rec !== undefined ? `Bs. ${rec.toFixed(2)}` : "-"}</span>
        },
      },
      {
        accessorKey: "diferenciaMonto",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Diferencia" />,
        cell: ({ row }) => {
          const diff = row.original.diferenciaMonto
          if (row.original.estado === "Abierta") return <span className="text-muted-foreground">-</span>

          const isZero = diff === 0
          const isNegative = diff < 0

          return (
            <span
              className={`font-semibold ${
                isZero
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isNegative
                  ? "text-destructive"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {diff > 0 ? "+" : ""}Bs. {diff.toFixed(2)}
            </span>
          )
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado / Diagnóstico" />,
        cell: ({ row }) => {
          const st = row.original.estado
          if (st === "Abierta") return <Badge variant="default">Abierta</Badge>
          if (st === "Caja Cuadrada") return <Badge variant="success">Caja Cuadrada</Badge>
          if (st === "Faltante") return <Badge variant="destructive">Faltante</Badge>
          if (st === "Sobrante") return <Badge variant="warning">Sobrante</Badge>
          return <Badge variant="secondary">{st}</Badge>
        },
      },
    ],
    []
  )

  const alertasTotal = useMemo(() => {
    return historial.filter((c) => c.estado === "Faltante" || c.estado === "Sobrante").length
  }, [historial])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <History className="size-6" />
            Historial de Cajas y Arqueos
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Auditoría histórica de aperturas, recuentos físicos y alertas por discrepancias financieras.
          </p>
        </div>

        {alertasTotal > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{alertasTotal} sesión(es) con alertas de faltante o sobrante</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por operador o estado..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadHistorial()}
        >
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadHistorial()}
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={historial}
          searchValue={search}
          searchKeys={["usuarioNombre", "estado"]}
          emptyMessage="No se encontraron registros de sesiones de caja."
        />
      )}
    </div>
  )
}
