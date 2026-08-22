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
import { buildOrdenTecnicaTicketHtml } from "@/lib/orden-tecnica-ticket"
import { getCachedEmpresaConfig, getEmpresaConfig } from "@/services/empresa.service"
import { getOrdenTecnicaById } from "@/services/ordenTecnica.service"
import type { EmpresaConfig } from "@/types/empresa"
import type { OrdenTecnica } from "@/types/ordenTecnica"

type ModalTicketOrdenTecnicaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenTecnica | null
}

export function ModalTicketOrdenTecnica({
  open,
  onOpenChange,
  orden,
}: ModalTicketOrdenTecnicaProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [detalle, setDetalle] = useState<OrdenTecnica | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(getCachedEmpresaConfig())
  const [ticketUrl, setTicketUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !orden) {
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
        const [ordenData, empresaData] = await Promise.all([
          getOrdenTecnicaById(orden.id),
          getCachedEmpresaConfig()
            ? Promise.resolve(getCachedEmpresaConfig()!)
            : getEmpresaConfig(),
        ])

        if (cancelled) return

        setDetalle(ordenData)
        setEmpresa(empresaData)

        const html = buildOrdenTecnicaTicketHtml(ordenData, empresaData)
        const url = createTicketObjectUrl(html)
        setTicketUrl((prev) => {
          if (prev) window.URL.revokeObjectURL(prev)
          return url
        })
      } catch {
        if (!cancelled) {
          // Fallback a los datos recibidos en prop si falla la consulta individual
          setDetalle(orden)
          const empresaData = getCachedEmpresaConfig()
          setEmpresa(empresaData)
          if (orden) {
            const html = buildOrdenTecnicaTicketHtml(orden, empresaData)
            const url = createTicketObjectUrl(html)
            setTicketUrl((prev) => {
              if (prev) window.URL.revokeObjectURL(prev)
              return url
            })
          } else {
            setError("No se pudo generar el ticket de la orden técnica.")
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, orden])

  useEffect(() => {
    return () => {
      if (ticketUrl) window.URL.revokeObjectURL(ticketUrl)
    }
  }, [ticketUrl])

  const ticketHtml = useMemo(() => {
    if (!detalle) return null
    return buildOrdenTecnicaTicketHtml(detalle, empresa)
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
            Comprobante de Orden Técnico {detalle?.codigoOrden ?? orden?.codigoOrden ?? ""}
          </DialogTitle>
          <DialogDescription>
            Ticket de recepción de taller técnico para impresora de rollo.
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
              title="Ticket de Orden Técnica"
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
