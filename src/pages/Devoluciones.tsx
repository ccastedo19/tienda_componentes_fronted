import { Undo2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Devoluciones = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <Undo2 className="size-6" />
          Devoluciones y Garantías
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Gestión de garantías de fábrica, cambios de productos averiados y retornos de mercadería.
        </p>
      </div>

      <Alert variant="info">
        <AlertCircle className="size-4" />
        <AlertTitle>Procesamiento de Garantías y Mermas</AlertTitle>
        <AlertDescription className="text-xs">
          Para artículos que ingresen por avería técnica irreversible o daño de fábrica, utiliza el módulo de{" "}
          <strong>Declaración de Merma (Kardex e Inventario)</strong> para descontar las existencias correspondientes y mantener la conciliación contable intacta.
        </AlertDescription>
      </Alert>

      <Card className="border-border shadow-xs">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Registro de Devoluciones</CardTitle>
          <CardDescription>
            Trazabilidad de retornos de componentes vinculados a la Nota de Venta interna original.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-xs text-muted-foreground text-center py-10">
          No hay devoluciones activas en proceso.
        </CardContent>
      </Card>
    </div>
  )
}
