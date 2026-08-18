import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, CheckCircle2, XCircle, Eye, ShoppingCart, UserCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalAsignarTecnico } from "@/components/Modal/ModalAsignarTecnico"
import { ModalDetalleOrdenTecnica } from "@/components/Modal/ModalDetalleOrdenTecnica"
import { ModalOrdenTecnica } from "@/components/Modal/ModalOrdenTecnica"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { getUsers } from "@/services/auth.service"
import { getClientes } from "@/services/cliente.service"
import { getOrdenesTecnicas, updateOrdenTecnicaEstado } from "@/services/ordenTecnica.service"
import { getProductos } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import type { Cliente } from "@/types/cliente"
import type { OrdenTecnica } from "@/types/ordenTecnica"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { Usuario } from "@/types/usuario"

type EstadoOrden = OrdenTecnica["estado"]
type FiltroEstado = "TODOS" | EstadoOrden

const ESTADOS_ORDEN: EstadoOrden[] = [
  "Pendiente",
  "En Proceso",
  "Finalizada",
  "Cancelada",
]

export const Recepciones = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS")
  const [ordenes, setOrdenes] = useState<OrdenTecnica[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ordenParaVer, setOrdenParaVer] = useState<OrdenTecnica | null>(null)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false)
  const [ordenParaAsignar, setOrdenParaAsignar] = useState<OrdenTecnica | null>(null)
  const [isAsignarOpen, setIsAsignarOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ords, clis, prods, servs, users] = await Promise.all([
        getOrdenesTecnicas(),
        getClientes(),
        getProductos(),
        getServicios(),
        getUsers(),
      ])
      setOrdenes(ords)
      setClientes(clis)
      setProductos(prods)
      setServicios(servs)
      setTecnicos(users)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar las órdenes técnicas."
      setError(msg)
      setOrdenes([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleCambiarEstado = async (
    orden: OrdenTecnica,
    nuevoEstado: "Pendiente" | "En Proceso" | "Finalizada" | "Cancelada"
  ) => {
    try {
      const updated = await updateOrdenTecnicaEstado(orden.id, nuevoEstado)
      setOrdenes((prev) =>
        prev.map((o) => (o.id === orden.id ? { ...o, estado: updated.estado, fechaHoraFinalizacion: updated.fechaHoraFinalizacion } : o))
      )
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al actualizar estado de la orden."
      setError(msg)
    }
  }

  const handleTecnicoAsignado = (updated: OrdenTecnica) => {
    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === updated.id
          ? { ...o, tecnicoId: updated.tecnicoId, tecnicoNombre: updated.tecnicoNombre }
          : o
      )
    )
  }

  const ordenesFiltradas = useMemo(() => {
    if (filtroEstado === "TODOS") return ordenes
    return ordenes.filter((orden) => orden.estado === filtroEstado)
  }, [filtroEstado, ordenes])

  const columns = useMemo<ColumnDef<OrdenTecnica, unknown>[]>(
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
        accessorKey: "codigoOrden",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Código Orden" />,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              setOrdenParaVer(row.original)
              setIsDetalleOpen(true)
            }}
            className="font-mono text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.original.codigoOrden}
          </button>
        ),
      },
      {
        accessorKey: "clienteNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.clienteNombre}</p>
            <p className="text-xs text-muted-foreground">CI/NIT: {row.original.clienteCi}</p>
          </div>
        ),
      },
      {
        accessorKey: "tecnicoNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Técnico" />,
        cell: ({ row }) => {
          const tec = row.original.tecnicoNombre
          return (
            <div className="flex items-center gap-1.5">
              <span className={tec ? "text-foreground" : "text-muted-foreground italic text-xs"}>
                {tec || "Sin asignar"}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "fechaHoraIngreso",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ingreso" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHoraIngreso)}
          </span>
        ),
      },
      {
        accessorKey: "diagnostico",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Diagnóstico" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {row.original.diagnostico || "-"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const st = row.original.estado
          if (st === "Pendiente") return <Badge variant="warning">Pendiente</Badge>
          if (st === "En Proceso") return <Badge variant="info">En Proceso</Badge>
          if (st === "Finalizada") return <Badge variant="success">Finalizada</Badge>
          return <Badge variant="destructive">Cancelada</Badge>
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const ord = row.original

          return (
            <div className="flex items-center gap-1">
              {/* Ver Detalle */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setOrdenParaVer(ord)
                  setIsDetalleOpen(true)
                }}
                title="Ver detalle de la orden"
              >
                <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
              </Button>

              {/* Asignar / Cambiar Técnico */}
              {ord.estado !== "Cancelada" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setOrdenParaAsignar(ord)
                    setIsAsignarOpen(true)
                  }}
                  title={ord.tecnicoId ? "Reasignar técnico" : "Asignar técnico"}
                  className="text-primary hover:bg-primary/10"
                >
                  <UserCheck className="size-3.5" />
                </Button>
              )}

              {/* Cobrar en POS */}
              {ord.estado !== "Cancelada" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => navigate("/venta", { state: { ordenTecnica: ord } })}
                  title="Cobrar en POS / Facturar"
                  className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ShoppingCart className="size-3.5" />
                </Button>
              )}

              {/* Estados de flujo */}
              {ord.estado === "Pendiente" && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => void handleCambiarEstado(ord, "En Proceso")}
                >
                  Iniciar
                </Button>
              )}

              {ord.estado === "En Proceso" && (
                <Button
                  type="button"
                  size="xs"
                  onClick={() => void handleCambiarEstado(ord, "Finalizada")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Finalizar reparación técnica"
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  Finalizar
                </Button>
              )}

              {ord.estado !== "Finalizada" && ord.estado !== "Cancelada" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => void handleCambiarEstado(ord, "Cancelada")}
                  className="text-destructive hover:bg-destructive/10"
                  title="Cancelar Orden"
                >
                  <XCircle className="size-3.5" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          Taller y Órdenes de Servicio Técnico (Recepciones)
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión de reparaciones, repuestos retenidos (stockReservado), asignación de personal y liquidación en POS.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código, cliente o técnico..."
            className="w-full sm:max-w-sm"
          />

          <Select
            value={filtroEstado}
            onValueChange={(value) =>
              setFiltroEstado((value as FiltroEstado | null) ?? "TODOS")
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS_ORDEN.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="size-4" />
          Nueva Orden Técnica
        </Button>
      </div>

      <ModalOrdenTecnica
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clientes={clientes}
        productos={productos}
        servicios={servicios}
        tecnicos={tecnicos}
        onSuccess={() => void loadData()}
      />

      <ModalDetalleOrdenTecnica
        open={isDetalleOpen}
        onOpenChange={setIsDetalleOpen}
        orden={ordenParaVer}
      />

      <ModalAsignarTecnico
        open={isAsignarOpen}
        onOpenChange={setIsAsignarOpen}
        orden={ordenParaAsignar}
        usuarios={tecnicos}
        onSuccess={handleTecnicoAsignado}
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
          data={ordenesFiltradas}
          searchValue={search}
          searchKeys={["codigoOrden", "clienteNombre", "clienteCi", "tecnicoNombre", "estado"]}
          emptyMessage="No se encontraron órdenes de servicio técnico registradas."
        />
      )}
    </div>
  )
}
