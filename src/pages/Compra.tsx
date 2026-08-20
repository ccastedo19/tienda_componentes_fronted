import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, AlertTriangle } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalCompra } from "@/components/Modal/ModalCompra"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { getCompras } from "@/services/compra.service"
import { getProductos } from "@/services/producto.service"
import { getProveedores } from "@/services/proveedor.service"
import type { Compra as CompraModel } from "@/types/compra"
import type { Producto } from "@/types/producto"
import type { Proveedor } from "@/types/proveedor"

export const Compra = () => {
  const [search, setSearch] = useState("")
  const [compras, setCompras] = useState<CompraModel[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alertasVariacion, setAlertasVariacion] = useState<string[]>([])

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [comprasData, provsData, prodsData] = await Promise.all([
        getCompras(),
        getProveedores(),
        getProductos(),
      ])
      setCompras(comprasData)
      setProveedores(provsData)
      setProductos(prodsData)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "No se pudieron cargar las compras."
      setError(msg)
      setCompras([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSuccess = (alertas?: string[]) => {
    void loadData()
    if (alertas && alertas.length > 0) {
      setAlertasVariacion(alertas)
    } else {
      setAlertasVariacion([])
    }
  }

  const columns = useMemo<ColumnDef<CompraModel, unknown>[]>(
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
        accessorKey: "proveedorNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.proveedorNombre}</span>
        ),
      },
      {
        accessorKey: "usuarioNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Registrado Por" />,
        cell: ({ row }) => <span>{row.original.usuarioNombre}</span>,
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
        accessorKey: "items",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Artículos Recibidos" />,
        cell: ({ row }) => {
          const items = row.original.items || []
          return (
            <div className="space-y-0.5">
              {items.map((it, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium text-foreground">{it.productoNombre}</span>
                  <span className="text-muted-foreground"> ({it.cantidad} un. a Bs {it.costoUnitario.toFixed(2)})</span>
                </div>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: "totalCompra",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Compra" />,
        cell: ({ row }) => (
          <span className="font-bold text-foreground">
            Bs {row.original.totalCompra.toFixed(2)}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          Compras de Inventario y Recepciones
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Ingreso de existencias desde proveedores activos, actualización de costo ponderado y registro en Kardex (SRS-PRO-002, SRS-INV-005).
        </p>
      </div>

      {alertasVariacion.length > 0 && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Alerta de Variación de Costo (SRS-INV-005)</AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-1">
            <p>La compra se registró correctamente, pero se detectaron ítems con costo superior al histórico:</p>
            <ul className="list-disc list-inside">
              {alertasVariacion.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar compra..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="size-4" />
          Nueva Compra
        </Button>
      </div>

      <ModalCompra
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        proveedores={proveedores}
        productos={productos}
        onSuccess={handleSuccess}
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadData()}
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
          data={compras}
          searchValue={search}
          searchKeys={["proveedorNombre", "usuarioNombre"]}
          emptyMessage="No se encontraron compras de inventario registradas."
        />
      )}
    </div>
  )
}
