import { useEffect, useState } from "react"
import { Building2, Save, CheckCircle2, Phone, Mail, Globe, MapPin, Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getEmpresaConfig, saveEmpresaConfig } from "@/services/empresa.service"

export const Datos_empresa = () => {
  const [nombreEmpresa, setNombreEmpresa] = useState("")
  const [nit, setNit] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [direccion, setDireccion] = useState("")
  const [sitioWeb, setSitioWeb] = useState("")
  const [pieNotaVenta, setPieNotaVenta] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setErrorMessage(null)

    getEmpresaConfig()
      .then((config) => {
        if (!isMounted) return
        setNombreEmpresa(config.nombreEmpresa ?? "")
        setNit(config.nit ?? "")
        setTelefono(config.telefono ?? "")
        setEmail(config.email ?? "")
        setDireccion(config.direccion ?? "")
        setSitioWeb(config.sitioWeb ?? "")
        setPieNotaVenta(config.pieNotaVenta ?? "")
      })
      .catch((err) => {
        if (!isMounted) return
        setErrorMessage(err instanceof Error ? err.message : "Error al cargar los datos de la empresa")
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setIsSaved(false)

    try {
      await saveEmpresaConfig({
        nombreEmpresa: nombreEmpresa.trim(),
        nit: nit.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        direccion: direccion.trim(),
        sitioWeb: sitioWeb.trim(),
        pieNotaVenta: pieNotaVenta.trim(),
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 4000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "No se pudo guardar la configuración de la empresa en la base de datos")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          Datos y Configuración de la Empresa
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Información legal, membrete comercial y notas al pie para comprobantes POS y proformas comerciales persistidas en la base de datos.
        </p>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Configuración de la empresa guardada y sincronizada correctamente en la base de datos.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Identificación Fiscal y Comercial</CardTitle>
            <CardDescription>
              Estos datos se reflejan en las notas de venta interna, cotizaciones impresas y el encabezado del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>Cargando configuración desde el servidor...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Razón Social / Nombre Comercial *</Label>
                    <Input
                      id="nombre"
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      placeholder="Ej: Lotus Electrónica"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nit">NIT / Número de Identificación Tributaria *</Label>
                    <Input
                      id="nit"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      placeholder="Ej: 1029384756"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tel">Teléfono Central *</Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        id="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+591 2 2441122"
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mail">Correo Corporativo *</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        id="mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="web">Sitio Web</Label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        id="web"
                        value={sitioWeb}
                        onChange={(e) => setSitioWeb(e.target.value)}
                        placeholder="https://www.empresa.com"
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dir">Dirección Principal *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="dir"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Av. 6 de Agosto #2450"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pie">Leyenda o Nota al Pie en Comprobantes</Label>
                  <Textarea
                    id="pie"
                    value={pieNotaVenta}
                    onChange={(e) => setPieNotaVenta(e.target.value)}
                    placeholder="Texto de agradecimiento, políticas de cambio o garantías..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-3 flex items-center">
            <Button type="submit" disabled={isLoading || isSaving} className="font-semibold gap-1.5 cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando en BD...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
