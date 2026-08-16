import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit2, Trash2, FolderTree } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalCategoria } from "@/components/Modal/ModalCategoria"
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
import { deleteCategoria, getCategorias } from "@/services/categoria.service"
import type { Categoria } from "@/types/categoria"

export const Categorias = () => {
  const [search, setSearch] = useState("")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [catToDelete, setCatToDelete] = useState<Categoria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCategorias = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar las categorías. Intenta nuevamente."
      setError(msg)
      setCategorias([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCategorias()
  }, [])

  const handleOpenCreate = () => {
    setSelectedCategoria(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: Categoria) => {
    setSelectedCategoria(c)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!catToDelete) return
    setIsDeleting(true)

    try {
      await deleteCategoria(catToDelete.id)
      setCategorias((prev) => prev.filter((c) => c.id !== catToDelete.id))
      setIsDeleteDialogOpen(false)
      setCatToDelete(null)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al eliminar la categoría."
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Categoria, unknown>[]>(
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
        accessorKey: "nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre de Categoría" />,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.nombre}</span>
        ),
      },
      {
        accessorKey: "categoriaPadreNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jerarquía / Padre" />,
        cell: ({ row }) => {
          const padre = row.original.categoriaPadreNombre
          return padre ? (
            <Badge variant="outline" className="gap-1">
              <FolderTree className="size-3" />
              {padre}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Categoría Principal</span>
          )
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(c)}
                title="Editar categoría"
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setCatToDelete(c)
                  setIsDeleteDialogOpen(true)
                }}
                title="Eliminar categoría"
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
          <FolderTree className="size-6" />
          Categorías del Catálogo
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Estructura y clasificación jerárquica de componentes y productos (SRS-CAT-007).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar categorías..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={handleOpenCreate}
        >
          <Plus className="size-4" />
          Nueva Categoría
        </Button>
      </div>

      <ModalCategoria
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        categoria={selectedCategoria}
        categoriasDisponibles={categorias}
        onSuccess={() => void loadCategorias()}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría{" "}
              <strong>{catToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
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
            onClick={() => void loadCategorias()}
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
          data={categorias}
          searchValue={search}
          searchKeys={["nombre", "categoriaPadreNombre"]}
          emptyMessage="No se encontraron categorías registradas."
        />
      )}
    </div>
  )
}
