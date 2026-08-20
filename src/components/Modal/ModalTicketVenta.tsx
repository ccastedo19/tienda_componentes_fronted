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
import {
  buildNotaVentaTicketHtml,
  createTicketObjectUrl,
  printTicketHtml,
} from "@/lib/nota-venta-ticket"
import { getCachedEmpresaConfig, getEmpresaConfig } from "@/services/empresa.service"
import { getVentaById } from "@/services/venta.service"
import type { EmpresaConfig } from "@/types/empresa"
import type { Venta } from "@/types/venta"

type ModalTicketVentaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Venta parcial o completa; si falta detalle se consulta por id. */
  venta: Venta | null
}

export function ModalTicketVenta({ open, onOpenChange, venta }: ModalTicketVentaProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(getCachedEmpresaConfig())
  const [ticketUrl, setTicketUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !venta) {
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
        const [ventaData, empresaData] = await Promise.all([
          getVentaById(venta.id),
          getCachedEmpresaConfig()
            ? Promise.resolve(getCachedEmpresaConfig()!)
            : getEmpresaConfig(),
        ])

        if (cancelled) return

        setDetalle(ventaData)
        setEmpresa(empresaData)

        const html = buildNotaVentaTicketHtml(ventaData, empresaData)
        const url = createTicketObjectUrl(html)
        setTicketUrl((prev) => {
          if (prev) window.URL.revokeObjectURL(prev)
          return url
        })
      } catch {
        if (!cancelled) {
          setError("No se pudo generar el ticket de venta.")
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
  }, [open, venta])

  useEffect(() => {
    return () => {
      if (ticketUrl) window.URL.revokeObjectURL(ticketUrl)
    }
  }, [ticketUrl])

  const ticketHtml = useMemo(() => {
    if (!detalle) return null
    return buildNotaVentaTicketHtml(detalle, empresa)
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
            Nota de venta {detalle?.codigoNotaVenta ?? venta?.codigoNotaVenta ?? ""}
          </DialogTitle>
          <DialogDescription>
            Ticket para impresora de rollo (80 mm). Visualiza o imprime el comprobante.
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
              title="Ticket de venta"
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
