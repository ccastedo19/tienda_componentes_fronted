import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  ShieldAlert,
  Users,
  Eye,
  EyeOff,
} from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalUsuario } from "@/components/Modal/ModalUsuario"
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
import { useAuth } from "@/hooks/use-auth"
import { ApiRequestError } from "@/lib/api/client"
import {
  getUsers,
  deactivateUser,
  changeUserStatus,
} from "@/services/auth.service"
import type { Usuario } from "@/types/usuario"

export const Usuarios = () => {
  const { user: currentUser } = useAuth()

  const [search, setSearch] = useState("")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [incluirEliminados, setIncluirEliminados] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsuarios = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Cargar todos los usuarios para calcular los KPIs reales
      const data = await getUsers(undefined, true)
      setUsuarios(data)
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar los usuarios. Intenta nuevamente."
      setError(message)
      setUsuarios([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsuarios()
  }, [])

  const handleOpenCreate = () => {
    setSelectedUsuario(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (usuario: Usuario) => {
    if (usuario.id === currentUser?.id) {
      alert("No puedes desactivar o suspender tu propia cuenta.")
      return
    }

    const nuevoEstado = usuario.estado === 1 ? 2 : 1
    try {
      const updated = await changeUserStatus(usuario.id, nuevoEstado)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, estado: updated.estado } : u))
      )
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Error al cambiar estado del usuario."
      alert(message)
    }
  }

  const handleReactivar = async (usuario: Usuario) => {
    try {
      const updated = await changeUserStatus(usuario.id, 1)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, estado: updated.estado } : u))
      )
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Error al reactivar el usuario."
      alert(message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    if (userToDelete.id === currentUser?.id) {
      alert("No puedes dar de baja o eliminar tu propia cuenta de usuario.")
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      return
    }

    setIsDeleting(true)

    try {
      await deactivateUser(userToDelete.id)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userToDelete.id ? { ...u, estado: 0 } : u))
      )
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Error al desactivar el usuario."
      alert(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsuarios = useMemo(() => {
    if (incluirEliminados) {
      return usuarios
    }
    return usuarios.filter((u) => u.estado !== 0)
  }, [usuarios, incluirEliminados])

  const stats = useMemo(() => {
    const total = usuarios.length
    const activos = usuarios.filter((u) => u.estado === 1).length
    const inactivos = usuarios.filter((u) => u.estado === 2).length
    const eliminados = usuarios.filter((u) => u.estado === 0).length
    return { total, activos, inactivos, eliminados }
  }, [usuarios])

  const columns = useMemo<ColumnDef<Usuario, unknown>[]>(
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre Completo" />,
        cell: ({ row }) => {
          const isSelf = row.original.id === currentUser?.id
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {row.original.nombre} {row.original.apellido}
              </span>
              {isSelf && (
                <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400">
                  Tú (Sesión actual)
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Correo / Usuario" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "rol",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
        cell: ({ row }) => (
          <Badge variant={row.original.rol === "Administrador" ? "default" : "secondary"}>
            {row.original.rol}
          </Badge>
        ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const st = row.original.estado
          if (st === 1) return <Badge variant="success">Activo</Badge>
          if (st === 2) return <Badge variant="warning">Inactivo</Badge>
          return <Badge variant="destructive">Eliminado (Baja)</Badge>
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const u = row.original
          const isEliminado = u.estado === 0
          const isSelf = u.id === currentUser?.id

          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(u)}
                disabled={isEliminado}
                title="Editar usuario"
              >
                <Edit2 className="size-3.5" />
              </Button>

              {/* Si es el usuario autenticado, no puede desactivarse ni darse de baja a sí mismo */}
              {!isSelf ? (
                <>
                  {!isEliminado ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => void handleToggleStatus(u)}
                        title={u.estado === 1 ? "Desactivar temporalmente" : "Activar usuario"}
                      >
                        {u.estado === 1 ? (
                          <UserX className="size-3.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setUserToDelete(u)
                          setIsDeleteDialogOpen(true)
                        }}
                        title="Dar de baja lógica"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void handleReactivar(u)}
                      className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      title="Reactivar usuario"
                    >
                      <UserCheck className="size-3.5" />
                    </Button>
                  )}
                </>
              ) : null}
            </div>
          )
        },
      },
    ],
    [currentUser?.id]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <Users className="size-6" />
            Gestión de Personal y Usuarios
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Administra las cuentas del personal, roles (Administrador / Vendedor) y estados de acceso.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            type="button"
            className="cursor-pointer gap-1"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* KPI Cards de Personal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Total Cuentas</span>
          <p className="text-lg font-bold text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Personal Activo</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.activos}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground">Personal Inactivo</span>
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
          placeholder="Buscar usuario..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadUsuarios()}
        >
          Actualizar
        </Button>
      </div>

      <ModalUsuario
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        usuario={selectedUsuario}
        onSuccess={(u) => {
          if (modalMode === "create") {
            setUsuarios((prev) => [u, ...prev])
          } else {
            setUsuarios((prev) => prev.map((item) => (item.id === u.id ? u : item)))
          }
        }}
      />

      {/* Modal Confirmar Baja Lógica (SRS-SEC-008) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              Baja Lógica de Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas dar de baja la cuenta de{" "}
              <strong className="text-foreground">
                {userToDelete?.nombre} {userToDelete?.apellido} ({userToDelete?.email})
              </strong>
              ? El usuario pasará al estado <span className="font-semibold">Eliminado (0)</span> y no podrá iniciar sesión en el sistema, pero se preservará su historial.
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
              {isDeleting ? "Procesando..." : "Confirmar Baja Lógica"}
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
            onClick={() => void loadUsuarios()}
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
          data={filteredUsuarios}
          searchValue={search}
          searchKeys={["nombre", "apellido", "email", "rol"]}
          emptyMessage="No se encontraron usuarios registrados."
        />
      )}
    </div>
  )
}
