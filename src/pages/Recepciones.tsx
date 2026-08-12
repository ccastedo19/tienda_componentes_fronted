import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Wrench, CheckCircle2, XCircle } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalOrdenTecnica } from "@/components/Modal/ModalOrdenTecnica"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { getUsers } from "@/services/auth.service"
import { getOrdenesTecnicas, updateOrdenTecnicaEstado } from "@/services/ordenTecnica.service"
import { getProductos } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import type { OrdenTecnica } from "@/types/ordenTecnica"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { Usuario } from "@/types/usuario"

export const Recepciones = () => {
  const [search, setSearch] = useState("")
  const [ordenes, setOrdenes] = useState<OrdenTecnica[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tecnicos, setTecnicos] = useState<Usuario[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ords, prods, servs, users] = await Promise.all([
        getOrdenesTecnicas(),
        getProductos(),
        getServicios(),
        getUsers(),
      ])
      setOrdenes(ords)
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
        prev.map((o) => (o.id === orden.id ? { ...o, estado: updated.estado } : o))
      )
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al actualizar estado de la orden."
      setError(msg)
    }
  }

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
          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
            {row.original.codigoOrden}
          </Badge>
        ),
      },
      {
        accessorKey: "clienteNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.clienteNombre}</p>
            <p className="text-xs text-muted-foreground">CI: {row.original.clienteCi}</p>
          </div>
        ),
      },
      {
        accessorKey: "tecnicoNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Técnico" />,
        cell: ({ row }) => <span>{row.original.tecnicoNombre || "Sin asignar"}</span>,
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
          if (ord.estado === "Finalizada" || ord.estado === "Cancelada") {
            return <span className="text-xs text-muted-foreground font-mono">Cerrada</span>
          }

          return (
            <div className="flex items-center gap-1.5">
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
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  Finalizar
                </Button>
              )}

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
          Taller y Órdenes de Servicio Técnico (Recepciones)
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión de reparaciones, repuestos retenidos (stockReservado) y liquidación de servicios técnicos (SRS-CAT-006).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, cliente o técnico..."
        />

        <Button
          type="button"
          className="w-full sm:w-auto cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="size-4" />
          Nueva Orden Técnica
        </Button>
      </div>

      <ModalOrdenTecnica
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        productos={productos}
        servicios={servicios}
        tecnicos={tecnicos}
        onSuccess={() => void loadData()}
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
          data={ordenes}
          searchValue={search}
          searchKeys={["codigoOrden", "clienteNombre", "clienteCi", "tecnicoNombre", "estado"]}
          emptyMessage="No se encontraron órdenes de servicio técnico registradas."
        />
      )}
    </div>
  )
}
