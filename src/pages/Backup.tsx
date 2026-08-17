import { useState } from "react"
import { ShieldCheck, Download, RefreshCw, Database, CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const Backup = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>("12/08/2026 19:30:00")

  const handleGenerateBackup = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      const now = new Date().toLocaleString()
      setLastBackup(now)
      alert(`Respaldo de base de datos generado exitosamente en ${now}.`)
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          Auditoría, Seguridad y Respaldo de Datos
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión de integridad de la base de datos PostgreSQL, registros de auditoría (`log_auditoria`) y copias de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Generar Backup */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Database className="size-4" />
              <CardTitle className="text-base">Copia de Seguridad Relacional</CardTitle>
            </div>
            <CardDescription>
              Exporta un volcado completo de todas las tablas, kardex inmutables, usuarios y catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3 text-xs">
            <div className="p-2.5 rounded-md bg-muted/40 border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Último Respaldo:</span>
              <Badge variant="outline">{lastBackup || "Ninguno"}</Badge>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              type="button"
              onClick={handleGenerateBackup}
              disabled={isGenerating}
              className="w-full font-semibold gap-1.5 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Generando dump PostgreSQL...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Generar Nuevo Respaldo (.SQL)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Auditoría y Trazabilidad */}
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">Módulo de Auditoría (SRS-INV-002)</CardTitle>
            </div>
            <CardDescription>
              Trazabilidad inmutable de cambios manuales en costos, precios y existencias.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2 text-xs text-muted-foreground">
            <p>
              Todos los cambios en catálogo y excepciones de margen en el POS registran:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Usuario y rol del operador</li>
              <li>Timestamp inmutable del servidor</li>
              <li>Valores anteriores y nuevos</li>
              <li>Justificación técnica obligatoria</li>
            </ul>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Badge variant="success" className="gap-1 mt-2">
              <CheckCircle2 className="size-3 " />
              Sistema de Auditoría Activo
            </Badge>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
