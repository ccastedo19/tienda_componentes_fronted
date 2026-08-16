export type ItemProductoRequest = {
  productoId: string
  cantidad: number
  tipoDescuento?: "Porcentaje" | "Fijo" | null
  valorDescuento?: number
  numeroSerieId?: string | null
}

export type ItemServicioRequest = {
  servicioId: string
  precioFinalAplicado: number
  tipoDescuento?: "Porcentaje" | "Fijo" | null
  valorDescuento?: number
}

export type CheckoutRequest = {
  clienteId?: string | null
  cotizacionId?: string | null
  metodoPago: "Efectivo" | "QR" | "Pago Mixto"
  montoRecibidoEfectivo?: number
  montoQr?: number
  productos?: ItemProductoRequest[]
  servicios?: ItemServicioRequest[]
  adminEmail?: string
  adminPassword?: string
  justificacionBypass?: string
}

export type DetalleVentaProducto = {
  productoId: string
  productoNombre: string
  sku: string
  cantidad: number
  precioUnitario: number
  tipoDescuento?: string | null
  valorDescuento?: number
  subtotalNeto: number
  numeroSerie?: string | null
}

export type DetalleVentaServicio = {
  servicioId: string
  servicioNombre: string
  precioFinalAplicado: number
  tipoDescuento?: string | null
  valorDescuento?: number
  subtotalNeto: number
}

export type Venta = {
  id: string
  codigoNotaVenta: string
  cajaId: string
  vendedorNombre: string
  clienteNombre: string
  clienteCi?: string | null
  fechaHora: string
  total: number
  metodoPago: "Efectivo" | "QR" | "Pago Mixto"
  montoEfectivo: number
  montoQr: number
  cambioEfectivo: number
  productos?: DetalleVentaProducto[]
  servicios?: DetalleVentaServicio[]
}
