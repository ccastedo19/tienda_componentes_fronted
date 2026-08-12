import { useState } from "react"
import { Building2, Save, CheckCircle2, Phone, Mail, Globe, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const Datos_empresa = () => {
  const [nombreEmpresa, setNombreEmpresa] = useState("Lotus Electrónica")
  const [nit, setNit] = useState("1029384756")
  const [telefono, setTelefono] = useState("+591 2 2441122")
  const [email, setEmail] = useState("contacto@lotuselectronica.com")
  const [direccion, setDireccion] = useState("Av. 6 de Agosto #2450, Edif. Torre Empresarial, Piso 3")
  const [sitioWeb, setSitioWeb] = useState("https://www.lotuselectronica.com")
  const [pieNotaVenta, setPieNotaVenta] = useState(
    "Comprobante interno emitido por el sistema POS. Conserve este documento."
  )
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <Building2 className="size-6" />
          Datos y Configuración de la Empresa
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Información legal, membrete comercial y notas al pie para comprobantes y proformas.
        </p>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Datos de empresa guardados correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Identificación Fiscal y Comercial</CardTitle>
            <CardDescription>
              Estos datos se reflejan en las notas de venta interna y cotizaciones impresas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Razón Social / Nombre Comercial *</Label>
                <Input
                  id="nombre"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nit">NIT / Número de Identificación Tributaria *</Label>
                <Input
                  id="nit"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
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
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button type="submit" className="font-semibold gap-1.5">
              <Save className="size-4" />
              Guardar Configuración
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
