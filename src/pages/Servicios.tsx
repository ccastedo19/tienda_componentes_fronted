import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit2, Trash2, Wrench } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalServicio } from "@/components/Modal/ModalServicio"
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
import { deleteServicio, getServicios } from "@/services/servicio.service"
import type { Servicio } from "@/types/servicio"

export const Servicios = () => {
  const [search, setSearch] = useState("")
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [servToDelete, setServToDelete] = useState<Servicio | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadServicios = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getServicios()
      setServicios(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar los servicios. Intenta nuevamente."
      setError(msg)
      setServicios([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadServicios()
  }, [])

  const handleOpenCreate = () => {
    setSelectedServicio(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (s: Servicio) => {
    setSelectedServicio(s)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!servToDelete) return
    setIsDeleting(true)

    try {
      await deleteServicio(servToDelete.id)
      setServicios((prev) => prev.filter((s) => s.id !== servToDelete.id))
      setIsDeleteDialogOpen(false)
      setServToDelete(null)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al eliminar el servicio."
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Servicio, unknown>[]>(
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            {row.original.imagenUrl ? (
              <img
                src={row.original.imagenUrl}
                alt={row.original.nombre}
                className="size-8 rounded-md object-cover border border-border shrink-0"
              />
            ) : (
              <div className="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Wrench className="size-4" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{row.original.nombre}</p>
              {row.original.descripcion && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {row.original.descripcion}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "precioBaseSugerido",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Precio Base Sugerido" />,
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            ${row.original.precioBaseSugerido.toFixed(2)}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(s)}
                title="Editar servicio"
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setServToDelete(s)
                  setIsDeleteDialogOpen(true)
                }}
                title="Eliminar servicio"
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
          <Wrench className="size-6" />
          Servicios Técnicos Intangibles
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Catálogo de mano de obra y trabajos de taller con precio base sugerido (SRS-CAT-005).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar servicios técnicos..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={handleOpenCreate}
        >
          <Plus className="size-4" />
          Nuevo Servicio
        </Button>
      </div>

      <ModalServicio
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        servicio={selectedServicio}
        onSuccess={() => void loadServicios()}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Servicio Técnico</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el servicio{" "}
              <strong>{servToDelete?.nombre}</strong>?
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
            onClick={() => void loadServicios()}
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
          data={servicios}
          searchValue={search}
          searchKeys={["nombre", "descripcion"]}
          emptyMessage="No se encontraron servicios registrados."
        />
      )}
    </div>
  )
}
