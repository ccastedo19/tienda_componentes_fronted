import type { ItemProductoRequest, ItemServicioRequest } from "./venta"

export type CreateCotizacionRequest = {
  clienteId?: string | null
  diasValidez?: number
  productos: ItemProductoRequest[]
  servicios: ItemServicioRequest[]
}

export type DetalleCotizacionProducto = {
  productoId: string
  productoNombre?: string
  sku?: string
  cantidad: number
  precioUnitario?: number
  tipoDescuento?: string | null
  valorDescuento?: number
  subtotalNeto?: number
  numeroSerie?: string | null
}

export type DetalleCotizacionServicio = {
  servicioId: string
  servicioNombre?: string
  precioFinalAplicado: number
  tipoDescuento?: string | null
  valorDescuento?: number
  subtotalNeto?: number
}

export type Cotizacion = {
  id: string
  codigoProforma: string
  clienteId?: string | null
  clienteNombre: string
  clienteCi?: string | null
  diasValidez: number
  totalEstimado: number
  estado: "Pendiente" | "Convertida en Venta" | "Vencida"
  fechaHora: string
  productos: DetalleCotizacionProducto[]
  servicios: DetalleCotizacionServicio[]
}
