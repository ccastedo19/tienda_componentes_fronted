import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { Button } from "@/components/ui/button"
import { clientesMock } from "@/data/clientes.mock"
import { formatDateTime } from "@/lib/format-date"
import type { Cliente } from "@/types/cliente"

export const Clientes = () => {
  const [search, setSearch] = useState("")

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

        <Button type="button" className="w-full sm:w-auto">
          <Plus className="size-4" />
          Nuevo Cliente
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={clientesMock}
        searchValue={search}
        searchKeys={["ci", "nombre", "apellido", "telefono", "email"]}
        emptyMessage="No se encontraron clientes."
      />
    </div>
  )
}
