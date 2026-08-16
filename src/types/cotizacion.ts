import type { ItemProductoRequest, ItemServicioRequest } from "./venta"

export type CreateCotizacionRequest = {
  clienteId: string
  diasValidez?: number
  productos: ItemProductoRequest[]
  servicios: ItemServicioRequest[]
}

export type Cotizacion = {
  id: string
  codigoProforma: string
  clienteId: string
  clienteNombre: string
  clienteCi: string
  diasValidez: number
  totalEstimado: number
  estado: "Pendiente" | "Convertida en Venta" | "Vencida"
  fechaHora: string
  productos: ItemProductoRequest[]
  servicios: ItemServicioRequest[]
}
