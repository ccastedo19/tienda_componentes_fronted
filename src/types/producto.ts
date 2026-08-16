export type Producto = {
  id: string
  skuUnico: string
  nombreComercial: string
  descripcion: string
  categoriaId: string
  categoriaNombre?: string
  precioCosto: number
  precioVenta: number
  umbralStockMinimo: number
  stockActual: number
  stockReservado: number
  stockDisponible: number
  imagenUrl?: string | null
  imagenPublicId?: string | null
}

export type ProductoSerie = {
  id: string
  productoId: string
  numeroSerieAlfanumerico: string
  estado: "En Stock" | "Reservado Taller" | "Vendido"
}

export type CreateProductoRequest = {
  skuUnico: string
  nombreComercial: string
  descripcion?: string
  categoriaId: string
  precioCosto: number
  precioVenta: number
  umbralStockMinimo: number
  stockActual?: number
  imagenUrl?: string | null
  imagenPublicId?: string | null
}

export type UpdateProductoRequest = Partial<CreateProductoRequest>
