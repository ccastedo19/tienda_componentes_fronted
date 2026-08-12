import { useState, useEffect, useMemo } from "react"
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  FileText,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Download,
  Cpu,
  Wrench,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { Link } from "react-router-dom"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { getCajaActiva } from "@/services/caja.service"
import { findClienteByCi } from "@/services/cliente.service"
import { buscarCotizacionesPorCi, createCotizacion, descargarCotizacionPdf } from "@/services/cotizacion.service"
import { getProductos, getSeriesByProducto } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import { descargarNotaVentaPdf, procesarCheckout } from "@/services/venta.service"
import type { Caja } from "@/types/caja"
import type { Cliente } from "@/types/cliente"
import type { Cotizacion } from "@/types/cotizacion"
import type { Producto, ProductoSerie } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { CheckoutRequest, ItemProductoRequest, ItemServicioRequest, Venta as VentaModel } from "@/types/venta"

type CartProductItem = {
  type: "producto"
  producto: Producto
  cantidad: number
  tipoDescuento: "Porcentaje" | "Fijo" | null
  valorDescuento: number
  selectedSerieId: string | null
  seriesDisponibles: ProductoSerie[]
}

type CartServiceItem = {
  type: "servicio"
  servicio: Servicio
  precioFinalAplicado: number
  tipoDescuento: "Porcentaje" | "Fijo" | null
  valorDescuento: number
}

type CartItem = CartProductItem | CartServiceItem

