import { useRef } from "react"
import { Download, Printer } from "lucide-react"

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

type ModalPdfViewerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  pdfUrl: string | null
  isLoading?: boolean
  onDownload?: () => void
  iframeTitle?: string
}

export function ModalPdfViewer({
  open,
  onOpenChange,
  title,
  description = "Visualiza, descarga o imprime el documento.",
  pdfUrl,
  isLoading = false,
  onDownload,
  iframeTitle = "Documento PDF",
}: ModalPdfViewerProps) {
  const pdfIframeRef = useRef<HTMLIFrameElement>(null)

  const handlePrint = () => {
    const iframe = pdfIframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      return
    }

    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, "_blank")
      printWindow?.addEventListener("load", () => {
        printWindow.print()
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-muted/20 p-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : pdfUrl ? (
            <iframe
              ref={pdfIframeRef}
              src={pdfUrl}
              title={iframeTitle}
              className="h-full w-full rounded-md border border-border bg-background"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No se pudo cargar el PDF.
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border bg-muted/50 p-3 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {onDownload ? (
              <Button
                type="button"
                variant="outline"
                disabled={!pdfUrl || isLoading}
                onClick={onDownload}
                className="gap-1.5"
              >
                <Download className="size-4" />
                Descargar PDF
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={!pdfUrl || isLoading}
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="size-4" />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
