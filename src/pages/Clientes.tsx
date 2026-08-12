import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalCliente } from "@/components/Modal/ModalCliente"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { getClientes } from "@/services/cliente.service"
import type { Cliente } from "@/types/cliente"

export const Clientes = () => {
  const [search, setSearch] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadClientes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getClientes()
      setClientes(data)
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar los clientes. Intenta nuevamente."

      setError(message)
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadClientes()
  }, [])

  const columns = useMemo<ColumnDef<Cliente, unknown>[]>(
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
        accessorKey: "ci",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CI" />
        ),
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
      },
      {
        accessorKey: "apellido",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Apellido" />
        ),
      },
      {
        accessorKey: "telefono",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Teléfono" />
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Correo" />
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha creación" />
        ),
        cell: ({ row }) => formatDateTime(String(row.getValue("createdAt"))),
        sortingFn: (rowA, rowB) =>
          new Date(String(rowA.getValue("createdAt"))).getTime() -
          new Date(String(rowB.getValue("createdAt"))).getTime(),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Gestor de Clientes
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestiona tus clientes para realizar transacciones de ventas y
          cotizaciones.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar clientes..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="size-4" />
          Nuevo Cliente
        </Button>
      </div>

      <ModalCliente
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode="create"
        onSuccess={(cliente) => {
          setClientes((prev) => [cliente, ...prev])
        }}
      />

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadClientes()}
            className="w-full sm:w-auto"
          >
            Reintentar
          </Button>
        </div>
      ) : null}

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
          data={clientes}
          searchValue={search}
          searchKeys={["ci", "nombre", "apellido", "telefono", "email"]}
          emptyMessage="No se encontraron clientes."
        />
      )}
    </div>
  )
}
