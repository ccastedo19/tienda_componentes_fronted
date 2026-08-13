import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalCliente } from "@/components/Modal/ModalCliente"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import {
  changeClienteEstado,
  deactivateCliente,
  getClientes,
} from "@/services/cliente.service"
import type { Cliente } from "@/types/cliente"

export const Clientes = () => {
  const { user } = useAuth()
  const isAdmin = user?.rol?.toLowerCase() === "administrador"

  const [search, setSearch] = useState("")
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [incluirEliminados, setIncluirEliminados] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const loadClientes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Siempre cargar todos los clientes para mantener los contadores sincronizados en vivo
      const data = await getClientes(undefined, true)
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

  const handleOpenCreate = () => {
    setSelectedCliente(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleToggleEstado = async (cliente: Cliente) => {
    const nuevoEstado = cliente.estado === "Activo" ? "Inactivo" : "Activo"
    try {
      const updated = await changeClienteEstado(cliente.id, nuevoEstado)
      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, estado: updated.estado } : c))
      )
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al cambiar estado del cliente."
      alert(msg)
    }
  }

  const handleReactivar = async (cliente: Cliente) => {
    try {
      const updated = await changeClienteEstado(cliente.id, "Activo")
      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, estado: updated.estado } : c))
      )
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al reactivar cliente."
      alert(msg)
    }
  }

  const handleDelete = async (cliente: Cliente) => {
    const confirmed = window.confirm(
      `¿Estás seguro de dar de baja lógica al cliente "${cliente.nombre} ${cliente.apellido}" (CI: ${cliente.ci})?\n\nSu estado pasará a "Eliminado" preservando el historial de ventas y órdenes técnicas.`
    )
    if (!confirmed) return

    try {
      await deactivateCliente(cliente.id)
      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, estado: "Eliminado" } : c))
      )
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al eliminar el cliente."
      alert(msg)
    }
  }

  const filteredClientes = useMemo(() => {
    if (incluirEliminados) {
      return clientes
    }
    return clientes.filter((c) => c.estado !== "Eliminado")
  }, [clientes, incluirEliminados])

  const stats = useMemo(() => {
    const total = clientes.length
    const activos = clientes.filter((c) => c.estado === "Activo").length
    const inactivos = clientes.filter((c) => c.estado === "Inactivo").length
    const eliminados = clientes.filter((c) => c.estado === "Eliminado").length
    return { total, activos, inactivos, eliminados }
  }, [clientes])

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
        header: ({ column }) => <DataTableColumnHeader column={column} title="CI / Identificación" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
            {row.original.ci}
          </Badge>
        ),
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre Completo" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.nombre} {row.original.apellido}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "telefono",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
        cell: ({ row }) => <span>{row.original.telefono || "-"}</span>,
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Correo Electrónico" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email || "-"}</span>,
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const st = row.original.estado
          if (st === "Activo") return <Badge variant="success">Activo</Badge>
          if (st === "Inactivo") return <Badge variant="secondary">Inactivo</Badge>
          return <Badge variant="destructive">Eliminado (Baja)</Badge>
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha Registro" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.createdAt ? formatDateTime(row.original.createdAt) : "-"}
          </span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const c = row.original
          const isEliminado = c.estado === "Eliminado"

          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(c)}
                title="Editar datos del cliente"
                disabled={isEliminado}
              >
                <Edit className="size-3.5" />
              </Button>

              {isAdmin && (
                <>
                  {!isEliminado ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => void handleToggleEstado(c)}
                        title={c.estado === "Activo" ? "Marcar como Inactivo" : "Marcar como Activo"}
                      >
                        {c.estado === "Activo" ? (
                          <XCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => void handleDelete(c)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Dar de baja lógica"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void handleReactivar(c)}
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      title="Reactivar cliente"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <Users className="size-6" />
            Directorio de Clientes
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Gestión integral de clientes para compras en POS, recepción en taller y emisión de cotizaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIncluirEliminados(!incluirEliminados)}
              className="gap-1 text-xs"
            >
              {incluirEliminados ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {incluirEliminados ? "Ocultar Eliminados" : "Ver Eliminados"}
            </Button>
          )}

          <Button
            type="button"
            className="cursor-pointer gap-1"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Clientes Registrados</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Clientes Activos</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.activos}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Clientes Inactivos</span>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.inactivos}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Dados de Baja</span>
          <p className="text-lg font-bold text-destructive mt-0.5">
            {stats.eliminados}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por CI, nombre, teléfono o correo..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadClientes()}
        >
          Actualizar
        </Button>
      </div>

      <ModalCliente
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        cliente={selectedCliente}
        onSuccess={(c) => {
          if (modalMode === "create") {
            setClientes((prev) => [c, ...prev])
          } else {
            setClientes((prev) => prev.map((item) => (item.id === c.id ? c : item)))
          }
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
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredClientes}
          searchValue={search}
          searchKeys={["ci", "nombre", "apellido", "telefono", "email", "estado"]}
          emptyMessage="No se encontraron clientes registrados."
        />
      )}
    </div>
  )
}
