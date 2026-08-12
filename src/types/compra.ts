export type ItemCompraRequest = {
  productoId: string
  cantidad: number
  costoUnitario: number
}

export type CreateCompraRequest = {
  proveedorId: string
  items: ItemCompraRequest[]
}

export type DetalleCompraItem = {
  id: string
  productoId: string
  productoNombre: string
  sku: string
  cantidad: number
  costoUnitario: number
  costoAnterior?: number
  superaCostoHistorico?: boolean
}

export type Compra = {
  id: string
  proveedorId: string
  proveedorNombre: string
  usuarioNombre: string
  fechaHora: string
  totalCompra: number
  items: DetalleCompraItem[]
  alertasVariacionCosto?: string[]
}
