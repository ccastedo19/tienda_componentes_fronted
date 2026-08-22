import { useState, useEffect, useMemo } from "react"
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  UserPlus,
  FileText,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Eye,
  Cpu,
  Wrench,
  ChevronRight,
  ShieldAlert,
  X,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { ModalCliente } from "@/components/Modal/ModalCliente"
import { ModalTicketVenta } from "@/components/Modal/ModalTicketVenta"
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
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { getCajaActiva } from "@/services/caja.service"
import { getClientes } from "@/services/cliente.service"
import { getCotizaciones } from "@/services/cotizacion.service"
import { getOrdenesTecnicas } from "@/services/ordenTecnica.service"
import { getProductos, getSeriesByProducto } from "@/services/producto.service"
import { getServicios } from "@/services/servicio.service"
import { procesarCheckout } from "@/services/venta.service"
import type { Caja } from "@/types/caja"
import type { Cliente } from "@/types/cliente"
import type { Cotizacion } from "@/types/cotizacion"
import type { OrdenTecnica } from "@/types/ordenTecnica"
import type { Producto, ProductoSerie } from "@/types/producto"
import type { Servicio } from "@/types/servicio"
import type { CheckoutRequest, Venta as VentaModel } from "@/types/venta"

const CLIENTE_GENERICO_VALUE = "__cliente_generico__"

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
  const [cajaActiva, setCajaActiva] = useState<Caja | null>(null)
  const [isCheckingCaja, setIsCheckingCaja] = useState(true)

  const [productos, setProductos] = useState<Producto[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalogoTab, setCatalogoTab] = useState<"productos" | "servicios">("productos")
  const [searchTerm, setSearchTerm] = useState("")

  const [cart, setCart] = useState<CartItem[]>([])

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [clienteOptionId, setClienteOptionId] = useState<string | null>(CLIENTE_GENERICO_VALUE)
  const location = useLocation()
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  const [isProformaModalOpen, setIsProformaModalOpen] = useState(false)
  const [proformas, setProformas] = useState<Cotizacion[]>([])
  const [proformaOptionId, setProformaOptionId] = useState<string | null>(null)
  const [isLoadingProformas, setIsLoadingProformas] = useState(false)
  const [loadedCotizacionId, setLoadedCotizacionId] = useState<string | null>(null)

  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false)
  const [ordenesTecnicas, setOrdenesTecnicas] = useState<OrdenTecnica[]>([])
  const [ordenOptionId, setOrdenOptionId] = useState<string | null>(null)
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(false)
  const [ordenTecnicaActiva, setOrdenTecnicaActiva] = useState<OrdenTecnica | null>(null)

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "QR" | "Pago Mixto">("Efectivo")
  const [montoRecibidoEfectivo, setMontoRecibidoEfectivo] = useState("")
  const [montoQr, setMontoQr] = useState("")

  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [justificacionBypass, setJustificacionBypass] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ventaCompletada, setVentaCompletada] = useState<VentaModel | null>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  const refreshProductos = async () => {
    try {
      const prods = await getProductos()
      setProductos(prods)
    } catch {
      // El stock se actualizará en la próxima recarga
    }
  }

  useEffect(() => {
    const initData = async () => {
      setIsCheckingCaja(true)
      try {
        const [caja, prods, servs, clientesData] = await Promise.all([
          getCajaActiva().catch(() => null),
          getProductos().catch(() => []),
          getServicios().catch(() => []),
          getClientes().catch(() => []),
        ])
        setCajaActiva(caja)
        setProductos(prods)
        setServicios(servs)
        setClientes(clientesData.filter((c) => (c.estado ?? "Activo") !== "Eliminado"))
      } catch {
        // Error handling
      } finally {
        setIsCheckingCaja(false)
      }
    }
    void initData()
  }, [])

  const clienteOptions = useMemo<SmartComboboxOption[]>(() => {
    const options: SmartComboboxOption[] = [
      {
        value: CLIENTE_GENERICO_VALUE,
        label: "Cliente Genérico",
        description: "Venta sin cliente registrado",
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

  const proformaOptions = useMemo<SmartComboboxOption[]>(() => {
    return proformas.map((cot) => ({
      value: cot.id,
      label: `${cot.codigoProforma} — ${cot.clienteNombre}`,
      description: `CI/NIT: ${cot.clienteCi} • Bs. ${cot.totalEstimado.toFixed(2)}`,
      keywords: `${cot.codigoProforma} ${cot.clienteCi} ${cot.clienteNombre}`,
    }))
  }, [proformas])

  const ordenOptions = useMemo<SmartComboboxOption[]>(() => {
    return ordenesTecnicas
      .filter((ord) => ord.estado !== "Pagada" && ord.estado !== "Cancelada")
      .map((ord) => ({
        value: ord.id,
        label: `${ord.codigoOrden} — ${ord.clienteNombre}`,
        description: `CI/NIT: ${ord.clienteCi} • Estado: ${ord.estado} • Repuestos: ${ord.componentes?.length || 0} • Servicios: ${ord.servicios?.length || 0}`,
        keywords: `${ord.codigoOrden} ${ord.clienteCi} ${ord.clienteNombre}`,
      }))
  }, [ordenesTecnicas])

  const handleSelectCliente = (value: string | null) => {
    if (value === null) {
      // Limpia el input para buscar; se mantiene como genérico hasta elegir otro
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

  const loadProformas = async () => {
    setIsLoadingProformas(true)
    try {
      const data = await getCotizaciones()
      setProformas(data.filter((cot) => cot.estado === "Pendiente"))
    } catch {
      setProformas([])
    } finally {
      setIsLoadingProformas(false)
    }
  }

  const loadOrdenesTecnicas = async () => {
    setIsLoadingOrdenes(true)
    try {
      const data = await getOrdenesTecnicas()
      setOrdenesTecnicas(data.filter((ord) => ord.estado !== "Cancelada"))
    } catch {
      setOrdenesTecnicas([])
    } finally {
      setIsLoadingOrdenes(false)
    }
  }

  const handleOpenProformaModal = () => {
    setProformaOptionId(null)
    setIsProformaModalOpen(true)
    void loadProformas()
  }

  const handleOpenOrdenModal = () => {
    setOrdenOptionId(null)
    setIsOrdenModalOpen(true)
    void loadOrdenesTecnicas()
  }

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

    if (cot.clienteId) {
      const cliente = clientes.find((c) => c.id === cot.clienteId)
      if (cliente) {
        setClienteSeleccionado(cliente)
        setClienteOptionId(cliente.id)
      } else if (cot.clienteCi) {
        const byCi = clientes.find((c) => c.ci === cot.clienteCi)
        if (byCi) {
          setClienteSeleccionado(byCi)
          setClienteOptionId(byCi.id)
        }
      }
    }

    setIsProformaModalOpen(false)
    setProformaOptionId(null)
  }

  const handleConfirmLoadProforma = () => {
    if (!proformaOptionId) return
    const cot = proformas.find((item) => item.id === proformaOptionId)
    if (cot) {
      handleCargarProformaEnCarrito(cot)
    }
  }

  const handleCargarOrdenTecnicaEnCarrito = (orden: OrdenTecnica) => {
    if (orden.estado === "Pagada") {
      setError(`SRS-POS-010: La orden técnica ${orden.codigoOrden} ya fue cobrada y pagada en POS previamente.`)
      return
    }
    if (orden.estado === "Cancelada") {
      setError(`La orden técnica ${orden.codigoOrden} se encuentra cancelada.`)
      return
    }

    const newCart: CartItem[] = []

    if (orden.componentes) {
      for (const c of orden.componentes) {
        const prod = productos.find((item) => item.id === c.productoId)
        if (prod) {
          newCart.push({
            type: "producto",
            producto: prod,
            cantidad: c.cantidad,
            tipoDescuento: null,
            valorDescuento: 0,
            selectedSerieId: null,
            seriesDisponibles: [],
          })
        }
      }
    }

    if (orden.servicios) {
      for (const s of orden.servicios) {
        const serv = servicios.find((item) => item.id === s.servicioId)
        if (serv) {
          newCart.push({
            type: "servicio",
            servicio: serv,
            precioFinalAplicado: s.precioAplicado,
            tipoDescuento: null,
            valorDescuento: 0,
          })
        }
      }
    }

    setCart(newCart)
    setOrdenTecnicaActiva(orden)
    setLoadedCotizacionId(null)

    if (orden.clienteId) {
      const cliente = clientes.find((c) => c.id === orden.clienteId)
      if (cliente) {
        setClienteSeleccionado(cliente)
        setClienteOptionId(cliente.id)
      } else if (orden.clienteCi) {
        const byCi = clientes.find((c) => c.ci === orden.clienteCi)
        if (byCi) {
          setClienteSeleccionado(byCi)
          setClienteOptionId(byCi.id)
        }
      }
    }

    setIsOrdenModalOpen(false)
    setOrdenOptionId(null)
  }

  const handleConfirmLoadOrden = () => {
    if (!ordenOptionId) return
    const ord = ordenesTecnicas.find((item) => item.id === ordenOptionId)
    if (ord) {
      handleCargarOrdenTecnicaEnCarrito(ord)
    }
  }

  useEffect(() => {
    const stateOrden = location.state?.ordenTecnica as OrdenTecnica | undefined
    if (stateOrden && productos.length > 0) {
      handleCargarOrdenTecnicaEnCarrito(stateOrden)
    }
  }, [location.state, productos])

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
        setError(
          `SRS-POS-005: La cantidad solicitada supera el stock disponible (${producto.stockDisponible})`
        )
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

  const handleUpdateCantidad = (index: number, delta: number) => {
    const item = cart[index]
    if (item.type !== "producto") return

    const newCant = item.cantidad + delta
    if (newCant <= 0) {
      handleRemoveItem(index)
      return
    }

    if (newCant > item.producto.stockDisponible) {
      setError(
        `SRS-POS-005: La cantidad solicitada supera el stock disponible (${item.producto.stockDisponible})`
      )
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
    const descuento = Math.max(0, valor)
    const updated = [...cart]
    updated[index] = {
      ...item,
      tipoDescuento: descuento > 0 ? "Fijo" : null,
      valorDescuento: descuento,
    }
    setCart(updated)
  }

  const handleSelectSerie = (index: number, serieId: string | null) => {
    const item = cart[index]
    if (item.type !== "producto") return
    const updated = [...cart]
    updated[index] = { ...item, selectedSerieId: serieId }
    setCart(updated)
  }

  const getItemSubtotal = (item: CartItem) => {
    if (item.type === "producto") {
      const bruto = item.producto.precioVenta * item.cantidad
      return Math.max(0, bruto - (item.valorDescuento || 0))
    }

    return Math.max(0, item.precioFinalAplicado - (item.valorDescuento || 0))
  }

  const { totalGeneral, requiereBypassMargen } = useMemo(() => {
    let total = 0
    let requiereBypass = false

    for (const item of cart) {
      if (item.type === "producto") {
        const subtotal = getItemSubtotal(item)
        total += subtotal

        const precioNetoUnitario = subtotal / item.cantidad
        if (precioNetoUnitario < item.producto.precioCosto) {
          requiereBypass = true
        }
      } else {
        total += getItemSubtotal(item)
      }
    }

    return {
      totalGeneral: total,
      requiereBypassMargen: requiereBypass,
    }
  }, [cart])

  const openVentaTicketModal = () => {
    setIsTicketModalOpen(true)
  }

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    let recEfectivo: number | undefined
    let recQr: number | undefined

    if (metodoPago === "Efectivo") {
      recEfectivo = parseFloat(montoRecibidoEfectivo)
      if (isNaN(recEfectivo) || recEfectivo < totalGeneral) {
        setError(
          `SRS-POS-004: El monto recibido en efectivo ($${recEfectivo || 0}) debe ser mayor o igual al total ($${totalGeneral.toFixed(2)}).`
        )
        return
      }
    } else if (metodoPago === "QR") {
      recQr = totalGeneral
    } else {
      recEfectivo = parseFloat(montoRecibidoEfectivo) || 0
      recQr = parseFloat(montoQr) || 0
      if (recEfectivo + recQr < totalGeneral) {
        setError(
          `SRS-POS-017: La suma de Efectivo ($${recEfectivo}) y QR ($${recQr}) debe ser mayor o igual al total ($${totalGeneral.toFixed(2)}).`
        )
        return
      }
    }

    if (requiereBypassMargen) {
      if (!adminEmail.trim() || !adminPassword.trim() || !justificacionBypass.trim()) {
        setError(
          "SRS-POS-007/008: Se requieren credenciales de Administrador y justificación técnica para el bypass por margen mínimo."
        )
        return
      }
    }

    setIsProcessing(true)
    setError(null)

    const payload: CheckoutRequest = {
      clienteId: clienteSeleccionado?.id || null,
      cotizacionId: loadedCotizacionId,
      ordenTecnicaId: ordenTecnicaActiva?.id || null,
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
      setClienteOptionId(CLIENTE_GENERICO_VALUE)
      setLoadedCotizacionId(null)
      setOrdenTecnicaActiva(null)
      setMontoRecibidoEfectivo("")
      setMontoQr("")
      setAdminEmail("")
      setAdminPassword("")
      setJustificacionBypass("")

      await refreshProductos()
      setIsTicketModalOpen(true)
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
        (p.categoriaNombre &&
          p.categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Acceso al Punto de Venta Bloqueado
        </h2>
        <p className="text-sm text-muted-foreground">
          SRS-CAJ-001: El sistema bloquea las operaciones de cobro en el POS hasta que inicies una
          sesión de caja en estado 'Abierta'.
        </p>
        <Button
          nativeButton={false}
          render={<Link to="/apertura-cierre" />}
          className="cursor-pointer"
        >
          Ir a Apertura de Caja
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <ShoppingCart className="size-6" />
            Punto de Venta (POS)
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Sesión activa: <strong>{cajaActiva.usuarioNombre}</strong> • Apertura:{" "}
            {new Date(cajaActiva.fechaHoraApertura).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenOrdenModal}
            className="cursor-pointer gap-1.5"
          >
            <Wrench className="size-4" />
            Cargar Orden Técnica
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenProformaModal}
            className="cursor-pointer gap-1.5"
          >
            <FileText className="size-4" />
            Cargar Proforma
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

      {ventaCompletada && (
        <Alert className="relative border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setVentaCompletada(null)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar aviso de venta exitosa"
          >
            <X className="size-3.5" />
          </Button>
          <AlertTitle className="pr-8 font-semibold text-foreground">
            ¡Venta {ventaCompletada.codigoNotaVenta} procesada exitosamente!
          </AlertTitle>
          <AlertDescription className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Total: <strong>Bs. {ventaCompletada.total.toFixed(2)}</strong> (
              {ventaCompletada.metodoPago}).
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={openVentaTicketModal}
              className="gap-1 bg-background text-foreground"
            >
              <Eye className="size-3.5" />
              Ver ticket
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
              {filteredProductos.map((prod) => {
                const isOutOfStock = prod.stockDisponible <= 0
                return (
                  <Card
                    key={prod.id}
                    size="sm"
                    onClick={() => !isOutOfStock && void handleAddProducto(prod)}
                    className={`gap-0 rounded-lg border border-border/80 bg-card py-0 shadow-none ring-0 select-none transition-colors ${isOutOfStock
                      ? "cursor-not-allowed bg-muted/40 opacity-55"
                      : "cursor-pointer hover:border-foreground/25 hover:bg-muted/30 active:scale-[0.99]"
                      }`}
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
                        <span
                          className={`text-[10px] font-medium ${isOutOfStock ? "text-destructive" : "text-muted-foreground"
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
            <CardContent className="space-y-2 p-3.5 pt-0">
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
                    onClick={() => {
                      setCart([])
                      setOrdenTecnicaActiva(null)
                      setLoadedCotizacionId(null)
                    }}
                    className="cursor-pointer text-xs text-destructive hover:bg-destructive/10"
                  >
                    Vaciar
                  </Button>
                )}
              </div>
            </CardHeader>

            {ordenTecnicaActiva && (
              <div className="m-3 mb-0 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 p-2.5 text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-primary">
                      Orden Técnica #{ordenTecnicaActiva.codigoOrden}
                    </span>
                    <span className="text-muted-foreground ml-1.5">
                      • Cliente: {ordenTecnicaActiva.clienteNombre}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOrdenTecnicaActiva(null)}
                  title="Desvincular orden técnica del cobro"
                >
                  <X className="size-3 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>
            )}

            <CardContent className="max-h-[360px] space-y-3 overflow-y-auto p-3.5">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  El carrito está vacío. Selecciona artículos del catálogo para agregar.
                </div>
              ) : (
                cart.map((item, index) => {
                  const serieOptions: SmartComboboxOption[] =
                    item.type === "producto"
                      ? item.seriesDisponibles.map((s) => ({
                        value: s.id,
                        label: s.numeroSerieAlfanumerico,
                        keywords: s.numeroSerieAlfanumerico,
                      }))
                      : []

                  return (
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

                      {item.type === "producto" && item.seriesDisponibles.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          <Label className="text-[10px] text-muted-foreground">
                            Número de Serie Asignado *
                          </Label>
                          <SmartCombobox
                            options={serieOptions}
                            value={item.selectedSerieId}
                            onValueChange={(value) => handleSelectSerie(index, value)}
                            placeholder="Buscar serie..."
                            emptyMessage="No se encontraron series."
                            className="w-full text-xs"
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </CardContent>

            <CardFooter className="flex-col gap-3 border-t border-border bg-muted/20 p-3.5">
              <div className="w-full space-y-1 text-xs">
                {requiereBypassMargen && (
                  <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      SRS-POS-006: Uno o más productos se venden por debajo del costo. Requerirá Bypass
                      de Administrador.
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 text-base font-bold text-foreground">
                  <span>TOTAL A COBRAR:</span>
                  <span>Bs. {totalGeneral.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => setIsCheckoutModalOpen(true)}
                disabled={cart.length === 0 || isProcessing}
                className="w-full cursor-pointer text-sm font-semibold"
              >
                Cobrar Ahora
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Cobro de Venta</DialogTitle>
            <DialogDescription>
              Total a liquidar:{" "}
              <strong className="text-base text-foreground">Bs. {totalGeneral.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmCheckout} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Modalidad de Pago</Label>
              <Tabs
                value={metodoPago}
                onValueChange={(v) => {
                  setMetodoPago(v as "Efectivo" | "QR" | "Pago Mixto")
                  setMontoRecibidoEfectivo("")
                  setMontoQr("")
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Efectivo">Efectivo</TabsTrigger>
                  <TabsTrigger value="QR">QR Bancario</TabsTrigger>
                  <TabsTrigger value="Pago Mixto">Pago Mixto</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {metodoPago === "Efectivo" && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <Label htmlFor="montoRecibido">Monto Recibido en Efectivo (Bs.) *</Label>
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
                  <div className="flex items-center justify-between pt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Cambio / Vuelto a entregar:</span>
                    <span className="text-sm font-bold">
                      Bs. {(parseFloat(montoRecibidoEfectivo) - totalGeneral).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {metodoPago === "QR" && (
              <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Liquidación QR Bancaria</p>
                <p>
                  El monto íntegro de <strong>Bs. {totalGeneral.toFixed(2)}</strong> se registrará sin
                  afectar el cajón físico.
                </p>
              </div>
            )}

            {metodoPago === "Pago Mixto" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="fracEfectivo">Pago en Efectivo (Bs.)</Label>
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
                    <Label htmlFor="fracQr">Pago en QR (Bs.)</Label>
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

                <div className="flex items-center justify-between border-t border-border pt-1 font-medium">
                  <span>Suma Entregada:</span>
                  <span>
                    Bs.{" "}
                    {(
                      (parseFloat(montoRecibidoEfectivo) || 0) + (parseFloat(montoQr) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {requiereBypassMargen && (
              <div className="space-y-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="size-4" />
                  <span>Autorización Obligatoria de Administrador (Bypass Margen)</span>
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Correo admin"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Justificación del bypass..."
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
                className="cursor-pointer"
                variant="outline"
                onClick={() => setIsCheckoutModalOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={isProcessing}>
                {isProcessing ? "Confirmando Venta..." : "Confirmar Venta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProformaModalOpen} onOpenChange={setIsProformaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cargar Proforma al Carrito</DialogTitle>
            <DialogDescription>
              Busca por CI/NIT, nombre del cliente o código de proforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {isLoadingProformas ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SmartCombobox
                options={proformaOptions}
                value={proformaOptionId}
                onValueChange={setProformaOptionId}
                placeholder="Buscar proforma..."
                emptyMessage="No se encontraron proformas pendientes."
                className="w-full"
              />
            )}

            {proformaOptionId ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                {(() => {
                  const cot = proformas.find((item) => item.id === proformaOptionId)
                  if (!cot) return null
                  return (
                    <>
                      <p className="font-semibold text-foreground">{cot.codigoProforma}</p>
                      <p className="text-muted-foreground">
                        Cliente: {cot.clienteNombre} (NIT: {cot.clienteCi})
                      </p>
                      <p className="text-muted-foreground">
                        Total: Bs. {cot.totalEstimado.toFixed(2)}
                      </p>
                    </>
                  )
                })()}
              </div>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsProformaModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLoadProforma}
              disabled={!proformaOptionId || isLoadingProformas}
            >
              Cargar al POS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrdenModalOpen} onOpenChange={setIsOrdenModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-primary" />
              Cargar Orden Técnica de Taller al POS
            </DialogTitle>
            <DialogDescription>
              Selecciona una orden de servicio técnico para liquidar mano de obra y repuestos en el cobro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {isLoadingOrdenes ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <SmartCombobox
                options={ordenOptions}
                value={ordenOptionId}
                onValueChange={setOrdenOptionId}
                placeholder="Buscar orden..."
                emptyMessage="No se encontraron órdenes técnicas pendientes o activas."
                className="w-full"
              />
            )}

            {ordenOptionId ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
                {(() => {
                  const ord = ordenesTecnicas.find((item) => item.id === ordenOptionId)
                  if (!ord) return null
                  const totalServ = ord.servicios?.reduce((acc, s) => acc + (s.precioAplicado || 0), 0) ?? 0
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{ord.codigoOrden}</span>
                        <Badge variant="outline">{ord.estado}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Cliente: <strong>{ord.clienteNombre}</strong> (CI/NIT: {ord.clienteCi})
                      </p>
                      <p className="text-muted-foreground">
                        Técnico: {ord.tecnicoNombre || "Sin asignar"}
                      </p>
                      <div className="pt-1 text-primary font-medium">
                        {ord.componentes?.length || 0} repuestos retenidos • {ord.servicios?.length || 0} servicios (Bs. {totalServ.toFixed(2)})
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsOrdenModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLoadOrden}
              disabled={!ordenOptionId || isLoadingOrdenes}
            >
              Cargar Orden al POS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalTicketVenta
        open={isTicketModalOpen}
        onOpenChange={setIsTicketModalOpen}
        venta={ventaCompletada}
      />

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
