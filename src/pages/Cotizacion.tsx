import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  FileText,
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
  Wrench,
  X,
} from "lucide-react"

import { ModalCliente } from "@/components/Modal/ModalCliente"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SmartCombobox, type SmartComboboxOption } from "@/components/ui/smart-combobox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiRequestError } from "@/lib/api/client"
import { getClientes } from "@/services/cliente.service"
import {
  createCotizacion,
  descargarCotizacionPdf,
  getCotizacionPdfObjectUrl,
} from "@/services/cotizacion.service"
import { getProductos } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import type { Cliente } from "@/types/cliente"
import type { Producto } from "@/types/producto"
import type { Servicio } from "@/types/servicio"

const VALIDEZ_PRESETS = [15, 30, 60, 90] as const
const CLIENTE_GENERICO_VALUE = "__cliente_generico__"

type CartProductItem = {
  type: "producto"
  producto: Producto
  cantidad: number
  valorDescuento: number
}

type CartServiceItem = {
  type: "servicio"
  servicio: Servicio
  precioFinalAplicado: number
  valorDescuento: number
}

type CartItem = CartProductItem | CartServiceItem

export const Cotizacion = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [catalogoTab, setCatalogoTab] = useState<"productos" | "servicios">("productos")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [clienteOptionId, setClienteOptionId] = useState<string | null>(CLIENTE_GENERICO_VALUE)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  const [diasValidez, setDiasValidez] = useState(15)
  const [isCustomValidez, setIsCustomValidez] = useState(false)
  const [customValidez, setCustomValidez] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proformaCreada, setProformaCreada] = useState<{
    id: string
    codigo: string
  } | null>(null)

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const pdfIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [prods, servs, clientesData] = await Promise.all([
          getProductos().catch(() => []),
          getServicios().catch(() => []),
          getClientes().catch(() => []),
        ])
        setProductos(prods)
        setServicios(servs)
        setClientes(clientesData.filter((c) => (c.estado ?? "Activo") !== "Eliminado"))
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const clienteOptions = useMemo<SmartComboboxOption[]>(() => {
    const options: SmartComboboxOption[] = [
      {
        value: CLIENTE_GENERICO_VALUE,
        label: "Cliente Genérico",
        description: "Cotización sin cliente registrado",
        keywords: "generico mostrador sin cliente",
      },
    ]

    for (const cliente of clientes) {
      const fullName = `${cliente.nombre} ${cliente.apellido}`.trim()
      options.push({
        value: cliente.id,
        label: fullName,
        description: cliente.ci ? `CI/NIT: ${cliente.ci}` : "Sin CI/NIT",
        keywords: `${cliente.ci || ""} ${cliente.nombre} ${cliente.apellido} ${fullName}`,
      })
    }

    return options
  }, [clientes])

  const handleSelectCliente = (value: string | null) => {
    if (value === null) {
      setClienteOptionId(null)
      setClienteSeleccionado(null)
      return
    }

    if (value === CLIENTE_GENERICO_VALUE) {
      setClienteOptionId(CLIENTE_GENERICO_VALUE)
      setClienteSeleccionado(null)
      return
    }

    const cliente = clientes.find((c) => c.id === value) ?? null
    setClienteOptionId(value)
    setClienteSeleccionado(cliente)
  }

  const handleSelectValidezPreset = (dias: number) => {
    setIsCustomValidez(false)
    setCustomValidez("")
    setDiasValidez(dias)
  }

  const handleSelectCustomValidez = () => {
    setIsCustomValidez(true)
    setCustomValidez(String(diasValidez))
  }

  const diasValidezFinal = useMemo(() => {
    if (isCustomValidez) {
      const parsed = parseInt(customValidez, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }
    return diasValidez
  }, [customValidez, diasValidez, isCustomValidez])

  const handleAddProducto = (producto: Producto) => {
    const existingIndex = cart.findIndex(
      (item) => item.type === "producto" && item.producto.id === producto.id
    )

    if (existingIndex >= 0) {
      const item = cart[existingIndex] as CartProductItem
      const updated = [...cart]
      updated[existingIndex] = { ...item, cantidad: item.cantidad + 1 }
      setCart(updated)
      return
    }

    setCart([
      ...cart,
      {
        type: "producto",
        producto,
        cantidad: 1,
        valorDescuento: 0,
      },
    ])
  }

  const handleAddServicio = (servicio: Servicio) => {
    setCart([
      ...cart,
      {
        type: "servicio",
        servicio,
        precioFinalAplicado: servicio.precioBaseSugerido,
        valorDescuento: 0,
      },
    ])
  }

  const handleUpdateCantidad = (index: number, delta: number) => {
    const item = cart[index]
    if (item.type !== "producto") return

    const newCant = item.cantidad + delta
    if (newCant <= 0) {
      setCart(cart.filter((_, i) => i !== index))
      return
    }

    const updated = [...cart]
    updated[index] = { ...item, cantidad: newCant }
    setCart(updated)
  }

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handleUpdatePrecioServicio = (index: number, precio: number) => {
    const item = cart[index]
    if (item.type !== "servicio") return
    const updated = [...cart]
    updated[index] = { ...item, precioFinalAplicado: Math.max(0, precio) }
    setCart(updated)
  }

  const handleUpdateDescuento = (index: number, valor: number) => {
    const item = cart[index]
    const updated = [...cart]
    updated[index] = { ...item, valorDescuento: Math.max(0, valor) }
    setCart(updated)
  }

  const getItemSubtotal = (item: CartItem) => {
    if (item.type === "producto") {
      const bruto = item.producto.precioVenta * item.cantidad
      return Math.max(0, bruto - (item.valorDescuento || 0))
    }
    return Math.max(0, item.precioFinalAplicado - (item.valorDescuento || 0))
  }

  const totalEstimado = useMemo(
    () => cart.reduce((acc, item) => acc + getItemSubtotal(item), 0),
    [cart]
  )

  const filteredProductos = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return productos.filter(
      (p) =>
        p.nombreComercial.toLowerCase().includes(term) ||
        p.skuUnico.toLowerCase().includes(term) ||
        (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(term))
    )
  }, [productos, searchTerm])

  const filteredServicios = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return servicios.filter((s) => s.nombre.toLowerCase().includes(term))
  }, [servicios, searchTerm])

  const openProformaPdfModal = async (id: string) => {
    setIsPdfModalOpen(true)
    setIsLoadingPdf(true)
    setError(null)

    try {
      const url = await getCotizacionPdfObjectUrl(id)
      setPdfUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return url
      })
    } catch {
      setError("No se pudo cargar el PDF de la cotización.")
      setIsPdfModalOpen(false)
    } finally {
      setIsLoadingPdf(false)
    }
  }

  const handlePrintPdf = () => {
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

  const handleEmitirCotizacion = async () => {
    if (cart.length === 0) {
      setError("Debes incluir al menos un producto o servicio en la proforma.")
      return
    }
    if (diasValidezFinal <= 0) {
      setError("Los días de validez deben ser un número mayor a 0.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const nueva = await createCotizacion({
        clienteId: clienteSeleccionado?.id || null,
        diasValidez: diasValidezFinal,
        productos: cart
          .filter((i): i is CartProductItem => i.type === "producto")
          .map((i) => ({
            productoId: i.producto.id,
            cantidad: i.cantidad,
            tipoDescuento: i.valorDescuento > 0 ? "Fijo" : null,
            valorDescuento: i.valorDescuento,
          })),
        servicios: cart
          .filter((i): i is CartServiceItem => i.type === "servicio")
          .map((i) => ({
            servicioId: i.servicio.id,
            precioFinalAplicado: i.precioFinalAplicado,
            tipoDescuento: i.valorDescuento > 0 ? "Fijo" : null,
            valorDescuento: i.valorDescuento,
          })),
      })

      setProformaCreada({ id: nueva.id, codigo: nueva.codigoProforma })
      setCart([])
      setClienteSeleccionado(null)
      setClienteOptionId(CLIENTE_GENERICO_VALUE)
      setDiasValidez(15)
      setIsCustomValidez(false)
      setCustomValidez("")

      await openProformaPdfModal(nueva.id)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al emitir la cotización."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <FileText className="size-6" />
          Cotización (Proforma)
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Genera cotizaciones formales vinculadas al cliente sin comprometer el stock físico.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Atención en la Cotización</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {proformaCreada && (
        <Alert className="relative border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setProformaCreada(null)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar aviso de cotización exitosa"
          >
            <X className="size-3.5" />
          </Button>
          <AlertTitle className="pr-8 font-semibold text-foreground">
            ¡Proforma {proformaCreada.codigo} generada exitosamente!
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>La cotización quedó registrada y lista para compartir.</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void openProformaPdfModal(proformaCreada.id)}
              className="gap-1 bg-background text-foreground"
            >
              <Eye className="size-3.5" />
              Ver proforma
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={catalogoTab}
              onValueChange={(val) => setCatalogoTab(val as "productos" | "servicios")}
            >
              <TabsList>
                <TabsTrigger value="productos">Productos</TabsTrigger>
                <TabsTrigger value="servicios">Servicios</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {catalogoTab === "productos" ? (
            <div className="grid max-h-[600px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProductos.map((prod) => (
                <Card
                  key={prod.id}
                  size="sm"
                  onClick={() => handleAddProducto(prod)}
                  className="cursor-pointer gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none ring-0 select-none transition-colors hover:border-foreground/25 hover:bg-muted/30 active:scale-[0.99]"
                >
                  <CardHeader className="gap-1.5 p-2 pb-1.5">
                    <div className="flex h-16 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/50">
                      {prod.imagenUrl ? (
                        <img
                          src={prod.imagenUrl}
                          alt={prod.nombreComercial}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Cpu className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="h-4 w-fit px-1 font-mono text-[9px] leading-none"
                    >
                      {prod.skuUnico}
                    </Badge>
                    <CardTitle className="line-clamp-2 text-[11px] leading-tight font-semibold">
                      {prod.nombreComercial}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="flex items-center justify-between gap-1 border-t border-border/70 pt-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Bs. {prod.precioVenta.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {prod.stockDisponible} disp.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid max-h-[600px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
              {filteredServicios.map((serv) => (
                <Card
                  key={serv.id}
                  size="sm"
                  onClick={() => handleAddServicio(serv)}
                  className="cursor-pointer gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none ring-0 transition-colors hover:border-foreground/25 hover:bg-muted/30 active:scale-[0.99]"
                >
                  <CardHeader className="gap-1.5 p-2 pb-1.5">
                    <div className="flex h-16 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/50">
                      {serv.imagenUrl ? (
                        <img
                          src={serv.imagenUrl}
                          alt={serv.nombre}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Wrench className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="h-4 w-fit px-1 text-[9px] leading-none"
                    >
                      Servicio
                    </Badge>
                    <CardTitle className="line-clamp-2 text-[11px] leading-tight font-semibold">
                      {serv.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="flex items-center justify-between gap-1 border-t border-border/70 pt-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Bs. {serv.precioBaseSugerido.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Mano de obra</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 lg:col-span-5">
          <Card className="border-border shadow-xs pb-1">
            <CardHeader className="pr-2 pl-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <User className="size-4" />
                  Cliente
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setIsClientModalOpen(true)}
                  className="cursor-pointer gap-1.5"
                >
                  <UserPlus className="size-3.5" />
                  Nuevo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3.5 pt-0">
              <div className="space-y-2">
                <SmartCombobox
                  options={clienteOptions}
                  value={clienteOptionId}
                  onValueChange={handleSelectCliente}
                  placeholder="Buscar cliente..."
                  emptyMessage="No se encontraron clientes."
                  className="w-full text-xs"
                  clearOnFocus
                  clearOnFocusWhen={CLIENTE_GENERICO_VALUE}
                  onOpenChange={(open) => {
                    if (!open) {
                      setClienteOptionId((current) => current ?? CLIENTE_GENERICO_VALUE)
                    }
                  }}
                />
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Titular: </span>
                    <strong className="text-foreground">
                      {clienteSeleccionado
                        ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
                        : "Cliente Genérico"}
                    </strong>
                  </div>
                  {clienteSeleccionado && clienteSeleccionado.ci ? (
                    <Badge variant="outline" className="text-[10px]">
                      NIT: {clienteSeleccionado.ci}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1 border-t border-border pt-2.5">
                <Label className="text-xs font-medium">Días de validez *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {VALIDEZ_PRESETS.map((dias) => {
                    const isActive = !isCustomValidez && diasValidez === dias
                    return (
                      <Button
                        key={dias}
                        type="button"
                        size="xs"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => handleSelectValidezPreset(dias)}
                        className="min-w-12"
                      >
                        {dias}
                      </Button>
                    )
                  })}
                  <Button
                    type="button"
                    size="xs"
                    variant={isCustomValidez ? "default" : "outline"}
                    onClick={handleSelectCustomValidez}
                  >
                    Personalizado
                  </Button>
                </div>

                {isCustomValidez ? (
                  <Input
                    id="dias-validez-custom"
                    type="number"
                    min="1"
                    placeholder="Días"
                    value={customValidez}
                    onChange={(e) => setCustomValidez(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="border-b border-border p-3.5 pt-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="size-4" />
                  Carrito ({cart.length} ítems)
                </CardTitle>
                {cart.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setCart([])}
                    className="cursor-pointer text-xs text-destructive hover:bg-destructive/10"
                  >
                    Vaciar
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="max-h-[320px] space-y-3 overflow-y-auto p-3.5">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  El carrito está vacío. Selecciona artículos del catálogo para agregar.
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border border-border bg-card p-2.5 text-xs shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {item.type === "producto"
                            ? item.producto.nombreComercial
                            : item.servicio.nombre}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {item.type === "producto"
                            ? `Código: ${item.producto.skuUnico}`
                            : "Servicio Técnico"}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveItem(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-1">
                      {item.type === "producto" ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleUpdateCantidad(index, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="px-1 font-semibold text-foreground">
                            {item.cantidad}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => handleUpdateCantidad(index, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground">Precio: Bs.</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioFinalAplicado || ""}
                            onChange={(e) =>
                              handleUpdatePrecioServicio(
                                index,
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0"
                            className="h-6 w-20 px-1.5 text-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="Desc"
                          min="0"
                          step="0.01"
                          value={item.valorDescuento || ""}
                          onChange={(e) =>
                            handleUpdateDescuento(
                              index,
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-6 w-16 px-1 text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground">Bs.</span>
                      </div>

                      <div className="text-sm font-bold text-foreground">
                        Bs. {getItemSubtotal(item).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            <CardFooter className="flex-col gap-3 border-t border-border bg-muted/20 p-3.5">
              <div className="flex w-full items-center justify-between text-base font-bold text-foreground">
                <span>TOTAL ESTIMADO:</span>
                <span>Bs. {totalEstimado.toFixed(2)}</span>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => void handleEmitirCotizacion()}
                disabled={
                  cart.length === 0 ||
                  isSubmitting ||
                  diasValidezFinal <= 0
                }
                className="w-full cursor-pointer text-sm font-semibold"
              >
                {isSubmitting ? "Emitiendo..." : "Emitir Cotización"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog
        open={isPdfModalOpen}
        onOpenChange={(open) => {
          setIsPdfModalOpen(open)
          if (!open) {
            setPdfUrl((prev) => {
              if (prev) window.URL.revokeObjectURL(prev)
              return null
            })
          }
        }}
      >
        <DialogContent
          className="flex h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[90vw]"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
            <DialogTitle>
              Proforma {proformaCreada?.codigo ?? ""}
            </DialogTitle>
            <DialogDescription>
              Visualiza, descarga o imprime la cotización.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 bg-muted/20 p-3">
            {isLoadingPdf ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : pdfUrl ? (
              <iframe
                ref={pdfIframeRef}
                src={pdfUrl}
                title="Proforma PDF"
                className="h-full w-full rounded-md border border-border bg-background"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No se pudo cargar el PDF.
              </div>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border bg-muted/50 p-3 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setIsPdfModalOpen(false)}>
              Cerrar
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={!proformaCreada || isLoadingPdf}
                onClick={() => {
                  if (!proformaCreada) return
                  void descargarCotizacionPdf(proformaCreada.id, proformaCreada.codigo)
                }}
                className="gap-1.5"
              >
                <Download className="size-4" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                disabled={!pdfUrl || isLoadingPdf}
                onClick={handlePrintPdf}
                className="gap-1.5"
              >
                <Printer className="size-4" />
                Imprimir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalCliente
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        mode="create"
        onSuccess={(nuevo) => {
          setClientes((prev) => [nuevo, ...prev])
          setClienteSeleccionado(nuevo)
          setClienteOptionId(nuevo.id)
        }}
      />
    </div>
  )
}
