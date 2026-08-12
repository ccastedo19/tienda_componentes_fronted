import { useState, useEffect } from "react"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  QrCode,
  Users,
  Building2,
  PackageX,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import {
  getDashboardMetrics,
  getProductividad,
  getRendimientoProveedores,
  getRentabilidad,
  getRoiTaller,
  getStockMuerto,
} from "@/services/analitica.service"
import type {
  DashboardMetrics,
  ProductividadOperador,
  ProveedorRendimiento,
  RentabilidadMetrics,
  RoiTaller,
  StockMuerto,
} from "@/types/analitica"

export const Inicio = () => {
  const { user } = useAuth()
  const isAdmin = user?.rol?.toLowerCase() === "administrador"

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [rentabilidad, setRentabilidad] = useState<RentabilidadMetrics | null>(null)
  const [productividad, setProductividad] = useState<ProductividadOperador[]>([])
  const [proveedores, setProveedores] = useState<ProveedorRendimiento[]>([])
  const [stockMuerto, setStockMuerto] = useState<StockMuerto[]>([])
  const [roiTaller, setRoiTaller] = useState<RoiTaller | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (isAdmin) {
        const [m, r, prod, prov, sm, roi] = await Promise.all([
          getDashboardMetrics().catch(() => null),
          getRentabilidad().catch(() => null),
          getProductividad().catch(() => []),
          getRendimientoProveedores().catch(() => []),
          getStockMuerto().catch(() => []),
          getRoiTaller().catch(() => null),
        ])
        setMetrics(m)
        setRentabilidad(r)
        setProductividad(prod)
        setProveedores(prov)
        setStockMuerto(sm)
        setRoiTaller(roi)
      } else {
        const m = await getDashboardMetrics().catch(() => null)
        setMetrics(m)
      }
    } catch {
      // error handling
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [isAdmin])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Bienvenido, {user?.nombre} {user?.apellido}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Panel de control general y análisis ejecutivo del negocio en tiempo real.
          </p>
        </div>
        <Badge variant={isAdmin ? "default" : "secondary"}>
          Rol: {user?.rol}
        </Badge>
      </div>

      {/* KPI CARDS: Métricas del Día (SRS-ANA-001) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Ventas Totales Hoy</span>
              <DollarSign className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              ${(metrics?.totalVentasHoy ?? 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics?.cantidadVentasHoy ?? 0} transacciones cobradas hoy
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Efectivo en Caja</span>
              <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${(metrics?.totalEfectivoHoy ?? 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ingresos físicos en cajón de cobro
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">QR Bancario</span>
              <QrCode className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${(metrics?.totalQrHoy ?? 0).toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Liquidado directo a cuenta bancaria
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Alertas Stock Mínimo</span>
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {metrics?.productosStockBajoCount ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Artículos por debajo del umbral seguro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN ANALÍTICA AVANZADA PARA ADMINISTRADORES */}
      {isAdmin && (
        <div className="space-y-6 pt-2">
          {/* Card Rentabilidad Neta (SRS-ANA-003) */}
          {rentabilidad && (
            <Card className="border-border shadow-xs bg-gradient-to-br from-card via-card to-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-base">Rentabilidad Neta Consolidada (SRS-ANA-003)</CardTitle>
                  </div>
                  <Badge variant="outline">Auditoría Financiera</Badge>
                </div>
                <CardDescription>
                  Fórmula: Ingresos Brutos de Venta − Costo de Adquisición de lo Vendido − Pérdidas por Mermas Declaradas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <span className="text-muted-foreground">Ingreso Bruto Ventas</span>
                    <p className="text-base font-bold text-foreground mt-1">
                      ${rentabilidad.ingresoBrutoVentas.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <span className="text-muted-foreground">(-) Costo Adquisición</span>
                    <p className="text-base font-bold text-muted-foreground mt-1">
                      ${rentabilidad.costoAdquisicionVendidos.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <span className="text-muted-foreground">(-) Mermas y Pérdidas</span>
                    <p className="text-base font-bold text-destructive mt-1">
                      ${rentabilidad.valorMermasDeclaradas.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                    <span className="text-emerald-800 dark:text-emerald-300 font-semibold">(=) Ganancia Neta Real</span>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      ${rentabilidad.rentabilidadNeta.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grids de Reportes Especializados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Productividad Operadores (SRS-ANA-004) */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  <CardTitle className="text-sm">Productividad por Operador (SRS-ANA-004)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2 text-left">Vendedor</th>
                        <th className="p-2 text-center">Ventas</th>
                        <th className="p-2 text-right">Facturación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {productividad.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-muted-foreground">
                            Sin registros de ventas aún.
                          </td>
                        </tr>
                      ) : (
                        productividad.map((p) => (
                          <tr key={p.usuarioId}>
                            <td className="p-2 font-medium text-foreground">
                              {p.operadorNombre}
                            </td>
                            <td className="p-2 text-center">{p.cantidadVentas}</td>
                            <td className="p-2 text-right font-bold text-foreground">
                              ${p.volumenBrutoFacturacion.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Rendimiento de Proveedores (SRS-ANA-005) */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  <CardTitle className="text-sm">Rendimiento de Proveedores (SRS-ANA-005)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2 text-left">Proveedor</th>
                        <th className="p-2 text-right">Comprado</th>
                        <th className="p-2 text-right">Margen</th>
                        <th className="p-2 text-center">Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {proveedores.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-muted-foreground">
                            Sin compras registradas.
                          </td>
                        </tr>
                      ) : (
                        proveedores.map((pr) => (
                          <tr key={pr.proveedorId}>
                            <td className="p-2 font-medium text-foreground">
                              {pr.proveedorNombre}
                            </td>
                            <td className="p-2 text-right">${pr.totalComprado.toFixed(2)}</td>
                            <td className="p-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              +${pr.margenGanancia.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline">{pr.ratioRendimiento.toFixed(2)}x</Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stock Muerto > 90 días (SRS-ANA-006) */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <PackageX className="size-4 text-destructive" />
                  <CardTitle className="text-sm">Stock Muerto / Inmovilizado &gt;90 Días (SRS-ANA-006)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2 text-left">Artículo</th>
                        <th className="p-2 text-center">Stock</th>
                        <th className="p-2 text-right">Capital Inmovilizado</th>
                        <th className="p-2 text-center">Días Sin Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stockMuerto.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-muted-foreground">
                            No se detectó inventario estancado &gt;90 días.
                          </td>
                        </tr>
                      ) : (
                        stockMuerto.map((sm) => (
                          <tr key={sm.productoId}>
                            <td className="p-2">
                              <p className="font-medium text-foreground">{sm.nombreComercial}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{sm.sku}</p>
                            </td>
                            <td className="p-2 text-center">{sm.stockActual} un.</td>
                            <td className="p-2 text-right font-bold text-destructive">
                              ${sm.capitalInmovilizado.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="destructive">{sm.diasSinMovimiento} d</Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ROI de Taller y Servicios (SRS-ANA-007) */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4" />
                  <CardTitle className="text-sm">Retorno de Inversión (ROI) de Taller (SRS-ANA-007)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                {roiTaller ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                        <span className="text-muted-foreground text-[11px]">Órdenes Finalizadas</span>
                        <p className="text-base font-bold text-foreground mt-0.5">
                          {roiTaller.cantidadOrdenesFinalizadas}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                        <span className="text-muted-foreground text-[11px]">Ingresos Mano de Obra</span>
                        <p className="text-base font-bold text-foreground mt-0.5">
                          ${roiTaller.ingresosManoDeObra.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                        <span className="text-muted-foreground text-[11px]">Costo de Repuestos</span>
                        <p className="text-base font-bold text-muted-foreground mt-0.5">
                          ${roiTaller.costoRepuestosConsumidos.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                      <div>
                        <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                          Ganancia Neta del Taller
                        </span>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                          ${roiTaller.gananciaNetaTaller.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="success" className="text-xs">
                        Margen: {roiTaller.margenRentabilidad.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Sin datos de taller disponibles.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
