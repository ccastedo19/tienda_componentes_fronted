import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Layers, Tag, Cpu } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalSeries } from "@/components/Modal/ModalSeries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { getProductos } from "@/services/producto.service"
import type { Producto } from "@/types/producto"

export const Existencias = () => {
  const [search, setSearch] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Series modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

  const loadExistencias = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProductos()
      setProductos(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar las existencias de inventario."
      setError(msg)
      setProductos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadExistencias()
  }, [])

  const handleOpenSeries = (p: Producto) => {
    setSelectedProducto(p)
    setIsSeriesModalOpen(true)
  }

  const columns = useMemo<ColumnDef<Producto, unknown>[]>(
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
        accessorKey: "skuUnico",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
            {row.original.skuUnico}
          </Badge>
        ),
      },
      {
        accessorKey: "nombreComercial",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Producto" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            {row.original.imagenUrl ? (
              <img
                src={row.original.imagenUrl}
                alt={row.original.nombreComercial}
                className="size-8 rounded-md object-cover border border-border shrink-0"
              />
            ) : (
              <div className="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Cpu className="size-4" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{row.original.nombreComercial}</p>
              {row.original.categoriaNombre && (
                <p className="text-xs text-muted-foreground">{row.original.categoriaNombre}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "stockActual",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock Físico Total" />,
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.stockActual} un.</span>
        ),
      },
      {
        accessorKey: "stockReservado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Retenido en Taller" />,
        cell: ({ row }) => {
          const res = row.original.stockReservado
          return res > 0 ? (
            <Badge variant="warning">{res} un. reservadas</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">0</span>
          )
        },
      },
      {
        accessorKey: "stockDisponible",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Disponible para Venta (POS)" />,
        cell: ({ row }) => {
          const disp = row.original.stockDisponible
          const min = row.original.umbralStockMinimo
          const isLow = disp <= min

          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-base ${
                  disp === 0
                    ? "text-destructive"
                    : isLow
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {disp} un.
              </span>
              {isLow && disp > 0 && <Badge variant="warning">Bajo (Mín {min})</Badge>}
              {disp === 0 && <Badge variant="destructive">Agotado</Badge>}
            </div>
          )
        },
      },
      {
        id: "series",
        header: "Trazabilidad",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleOpenSeries(row.original)}
            className="gap-1 cursor-pointer"
          >
            <Tag className="size-3" />
            Ver Series
          </Button>
        ),
      },
    ],
    []
  )

  const stats = useMemo(() => {
    const totalArticulos = productos.length
    const totalUnidades = productos.reduce((acc, p) => acc + p.stockActual, 0)
    const totalBajoStock = productos.filter((p) => p.stockDisponible <= p.umbralStockMinimo).length
    const totalReservadas = productos.reduce((acc, p) => acc + p.stockReservado, 0)
    return { totalArticulos, totalUnidades, totalBajoStock, totalReservadas }
  }, [productos])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <Layers className="size-6" />
          Control de Existencias (Stock)
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Matriz de inventario en tiempo real: existencias físicas, stock retenido por órdenes técnicas y saldo disponible para venta.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Total Artículos Catálogo</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats.totalArticulos} Productos</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Unidades Físicas Totales</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats.totalUnidades} un.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Retenidas por Taller (SRS-CAT-006)</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.totalReservadas} un.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Alertas Stock Mínimo</span>
          <p
            className={`text-lg font-bold mt-0.5 ${
              stats.totalBajoStock > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {stats.totalBajoStock} alertas
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, producto o categoría..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadExistencias()}
        >
          Actualizar
        </Button>
      </div>

      <ModalSeries
        open={isSeriesModalOpen}
        onOpenChange={setIsSeriesModalOpen}
        producto={selectedProducto}
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadExistencias()}
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
          data={productos}
          searchValue={search}
          searchKeys={["skuUnico", "nombreComercial", "categoriaNombre"]}
          emptyMessage="No se encontraron existencias registradas."
        />
      )}
    </div>
  )
}
