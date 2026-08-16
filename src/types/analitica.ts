export type DashboardMetrics = {
  totalVentasHoy: number
  totalEfectivoHoy: number
  totalQrHoy: number
  cantidadVentasHoy: number
  productosStockBajoCount: number
  alertasStockBajo: string[]
}

export type RentabilidadMetrics = {
  ingresoBrutoVentas: number
  costoAdquisicionVendidos: number
  valorMermasDeclaradas: number
  rentabilidadNeta: number
}

export type ProductividadOperador = {
  usuarioId: string
  operadorNombre: string
  operadorEmail: string
  cantidadVentas: number
  volumenBrutoFacturacion: number
}

export type VentaTendencia = {
  periodo: string
  totalVentas: number
  totalEfectivo: number
  totalQr: number
  cantidadTransacciones: number
}

export type ProveedorRendimiento = {
  proveedorId: string
  proveedorNombre: string
  totalComprado: number
  totalVendidoEstimado: number
  margenGanancia: number
  ratioRendimiento: number
}

export type StockMuerto = {
  productoId: string
  sku: string
  nombreComercial: string
  categoria: string
  stockActual: number
  precioCosto: number
  capitalInmovilizado: number
  ultimoMovimiento: string
  diasSinMovimiento: number
}

export type RoiTaller = {
  cantidadOrdenesFinalizadas: number
  ingresosManoDeObra: number
  costoRepuestosConsumidos: number
  gananciaNetaTaller: number
  margenRentabilidad: number
}
