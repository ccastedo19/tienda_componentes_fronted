import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit2, Trash2, Tag, Cpu, Package } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalProducto } from "@/components/Modal/ModalProducto"
import { ModalSeries } from "@/components/Modal/ModalSeries"
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
import { getCategorias } from "@/services/categoria.service"
import { deleteProducto, getProductos } from "@/services/producto.service"
import type { Categoria } from "@/types/categoria"
import type { Producto } from "@/types/producto"

export const Productos = () => {
  const [search, setSearch] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)

  // Series modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false)
  const [productoParaSeries, setProductoParaSeries] = useState<Producto | null>(null)

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [prodToDelete, setProdToDelete] = useState<Producto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [prodsData, catsData] = await Promise.all([getProductos(), getCategorias()])
      setProductos(prodsData)
      setCategorias(catsData)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar los productos. Intenta nuevamente."
      setError(msg)
      setProductos([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleOpenCreate = () => {
    setSelectedProducto(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: Producto) => {
    setSelectedProducto(p)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleOpenSeries = (p: Producto) => {
    setProductoParaSeries(p)
    setIsSeriesModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!prodToDelete) return
    setIsDeleting(true)

    try {
      await deleteProducto(prodToDelete.id)
      setProductos((prev) => prev.filter((p) => p.id !== prodToDelete.id))
      setIsDeleteDialogOpen(false)
      setProdToDelete(null)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al eliminar el producto."
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
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
        accessorKey: "precioCosto",
        header: ({ column }) => <DataTableColumnHeader column={column} title="P. Costo" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">${row.original.precioCosto.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "precioVenta",
        header: ({ column }) => <DataTableColumnHeader column={column} title="P. Venta" />,
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            ${row.original.precioVenta.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "stockActual",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock Actual" />,
        cell: ({ row }) => {
          const actual = row.original.stockActual
          const min = row.original.umbralStockMinimo
          const isLow = actual <= min

          return (
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold ${isLow ? "text-destructive" : "text-foreground"}`}>
                {actual} un.
              </span>
              {isLow && <Badge variant="destructive">Bajo ({min})</Badge>}
            </div>
          )
        },
      },
      {
        id: "series",
        header: "Series",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleOpenSeries(row.original)}
            className="gap-1 cursor-pointer"
          >
            <Tag className="size-3" />
            Series
          </Button>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(p)}
                title="Editar producto"
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setProdToDelete(p)
                  setIsDeleteDialogOpen(true)
                }}
                title="Eliminar producto"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
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
          <Package className="size-6" />
          Catálogo de Productos
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión integral de SKU, precios de costo y venta, umbrales de stock mínimo y números de serie (SRS-CAT-001..009).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por SKU, nombre o categoría..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={handleOpenCreate}
        >
          <Plus className="size-4" />
          Nuevo Producto
        </Button>
      </div>

      <ModalProducto
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        producto={selectedProducto}
        categorias={categorias}
        onSuccess={() => void loadData()}
      />

      <ModalSeries
        open={isSeriesModalOpen}
        onOpenChange={setIsSeriesModalOpen}
        producto={productoParaSeries}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{prodToDelete?.nombreComercial} (SKU: {prodToDelete?.skuUnico})</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
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
          data={productos}
          searchValue={search}
          searchKeys={["skuUnico", "nombreComercial", "categoriaNombre"]}
          emptyMessage="No se encontraron productos en el catálogo."
        />
      )}
    </div>
  )
}
