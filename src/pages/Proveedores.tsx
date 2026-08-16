import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalProveedor } from "@/components/Modal/ModalProveedor"
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
import { deleteProveedor, getProveedores } from "@/services/proveedor.service"
import type { Proveedor } from "@/types/proveedor"

export const Proveedores = () => {
  const [search, setSearch] = useState("")
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [provToDelete, setProvToDelete] = useState<Proveedor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadProveedores = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProveedores()
      setProveedores(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar los proveedores. Intenta nuevamente."
      setError(msg)
      setProveedores([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProveedores()
  }, [])

  const handleOpenCreate = () => {
    setSelectedProveedor(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: Proveedor) => {
    setSelectedProveedor(p)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!provToDelete) return
    setIsDeleting(true)

    try {
      await deleteProveedor(provToDelete.id)
      setProveedores((prev) =>
        prev.map((p) => (p.id === provToDelete.id ? { ...p, estado: "Inactivo" } : p))
      )
      setIsDeleteDialogOpen(false)
      setProvToDelete(null)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al desactivar el proveedor."
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Proveedor, unknown>[]>(
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
        accessorKey: "nombreProveedor",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{row.original.nombreProveedor}</span>
          </div>
        ),
      },
      {
        accessorKey: "telefono",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <Phone className="size-3.5 text-muted-foreground" />
            <span>{row.original.telefono}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Correo" />,
        cell: ({ row }) =>
          row.original.email ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3.5" />
              <span>{row.original.email}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
      },
      {
        accessorKey: "direccion",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dirección" />,
        cell: ({ row }) =>
          row.original.direccion ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{row.original.direccion}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => (
          <Badge variant={row.original.estado === "Activo" ? "success" : "warning"}>
            {row.original.estado}
          </Badge>
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
                title="Editar proveedor"
              >
                <Edit2 className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setProvToDelete(p)
                  setIsDeleteDialogOpen(true)
                }}
                disabled={p.estado === "Inactivo"}
                title="Desactivar proveedor"
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
          <Building2 className="size-6" />
          Directorio de Proveedores
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión de proveedores para compras de existencias de inventario (SRS-PRO-001, SRS-PRO-002).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar proveedores por nombre o teléfono..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={handleOpenCreate}
        >
          <Plus className="size-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <ModalProveedor
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        proveedor={selectedProveedor}
        onSuccess={() => void loadProveedores()}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Desactivar Proveedor</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas marcar como Inactivo al proveedor{" "}
              <strong>{provToDelete?.nombreProveedor}</strong>? Los proveedores inactivos no pueden ser seleccionados en nuevas compras de inventario.
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
              {isDeleting ? "Desactivando..." : "Desactivar"}
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
            onClick={() => void loadProveedores()}
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
          data={proveedores}
          searchValue={search}
          searchKeys={["nombreProveedor", "telefono", "email"]}
          emptyMessage="No se encontraron proveedores registrados."
        />
      )}
    </div>
  )
}