export const Venta = () => {
  // Estado de caja
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null)
  const [isCheckingCaja, setIsCheckingCaja] = useState(true)

  // Catálogos
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [catalogoTab, setCatalogoTab] = useState<"productos" | "servicios">("productos")
  const [searchTerm, setSearchTerm] = useState("")

  // Carrito de compras
  const [cart, setCart] = useState<CartItem[]>([])

  // Cliente
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [ciSearch, setCiSearch] = useState("")
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  // Cotizaciones / Proformas loader
  const [isProformaModalOpen, setIsProformaModalOpen] = useState(false)
  const [proformasEncontradas, setProformasEncontradas] = useState<Cotizacion[]>([])
  const [proformaCiSearch, setProformaCiSearch] = useState("")
  const [isSearchingProformas, setIsSearchingProformas] = useState(false)
  const [loadedCotizacionId, setLoadedCotizacionId] = useState<string | null>(null)

  // Modal de Checkout / Pago
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "QR" | "Pago Mixto">("Efectivo")
  const [montoRecibidoEfectivo, setMontoRecibidoEfectivo] = useState("")
  const [montoQr, setMontoQr] = useState("")

  // Bypass de Margen Mínimo (SRS-POS-006, 007, 008)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [justificacionBypass, setJustificacionBypass] = useState("")

  // Estado de procesamiento y éxito
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ventaCompletada, setVentaCompletada] = useState<VentaModel | null>(null)

  // Cargar sesión de caja y catálogo inicial
  useEffect(() => {
    const initData = async () => {
      setIsCheckingCaja(true)
      try {
        const [caja, prods, servs] = await Promise.all([
          getCajaActiva().catch(() => null),
          getProductos().catch(() => []),
          getServicios().catch(() => []),
        ])
        setCajaActiva(caja)
        setProductos(prods)
        setServicios(servs)
      } catch {
        // Error handling
      } finally {
        setIsCheckingCaja(false)
      }
    }
    void initData()
  }, [])

  // Búsqueda de cliente por CI
  const handleBuscarCliente = async (ci: string) => {
    if (!ci.trim()) {
      setClienteSeleccionado(null)
      return
    }
    try {
      const c = await findClienteByCi(ci.trim())
      setClienteSeleccionado(c)
    } catch {
      setClienteSeleccionado(null)
    }
  }

  // Búsqueda de proformas pendientes
  const handleBuscarProformas = async () => {
    if (!proformaCiSearch.trim()) return
    setIsSearchingProformas(true)
    try {
      const data = await buscarCotizacionesPorCi(proformaCiSearch.trim())
      setProformasEncontradas(data)
    } catch {
      setProformasEncontradas([])
    } finally {
      setIsSearchingProformas(false)
    }
  }

  // Cargar proforma en el carrito
  const handleCargarProformaEnCarrito = (cot: Cotizacion) => {
    const newCart: CartItem[] = []

    if (cot.productos) {
      for (const p of cot.productos) {
        const prod = productos.find((item) => item.id === p.productoId)
        if (prod) {
          newCart.push({
            type: "producto",
            producto: prod,
            cantidad: p.cantidad,
            tipoDescuento: null,
            valorDescuento: 0,
            selectedSerieId: null,
            seriesDisponibles: [],
          })
        }
      }
    }

    if (cot.servicios) {
      for (const s of cot.servicios) {
        const serv = servicios.find((item) => item.id === s.servicioId)
        if (serv) {
          newCart.push({
            type: "servicio",
            servicio: serv,
            precioFinalAplicado: s.precioFinalAplicado,
            tipoDescuento: null,
            valorDescuento: 0,
          })
        }
      }
    }

    setCart(newCart)
    setLoadedCotizacionId(cot.id)
    if (cot.clienteCi) {
      void handleBuscarCliente(cot.clienteCi)
      setCiSearch(cot.clienteCi)
    }
    setIsProformaModalOpen(false)
  }

  // Agregar Producto al carrito
  const handleAddProducto = async (producto: Producto) => {
    if (producto.stockDisponible <= 0) {
      setError(`Stock insuficiente para el artículo: ${producto.nombreComercial}`)
      return
    }

    const existingIndex = cart.findIndex(
      (item) => item.type === "producto" && item.producto.id === producto.id
    )

    if (existingIndex >= 0) {
      const item = cart[existingIndex] as CartProductItem
      if (item.cantidad + 1 > producto.stockDisponible) {
        setError(`SRS-POS-005: La cantidad solicitada supera el stock disponible (${producto.stockDisponible})`)
        return
      }
      const updated = [...cart]
      updated[existingIndex] = { ...item, cantidad: item.cantidad + 1 }
      setCart(updated)
    } else {
      let series: ProductoSerie[] = []
      try {
        series = await getSeriesByProducto(producto.id)
      } catch {
        series = []
      }

      setCart([
        ...cart,
        {
          type: "producto",
          producto,
          cantidad: 1,
          tipoDescuento: null,
          valorDescuento: 0,
          selectedSerieId: series.length > 0 ? series[0].id : null,
          seriesDisponibles: series,
        },
      ])
    }
  }

  // Agregar Servicio al carrito
  const handleAddServicio = (servicio: Servicio) => {
    setCart([
      ...cart,
      {
        type: "servicio",
        servicio,
        precioFinalAplicado: servicio.precioBaseSugerido,
        tipoDescuento: null,
        valorDescuento: 0,
      },
    ])
  }

  // Actualizar cantidad de producto
  const handleUpdateCantidad = (index: number, delta: number) => {
    const item = cart[index]
    if (item.type !== "producto") return

    const newCant = item.cantidad + delta
    if (newCant <= 0) {
      handleRemoveItem(index)
      return
    }

    if (newCant > item.producto.stockDisponible) {
      setError(`SRS-POS-005: La cantidad solicitada supera el stock disponible (${item.producto.stockDisponible})`)
      return
    }

    const updated = [...cart]
    updated[index] = { ...item, cantidad: newCant }
    setCart(updated)
  }

  // Eliminar item
  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  // Modificar precio de servicio en línea (SRS-POS-009)
  const handleUpdatePrecioServicio = (index: number, precio: number) => {
    const item = cart[index]
    if (item.type !== "servicio") return
    const updated = [...cart]
    updated[index] = { ...item, precioFinalAplicado: Math.max(0, precio) }
    setCart(updated)
  }

  // Modificar descuento de item (SRS-POS-010)
  const handleUpdateDescuento = (
    index: number,
    tipo: "Porcentaje" | "Fijo" | null,
    valor: number
  ) => {
    const item = cart[index]
    const updated = [...cart]
    updated[index] = { ...item, tipoDescuento: tipo, valorDescuento: valor }
    setCart(updated)
  }

  // Asignar serie a producto
  const handleSelectSerie = (index: number, serieId: string) => {
    const item = cart[index]
    if (item.type !== "producto") return
    const updated = [...cart]
    updated[index] = { ...item, selectedSerieId: serieId }
    setCart(updated)
  }

  // Cálculos reactivos de subtotales y margen
  const { totalGeneral, requiereBypassMargen } = useMemo(() => {
    let total = 0
    let requiereBypass = false

    for (const item of cart) {
      if (item.type === "producto") {
        let subtotal = item.producto.precioVenta * item.cantidad
        if (item.tipoDescuento === "Porcentaje" && item.valorDescuento > 0) {
          subtotal -= subtotal * (item.valorDescuento / 100)
        } else if (item.tipoDescuento === "Fijo" && item.valorDescuento > 0) {
          subtotal -= item.valorDescuento
        }
        total += Math.max(0, subtotal)

        const precioNetoUnitario = subtotal / item.cantidad
        if (precioNetoUnitario < item.producto.precioCosto) {
          requiereBypass = true
        }
      } else {
        total += Math.max(0, item.precioFinalAplicado)
      }
    }

    return {
      totalGeneral: total,
      requiereBypassMargen: requiereBypass,
    }
  }, [cart])

  // Guardar como Cotización (SRS-POS-013, SRS-POS-014)
  const handleGuardarCotizacion = async () => {
    if (!clienteSeleccionado) {
      setError("SRS-POS-013: Es obligatorio asociar a un cliente registrado con Cédula de Identidad (CI) para emitir una cotización.")
      return
    }
    if (cart.length === 0) {
      setError("El carrito está vacío.")
      return
    }

    setIsProcessing(true)
    setError(null)

    const prodsReq: ItemProductoRequest[] = cart
      .filter((i): i is CartProductItem => i.type === "producto")
      .map((i) => ({
        productoId: i.producto.id,
        cantidad: i.cantidad,
      }))

    const servsReq: ItemServicioRequest[] = cart
      .filter((i): i is CartServiceItem => i.type === "servicio")
      .map((i) => ({
        servicioId: i.servicio.id,
        precioFinalAplicado: i.precioFinalAplicado,
      }))

    try {
      const cot = await createCotizacion({
        clienteId: clienteSeleccionado.id,
        diasValidez: 15,
        productos: prodsReq,
        servicios: servsReq,
      })
      await descargarCotizacionPdf(cot.id, cot.codigoProforma)
      setCart([])
      setClienteSeleccionado(null)
      setCiSearch("")
      alert(`Cotización ${cot.codigoProforma} guardada con éxito y PDF descargado.`)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al guardar cotización."
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  // Ejecutar Checkout
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    let recEfectivo: number | undefined
    let recQr: number | undefined

    if (metodoPago === "Efectivo") {
      recEfectivo = parseFloat(montoRecibidoEfectivo)
      if (isNaN(recEfectivo) || recEfectivo < totalGeneral) {
        setError(`SRS-POS-004: El monto recibido en efectivo ($${recEfectivo || 0}) debe ser mayor o igual al total ($${totalGeneral.toFixed(2)}).`)
        return
      }
    } else if (metodoPago === "QR") {
      recQr = totalGeneral
    } else {
      recEfectivo = parseFloat(montoRecibidoEfectivo) || 0
      recQr = parseFloat(montoQr) || 0
      if (recEfectivo + recQr < totalGeneral) {
        setError(`SRS-POS-017: La suma de Efectivo ($${recEfectivo}) y QR ($${recQr}) debe ser mayor o igual al total ($${totalGeneral.toFixed(2)}).`)
        return
      }
    }

    if (requiereBypassMargen) {
      if (!adminEmail.trim() || !adminPassword.trim() || !justificacionBypass.trim()) {
        setError("SRS-POS-007/008: Se requieren credenciales de Administrador y justificación técnica para el bypass por margen mínimo.")
        return
      }
    }

    setIsProcessing(true)
    setError(null)

    const payload: CheckoutRequest = {
      clienteId: clienteSeleccionado?.id || null,
      cotizacionId: loadedCotizacionId,
      metodoPago,
      montoRecibidoEfectivo: recEfectivo,
      montoQr: recQr,
      productos: cart
        .filter((i): i is CartProductItem => i.type === "producto")
        .map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
          tipoDescuento: i.tipoDescuento,
          valorDescuento: i.valorDescuento,
          numeroSerieId: i.selectedSerieId,
        })),
      servicios: cart
        .filter((i): i is CartServiceItem => i.type === "servicio")
        .map((i) => ({
          servicioId: i.servicio.id,
          precioFinalAplicado: i.precioFinalAplicado,
          tipoDescuento: i.tipoDescuento,
          valorDescuento: i.valorDescuento,
        })),
      adminEmail: requiereBypassMargen ? adminEmail.trim() : undefined,
      adminPassword: requiereBypassMargen ? adminPassword : undefined,
      justificacionBypass: requiereBypassMargen ? justificacionBypass.trim() : undefined,
    }

    try {
      const venta = await procesarCheckout(payload)
      setVentaCompletada(venta)
      setIsCheckoutModalOpen(false)
      setCart([])
      setClienteSeleccionado(null)
      setCiSearch("")
      setLoadedCotizacionId(null)

      await descargarNotaVentaPdf(venta.id, venta.codigoNotaVenta).catch(() => null)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al procesar el cobro."
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredProductos = useMemo(() => {
    return productos.filter(
      (p) =>
        p.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skuUnico.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoriaNombre && p.categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [productos, searchTerm])

  const filteredServicios = useMemo(() => {
    return servicios.filter((s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [servicios, searchTerm])

  if (isCheckingCaja) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!cajaActiva) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto min-h-[60vh] space-y-4">
        <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Lock className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Acceso al Punto de Venta Bloqueado
        </h2>
        <p className="text-sm text-muted-foreground">
          SRS-CAJ-001: El sistema bloquea las operaciones de cobro en el POS hasta que inicies una sesión de caja en estado 'Abierta'.
        </p>
        <Button render={<Link to="/apertura-cierre" />} className="cursor-pointer">
          Ir a Apertura de Caja
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header POS */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <ShoppingCart className="size-6" />
            Punto de Venta (POS)
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Sesión activa: <strong>{cajaActiva.usuarioNombre}</strong> • Apertura: {new Date(cajaActiva.fechaHoraApertura).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsProformaModalOpen(true)}
            className="cursor-pointer gap-1.5"
          >
            <FileText className="size-4" />
            Cargar Proforma (SRS-POS-015)
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Atención en el Punto de Venta</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Venta exitosa banner */}
      {ventaCompletada && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-foreground">
            ¡Venta {ventaCompletada.codigoNotaVenta} procesada exitosamente!
          </AlertTitle>
          <AlertDescription className="mt-1 flex items-center justify-between">
            <span>
              Total: <strong>${ventaCompletada.total.toFixed(2)}</strong> ({ventaCompletada.metodoPago}). Comprobante PDF generado.
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void descargarNotaVentaPdf(ventaCompletada.id, ventaCompletada.codigoNotaVenta)}
              className="gap-1 bg-background text-foreground"
            >
              <Download className="size-3.5" />
              Re-descargar PDF
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA: Catálogo (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por SKU, nombre o categoría..."
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
                <TabsTrigger value="productos">Componentes</TabsTrigger>
                <TabsTrigger value="servicios">Servicios</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Grid de Artículos */}
          {catalogoTab === "productos" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredProductos.map((prod) => {
                const isOutOfStock = prod.stockDisponible <= 0
                return (
                  <Card
                    key={prod.id}
                    onClick={() => !isOutOfStock && handleAddProducto(prod)}
                    className={`border-border transition-all select-none ${
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                        : "cursor-pointer hover:border-foreground/40 hover:shadow-xs active:scale-[0.99]"
                    }`}
                  >
                    <CardHeader className="p-3 pb-1.5">
                      <div className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden mb-2">
                        {prod.imagenUrl ? (
                          <img
                            src={prod.imagenUrl}
                            alt={prod.nombreComercial}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Cpu className="size-8 text-muted-foreground" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono w-fit">
                        {prod.skuUnico}
                      </Badge>
                      <CardTitle className="text-xs font-semibold line-clamp-2 mt-1">
                        {prod.nombreComercial}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-foreground">
                          ${prod.precioVenta.toFixed(2)}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            isOutOfStock ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {isOutOfStock ? "Agotado" : `${prod.stockDisponible} disp.`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredServicios.map((serv) => (
                <Card
                  key={serv.id}
                  onClick={() => handleAddServicio(serv)}
                  className="border-border transition-all cursor-pointer hover:border-foreground/40 hover:shadow-xs active:scale-[0.99]"
                >
                  <CardHeader className="p-3 pb-1.5">
                    <div className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden mb-2">
                      {serv.imagenUrl ? (
                        <img
                          src={serv.imagenUrl}
                          alt={serv.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wrench className="size-8 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] w-fit">
                      Servicio Técnico
                    </Badge>
                    <CardTitle className="text-xs font-semibold line-clamp-2 mt-1">
                      {serv.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-foreground">
                        ${serv.precioBaseSugerido.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Mano de obra</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Carrito (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <User className="size-4" />
                  Cliente
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-xs text-primary cursor-pointer"
                >
                  <Plus className="size-3" />
                  Nuevo Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2">
              <Input
                placeholder="Buscar por Cédula de Identidad (CI)..."
                value={ciSearch}
                onChange={(e) => {
                  setCiSearch(e.target.value)
                  void handleBuscarCliente(e.target.value)
                }}
                className="text-xs h-8"
              />
              <div className="p-2 rounded-md bg-muted/40 border border-border text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Titular: </span>
                  <strong className="text-foreground">
                    {clienteSeleccionado
                      ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
                      : "Cliente Genérico (Mostrador)"}
                  </strong>
                </div>
                {clienteSeleccionado && (
                  <Badge variant="outline" className="text-[10px]">
                    CI: {clienteSeleccionado.ci}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="p-3.5 pb-2 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  Carrito ({cart.length} ítems)
                </CardTitle>
                {cart.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setCart([])}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer text-xs"
                  >
                    Vaciar
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-3 max-h-[360px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  El carrito está vacío. Selecciona artículos del catálogo para agregar.
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg border border-border bg-card space-y-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {item.type === "producto" ? item.producto.nombreComercial : item.servicio.nombre}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.type === "producto" ? `SKU: ${item.producto.skuUnico}` : "Servicio Técnico"}
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

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
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
                          <span className="font-semibold text-foreground px-1">{item.cantidad}</span>
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
                          <span className="text-muted-foreground text-[11px]">Precio: $</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioFinalAplicado}
                            onChange={(e) =>
                              handleUpdatePrecioServicio(index, parseFloat(e.target.value) || 0)
                            }
                            className="h-6 w-20 text-xs px-1.5"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="Desc %"
                          min="0"
                          max="100"
                          value={item.valorDescuento || ""}
                          onChange={(e) =>
                            handleUpdateDescuento(
                              index,
                              "Porcentaje",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-6 w-16 text-xs px-1"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>

                      <div className="font-bold text-foreground text-sm">
                        {item.type === "producto"
                          ? `$${(
                              item.producto.precioVenta * item.cantidad * (1 - (item.valorDescuento || 0) / 100)
                            ).toFixed(2)}`
                          : `$${item.precioFinalAplicado.toFixed(2)}`}
                      </div>
                    </div>

                    {item.type === "producto" && item.seriesDisponibles.length > 0 && (
                      <div className="pt-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Número de Serie Asignado (SRS-CAT-004) *
                        </Label>
                        <Select
                          value={item.selectedSerieId || ""}
                          onValueChange={(val) => handleSelectSerie(index, val ?? "")}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Seleccionar serie" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.seriesDisponibles.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.numeroSerieAlfanumerico}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>

            <CardFooter className="p-3.5 flex-col gap-3 border-t border-border bg-muted/20">
              <div className="w-full space-y-1 text-xs">
                {requiereBypassMargen && (
                  <div className="flex items-center gap-1.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px]">
                    <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>SRS-POS-006: Uno o más productos se venden por debajo del costo. Requerirá Bypass de Administrador.</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-bold text-foreground pt-1">
                  <span>TOTAL A COBRAR:</span>
                  <span>${totalGeneral.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGuardarCotizacion}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full text-xs"
                >
                  <FileText className="size-3.5 mr-1" />
                  Cotizar (Proforma)
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsCheckoutModalOpen(true)}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full text-xs font-semibold"
                >
                  Cobrar Ahora
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* MODAL CHECKOUT */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procesar Cobro de Venta</DialogTitle>
            <DialogDescription>
              Total a liquidar: <strong className="text-foreground text-base">${totalGeneral.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCheckout} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Modalidad de Pago (SRS-POS-003, 004, 017)</Label>
              <Tabs
                value={metodoPago}
                onValueChange={(v) => {
                  setMetodoPago(v as "Efectivo" | "QR" | "Pago Mixto")
                  setMontoRecibidoEfectivo("")
                  setMontoQr("")
                }}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="Efectivo">Efectivo</TabsTrigger>
                  <TabsTrigger value="QR">QR Bancario</TabsTrigger>
                  <TabsTrigger value="Pago Mixto">Pago Mixto</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {metodoPago === "Efectivo" && (
              <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
                <Label htmlFor="montoRecibido">Monto Recibido en Efectivo ($) *</Label>
                <Input
                  id="montoRecibido"
                  type="number"
                  step="0.01"
                  min={totalGeneral}
                  value={montoRecibidoEfectivo}
                  onChange={(e) => setMontoRecibidoEfectivo(e.target.value)}
                  placeholder={totalGeneral.toFixed(2)}
                  required
                />
                {parseFloat(montoRecibidoEfectivo) >= totalGeneral && (
                  <div className="flex items-center justify-between text-xs pt-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Cambio / Vuelto a entregar (SRS-POS-004):</span>
                    <span className="text-sm font-bold">
                      ${(parseFloat(montoRecibidoEfectivo) - totalGeneral).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {metodoPago === "QR" && (
              <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Liquidación QR Bancaria (SRS-POS-003)</p>
                <p>
                  El monto íntegro de <strong>${totalGeneral.toFixed(2)}</strong> se registrará en la cuenta de conciliación bancaria sin afectar el cajón físico.
                </p>
              </div>
            )}

            {metodoPago === "Pago Mixto" && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20 text-xs">
                <p className="font-semibold text-foreground">Fraccionamiento Simultáneo (SRS-POS-017)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="fracEfectivo">Fracción Efectivo ($)</Label>
                    <Input
                      id="fracEfectivo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoRecibidoEfectivo}
                      onChange={(e) => setMontoRecibidoEfectivo(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fracQr">Fracción QR ($)</Label>
                    <Input
                      id="fracQr"
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoQr}
                      onChange={(e) => setMontoQr(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border font-medium">
                  <span>Suma Entregada:</span>
                  <span>
                    ${((parseFloat(montoRecibidoEfectivo) || 0) + (parseFloat(montoQr) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {requiereBypassMargen && (
              <div className="space-y-2.5 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="size-4" />
                  <span>Autorización Obligatoria de Administrador (Bypass Margen)</span>
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Correo de Administrador"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Contraseña de Administrador"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Justificación técnica obligatoria de la excepción de precio (SRS-POS-008)..."
                    value={justificacionBypass}
                    onChange={(e) => setJustificacionBypass(e.target.value)}
                    rows={2}
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutModalOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? "Confirmando Venta..." : "Confirmar e Imprimir Nota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CARGAR PROFORMAS */}
      <Dialog open={isProformaModalOpen} onOpenChange={setIsProformaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recuperar Proforma Comercial en Carrito</DialogTitle>
            <DialogDescription>
              SRS-POS-015: Busca cotizaciones pendientes por CI del cliente para cargarlas al POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ingresa Cédula de Identidad (CI)..."
                value={proformaCiSearch}
                onChange={(e) => setProformaCiSearch(e.target.value)}
              />
              <Button type="button" onClick={handleBuscarProformas} disabled={isSearchingProformas}>
                Buscar
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {isSearchingProformas ? (
                <Skeleton className="h-12 w-full" />
              ) : proformasEncontradas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No se encontraron cotizaciones pendientes para el criterio ingresado.
                </p>
              ) : (
                proformasEncontradas.map((cot) => (
                  <div
                    key={cot.id}
                    className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{cot.codigoProforma}</p>
                      <p className="text-muted-foreground">
                        Cliente: {cot.clienteNombre} (CI: {cot.clienteCi})
                      </p>
                      <p className="text-muted-foreground">Total: ${cot.totalEstimado.toFixed(2)}</p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => handleCargarProformaEnCarrito(cot)}
                    >
                      Cargar al POS
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsProformaModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalCliente
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        mode="create"
        onSuccess={(nuevo) => {
          setClienteSeleccionado(nuevo)
          setCiSearch(nuevo.ci || "")
        }}
      />
    </div>
  )
}
