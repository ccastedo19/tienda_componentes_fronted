import { useEffect, useMemo, useRef, useState } from "react"
import { Printer } from "lucide-react"

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
import { createTicketObjectUrl, printTicketHtml } from "@/lib/nota-venta-ticket"
import { buildProformaTicketHtml } from "@/lib/proforma-ticket"
import { getCotizacionById } from "@/services/cotizacion.service"
import { getCachedEmpresaConfig, getEmpresaConfig } from "@/services/empresa.service"
import { getProductos } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import type { Cotizacion } from "@/types/cotizacion"
import type { EmpresaConfig } from "@/types/empresa"

type ModalTicketProformaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cotizacion: Cotizacion | null
}

function enrichCotizacionDetalle(cotizacion: Cotizacion): Promise<Cotizacion> {
  const needsProductNames = (cotizacion.productos ?? []).some((p) => !p.productoNombre)
  const needsServiceNames = (cotizacion.servicios ?? []).some((s) => !s.servicioNombre)

  if (!needsProductNames && !needsServiceNames) {
    return Promise.resolve(cotizacion)
  }

  return Promise.all([
    needsProductNames ? getProductos().catch(() => []) : Promise.resolve([]),
    needsServiceNames ? getServicios().catch(() => []) : Promise.resolve([]),
  ]).then(([productos, servicios]) => {
    const productosById = new Map(productos.map((p) => [p.id, p]))
    const serviciosById = new Map(servicios.map((s) => [s.id, s]))

    return {
      ...cotizacion,
      productos: (cotizacion.productos ?? []).map((p) => {
        const catalog = productosById.get(p.productoId)
        return {
          ...p,
          productoNombre: p.productoNombre || catalog?.nombreComercial,
          sku: p.sku || catalog?.skuUnico,
          precioUnitario: p.precioUnitario ?? catalog?.precioVenta,
        }
      }),
      servicios: (cotizacion.servicios ?? []).map((s) => {
        const catalog = serviciosById.get(s.servicioId)
        return {
          ...s,
          servicioNombre: s.servicioNombre || catalog?.nombre,
        }
      }),
    }
  })
}

export function ModalTicketProforma({
  open,
  onOpenChange,
  cotizacion,
}: ModalTicketProformaProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [detalle, setDetalle] = useState<Cotizacion | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(getCachedEmpresaConfig())
  const [ticketUrl, setTicketUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !cotizacion) {
      setDetalle(null)
      setError(null)
      setTicketUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return null
      })
      return
    }

    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [cotizacionRaw, empresaData] = await Promise.all([
          getCotizacionById(cotizacion.id),
          getCachedEmpresaConfig()
            ? Promise.resolve(getCachedEmpresaConfig()!)
            : getEmpresaConfig(),
        ])
        const cotizacionData = await enrichCotizacionDetalle(cotizacionRaw)

        if (cancelled) return

        setDetalle(cotizacionData)
        setEmpresa(empresaData)

        const html = buildProformaTicketHtml(cotizacionData, empresaData)
        const url = createTicketObjectUrl(html)
        setTicketUrl((prev) => {
          if (prev) window.URL.revokeObjectURL(prev)
          return url
        })
      } catch {
        if (!cancelled) {
          setError("No se pudo generar el ticket de proforma.")
          setTicketUrl((prev) => {
            if (prev) window.URL.revokeObjectURL(prev)
            return null
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, cotizacion])

  useEffect(() => {
    return () => {
      if (ticketUrl) window.URL.revokeObjectURL(ticketUrl)
    }
  }, [ticketUrl])

  const ticketHtml = useMemo(() => {
    if (!detalle) return null
    return buildProformaTicketHtml(detalle, empresa)
  }, [detalle, empresa])

  const handlePrint = () => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      return
    }
    if (ticketHtml) {
      printTicketHtml(ticketHtml)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] w-[min(520px,95vw)] max-w-[520px] flex-col gap-0 overflow-hidden p-0"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <DialogTitle>
            Proforma {detalle?.codigoProforma ?? cotizacion?.codigoProforma ?? ""}
          </DialogTitle>
          <DialogDescription>
            Ticket para impresora de rollo (80 mm). Visualiza o imprime la proforma.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-full w-full max-w-[320px]" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              {error}
            </div>
          ) : ticketUrl ? (
            <iframe
              ref={iframeRef}
              src={ticketUrl}
              title="Ticket de proforma"
              className="mx-auto h-full min-h-[480px] w-full max-w-[320px] rounded-md border border-border bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No se pudo cargar el ticket.
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border bg-muted/50 p-3 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            disabled={!ticketHtml || isLoading}
            onClick={handlePrint}
            className="gap-1.5 cursor-pointer"
          >
            <Printer className="size-4" />
            Imprimir ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
