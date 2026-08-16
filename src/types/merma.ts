export type ItemMermaRequest = {
  productoId?: string | null
  cantidad?: number
  valorEconomico: number
}

export type CreateMermaRequest = {
  tipoMerma: "Pérdida Física" | "Pérdida en Efectivo Mostrador"
  observacion?: string
  items: ItemMermaRequest[]
}

export type DetalleMerma = {
  id: string
  productoId?: string | null
  productoNombre: string
  sku: string
  cantidad: number
  valorEconomico: number
}

export type Merma = {
  id: string
  tipoMerma: "Pérdida Física" | "Pérdida en Efectivo Mostrador"
  usuarioNombre: string
  cajaId?: string | null
  fechaHora: string
  observacion?: string
  totalPerdida: number
  items: DetalleMerma[]
}
