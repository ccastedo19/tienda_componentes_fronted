import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertOctagon, ArrowDownRight, ArrowUpRight, ClipboardList } from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ModalMerma } from "@/components/Modal/ModalMerma"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateTime } from "@/lib/format-date"
import { getKardexByProducto } from "@/services/kardex.service"
import { getMermas } from "@/services/merma.service"
import { getProductos } from "@/services/producto.service"
import type { KardexMovimiento } from "@/types/kardex"
import type { Merma } from "@/types/merma"
import type { Producto } from "@/types/producto"

export const Kardex_inventario = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProdId, setSelectedProdId] = useState<string>("")
  const [kardexMovimientos, setKardexMovimientos] = useState<KardexMovimiento[]>([])
  const [mermas, setMermas] = useState<Merma[]>([])

  const [isLoadingKardex, setIsLoadingKardex] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Merma modal
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false)

  const loadInitialData = async () => {
    try {
      const [prodsData, mermasData] = await Promise.all([getProductos(), getMermas()])
      setProductos(prodsData)
      setMermas(mermasData)
      if (prodsData.length > 0) {
        setSelectedProdId(prodsData[0].id)
      }
    } catch {
      setError("No se pudieron cargar los datos de inventario.")
    }
  }

  const loadKardexForProduct = async (prodId: string) => {
    if (!prodId) return
    setIsLoadingKardex(true)
    setError(null)
    try {
      const data = await getKardexByProducto(prodId)
      setKardexMovimientos(data)
    } catch {
      setKardexMovimientos([])
      setError("Error al consultar el historial de movimientos de kardex.")
    } finally {
      setIsLoadingKardex(false)
    }
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedProdId) {
      void loadKardexForProduct(selectedProdId)
    }
  }, [selectedProdId])

  const selectedProduct = useMemo(
    () => productos.find((p) => p.id === selectedProdId),
    [productos, selectedProdId]
  )

  const kardexColumns = useMemo<ColumnDef<KardexMovimiento, unknown>[]>(
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
        accessorKey: "fechaHora",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha / Hora" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHora)}
          </span>
        ),
      },
      {
        accessorKey: "tipoMovimiento",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo Movimiento" />,
        cell: ({ row }) => {
          const tm = row.original.tipoMovimiento
          const isIngreso = tm.toLowerCase().includes("compra") || tm.toLowerCase().includes("ingreso")
          const isMerma = tm.toLowerCase().includes("merma")

          return (
            <Badge variant={isIngreso ? "success" : isMerma ? "destructive" : "outline"} className="gap-1">
              {isIngreso ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {tm}
            </Badge>
          )
        },
      },
      {
        accessorKey: "usuarioNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Operador" />,
        cell: ({ row }) => <span>{row.original.usuarioNombre || "Sistema"}</span>,
      },
      {
        accessorKey: "cantidad",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" />,
        cell: ({ row }) => {
          const cant = row.original.cantidad
          return (
            <span className={`font-semibold ${cant > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {cant > 0 ? `+${cant}` : cant} un.
            </span>
          )
        },
      },
      {
        accessorKey: "saldoExistencias",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo Existencias" />,
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.saldoExistencias} un.</span>
        ),
      },
    ],
    []
  )

  const mermaColumns = useMemo<ColumnDef<Merma, unknown>[]>(
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
        accessorKey: "tipoMerma",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Merma" />,
        cell: ({ row }) => (
          <Badge variant={row.original.tipoMerma === "Pérdida Física" ? "destructive" : "warning"}>
            {row.original.tipoMerma}
          </Badge>
        ),
      },
      {
        accessorKey: "usuarioNombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Declarado Por" />,
        cell: ({ row }) => <span>{row.original.usuarioNombre}</span>,
      },
      {
        accessorKey: "fechaHora",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha / Hora" />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.fechaHora)}
          </span>
        ),
      },
      {
        accessorKey: "observacion",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Justificación (SRS-INV-004)" />,
        cell: ({ row }) => (
          <span className="text-xs text-foreground italic line-clamp-2">
            "{row.original.observacion}"
          </span>
        ),
      },
      {
        accessorKey: "totalPerdida",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pérdida Económica" />,
        cell: ({ row }) => (
          <span className="font-bold text-destructive">
            Bs. {row.original.totalPerdida.toFixed(2)}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <ClipboardList className="size-6" />
            Control de Kardex y Registro de Mermas
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Auditoría de libro mayor de movimientos por producto (SRS-INV-001) y registro inmutable de pérdidas (SRS-INV-004).
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsMermaModalOpen(true)}
          className="cursor-pointer gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <AlertOctagon className="size-4" />
          Registrar Merma / Pérdida
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error en inventario</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ModalMerma
        open={isMermaModalOpen}
        onOpenChange={setIsMermaModalOpen}
        productos={productos}
        onSuccess={() => {
          void loadInitialData()
          if (selectedProdId) void loadKardexForProduct(selectedProdId)
        }}
      />

      <Tabs defaultValue="kardex" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="kardex">Kardex por Producto</TabsTrigger>
          <TabsTrigger value="mermas">Historial de Mermas</TabsTrigger>
        </TabsList>

        <TabsContent value="kardex" className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Seleccionar Artículo a Auditar</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select value={selectedProdId} onValueChange={(val) => setSelectedProdId(val ?? "")}>
                  <SelectTrigger className="w-full sm:w-96">
                    <SelectValue placeholder="Selecciona un producto...">
                      {selectedProduct ? `${selectedProduct.nombreComercial} (Código: ${selectedProduct.skuUnico})` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombreComercial} (Código: {p.skuUnico})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedProduct && (
                  <div className="flex items-center gap-3 text-xs bg-muted/40 p-2 rounded-md border border-border">
                    <span>
                      Stock Actual: <strong>{selectedProduct.stockActual} un.</strong>
                    </span>
                    <span>•</span>
                    <span>
                      P. Costo: <strong>Bs. {selectedProduct.precioCosto.toFixed(2)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      P. Venta: <strong>Bs. {selectedProduct.precioVenta.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isLoadingKardex ? (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          ) : (
            <DataTable
              columns={kardexColumns}
              data={kardexMovimientos}
              emptyMessage="No se encontraron movimientos registrados en el Kardex para este producto."
            />
          )}
        </TabsContent>

        <TabsContent value="mermas" className="space-y-4">
          <DataTable
            columns={mermaColumns}
            data={mermas}
            emptyMessage="No hay registros de mermas o pérdidas declaradas en el sistema."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
