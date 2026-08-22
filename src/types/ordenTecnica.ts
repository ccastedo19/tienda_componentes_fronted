export type ComponenteOrdenRequest = {
  productoId: string
  numeroSerieId?: string | null
  cantidad: number
}

export type ServicioOrdenRequest = {
  servicioId: string
  precioAplicado: number
}

export type CreateOrdenTecnicaRequest = {
  clienteId: string
  tecnicoId?: string | null
  diagnostico?: string
  observaciones?: string
  componentes: ComponenteOrdenRequest[]
  servicios: ServicioOrdenRequest[]
}

export type DetalleComponenteOrden = {
  productoId: string
  productoNombre: string
  sku: string
  cantidad: number
  numeroSerie?: string | null
}

export type DetalleServicioOrden = {
  servicioId: string
  servicioNombre: string
  precioAplicado: number
}

export type OrdenTecnica = {
  id: string
  codigoOrden: string
  clienteId: string
  clienteNombre: string
  clienteCi: string
  tecnicoId?: string | null
  tecnicoNombre: string
  fechaHoraIngreso: string
  fechaHoraFinalizacion?: string | null
  estado: "Pendiente" | "En Proceso" | "Finalizada" | "Pagada" | "Cancelada"
  diagnostico?: string
  observaciones?: string
  ventaId?: string | null
  codigoNotaVenta?: string | null
  montoTotalCobrado?: number | null
  metodoPagoVenta?: string | null
  componentes: DetalleComponenteOrden[]
  servicios: DetalleServicioOrden[]
}
