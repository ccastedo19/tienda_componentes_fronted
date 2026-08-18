import { useState, useEffect } from "react"
import {
  Wallet,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  HelpCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { ApiRequestError } from "@/lib/api/client"
import { formatDateTime } from "@/lib/format-date"
import { abrirCaja, cerrarCaja, getCajaActiva } from "@/services/caja.service"
import type { Caja } from "@/types/caja"

export const Apertura_cierre = () => {
  const { user } = useAuth()
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [montoInicial, setMontoInicial] = useState<string>("")
  const [recuentoFisico, setRecuentoFisico] = useState<string>("")
  const [resultadoCierre, setResultadoCierre] = useState<Caja | null>(null)

  const esAdmin =
    user?.rol?.toUpperCase() === "ADMINISTRADOR" || user?.rol?.toUpperCase() === "ADMIN"
  const esCreadorCaja = Boolean(cajaActiva && user?.id === cajaActiva.usuarioId)
  const puedeCerrar = esAdmin || esCreadorCaja

  const loadCajaActiva = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCajaActiva()
      setCajaActiva(data)
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        (err.code === "404" || err.code === "NOT_FOUND" || err.message.includes("No hay"))
      ) {
        setCajaActiva(null)
      } else {
        setCajaActiva(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCajaActiva()
  }, [])

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(montoInicial)
    if (isNaN(monto) || monto < 0) {
      setError("SRS-CAJ-002: El monto inicial en efectivo debe ser un número mayor o igual a 0.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setResultadoCierre(null)

    try {
      const data = await abrirCaja({ montoInicial: monto })
      setCajaActiva(data)
      setMontoInicial("0")
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al abrir la caja."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    const recuento = parseFloat(recuentoFisico)
    if (isNaN(recuento) || recuento < 0) {
      setError("Por favor ingresa un monto de recuento físico válido (mayor o igual a 0).")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const resultado = await cerrarCaja({ recuentoFisico: recuento })
      setResultadoCierre(resultado)
      setCajaActiva(null)
      setRecuentoFisico("")
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al procesar el cierre de caja."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <Wallet className="size-6" />
          Gestión de Cajas y Arqueo Diario
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Control centralizado de apertura de caja única, arqueo de recuento a ciegas y cierre supervisado por el Administrador.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Error en operación de caja</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultado de Cierre reciente si existe */}
      {resultadoCierre && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {resultadoCierre.estado === "Caja Cuadrada" ? (
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                )}
                <CardTitle className="text-lg">Resumen del Arqueo de Cierre</CardTitle>
              </div>
              <Badge
                variant={
                  resultadoCierre.estado === "Caja Cuadrada"
                    ? "success"
                    : resultadoCierre.estado === "Faltante"
                      ? "destructive"
                      : "warning"
                }
              >
                {resultadoCierre.estado}
              </Badge>
            </div>
            <CardDescription>
              La sesión de caja ha sido cerrada de forma inmutable.{" "}
              {resultadoCierre.usuarioCierreNombre &&
                resultadoCierre.usuarioCierreNombre !== resultadoCierre.usuarioNombre ? (
                <span className="font-semibold text-primary">
                  (Cierre ejecutado por Administrador: {resultadoCierre.usuarioCierreNombre})
                </span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3">
                <span className="text-xs text-muted-foreground">Saldo Esperado en Efectivo</span>
                <p className="text-lg font-bold text-foreground">Bs. {resultadoCierre.montoEsperado.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <span className="text-xs text-muted-foreground">Recuento Físico Reportado</span>
                <p className="text-lg font-bold text-foreground">Bs. {(resultadoCierre.recuentoFisico ?? 0).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <span className="text-xs text-muted-foreground">Diferencia Final</span>
                <p
                  className={`text-lg font-bold ${resultadoCierre.diferenciaMonto === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : resultadoCierre.diferenciaMonto < 0
                      ? "text-destructive"
                      : "text-amber-600 dark:text-amber-400"
                    }`}
                >
                  {resultadoCierre.diferenciaMonto > 0 ? "+" : ""}
                  Bs. {resultadoCierre.diferenciaMonto.toFixed(2)}
                </p>
              </div>
            </div>

            {resultadoCierre.estado !== "Caja Cuadrada" && (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                SRS-CAJ-008: Se ha emitido una alerta automática al panel del Administrador por discrepancia de saldo ({resultadoCierre.estado}).
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ESTADO 1: Caja NO abierta -> Formulario de Apertura */}
      {!cajaActiva ? (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 text-foreground">
              <Unlock className="size-5" />
              <CardTitle>Apertura de Sesión de Caja Única</CardTitle>
            </div>
            <CardDescription>
              Inicia la jornada de cobro para habilitar el Punto de Venta (POS). Solo puede haber 1 caja abierta en el sistema.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAbrirCaja}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="montoInicial">Monto Inicial en Efectivo (Bs.) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    Bs.
                  </span>
                  <Input
                    id="montoInicial"
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0.00"
                    className="pl-9 text-base"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  SRS-CAJ-002: Ingresa el saldo base en billetes y monedas con el que arranca el cajón.
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1 mb-3">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="size-3.5" />
                  <span>Registro Inmutable</span>
                </div>
                <p>
                  Al confirmar la apertura, el sistema vinculará tu usuario (<strong>{user?.nombre} {user?.apellido}</strong>) y la fecha/hora exacta del servidor como responsable de apertura.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto cursor-pointer ">
                {isSubmitting ? "Abriendo caja..." : "Confirmar Apertura de Caja"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        /* ESTADO 2: Caja Abierta -> Panel Activo + Formulario de Cierre a Ciegas */
        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-gradient-to-br from-card to-muted/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle>Sesión de Caja Activa</CardTitle>
                </div>
                <Badge variant="success">Abierta</Badge>
              </div>
              <CardDescription>
                Esta sesión se encuentra operativa para el registro de cobros en el Punto de Venta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Operador Responsable (Apertura)</p>
                    <p className="font-medium text-foreground">{cajaActiva.usuarioNombre}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background">
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hora de Apertura</p>
                    <p className="font-medium text-foreground">{formatDateTime(cajaActiva.fechaHoraApertura)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background">
                  <span className="size-4 text-xs font-bold text-muted-foreground shrink-0 flex items-center justify-center">
                    Bs
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Monto Inicial en Efectivo</p>
                    <p className="font-medium text-foreground">Bs. {cajaActiva.montoInicial.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Mensajes de permisos según rol */}
              {esAdmin && !esCreadorCaja && (
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-200">
                  <ShieldAlert className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Supervisión Administrativa:</span> Esta sesión fue abierta por{" "}
                    <strong>{cajaActiva.usuarioNombre}</strong>. Como Administrador, puedes efectuar el recuento físico y cerrar la caja en su nombre si el vendedor fue desactivado, finalizó su turno o se encuentra ausente.
                  </div>
                </div>
              )}

              {!puedeCerrar && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Cierre Restringido:</span> La caja fue abierta por{" "}
                    <strong>{cajaActiva.usuarioNombre}</strong>. Solo ese operador o un usuario con rol Administrador pueden ejecutar el cierre de la jornada.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulario de Cierre Ciego */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-foreground">
                <Lock className="size-5 text-amber-600 dark:text-amber-400" />
                <CardTitle>Cierre de Jornada y Arqueo Físico</CardTitle>
              </div>
              <CardDescription>
                SRS-CAJ-005: Formulario de arqueo a ciegas. Cuenta el dinero físico presente en el cajón e ingresa el total exacto.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCerrarCaja}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recuentoFisico">Recuento Físico en Efectivo (Bs. Conteo Ciego) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Bs.
                    </span>
                    <Input
                      id="recuentoFisico"
                      type="number"
                      step="0.01"
                      min="0"
                      value={recuentoFisico}
                      onChange={(e) => setRecuentoFisico(e.target.value)}
                      placeholder="0.00"
                      className="pl-9 text-base"
                      disabled={!puedeCerrar || isSubmitting}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <HelpCircle className="size-3.5" />
                    El sistema comparará automáticamente este valor contra las ventas y mermas registradas para emitir el diagnóstico.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!puedeCerrar || isSubmitting}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  {isSubmitting
                    ? "Procesando Arqueo..."
                    : esAdmin && !esCreadorCaja
                      ? "Cerrar Caja como Administrador"
                      : "Ejecutar Cierre de Caja"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
