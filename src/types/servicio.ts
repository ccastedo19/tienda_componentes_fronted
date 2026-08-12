export type Servicio = {
  id: string
  nombre: string
  descripcion: string
  precioBaseSugerido: number
  imagenUrl?: string | null
  imagenPublicId?: string | null
}

export type CreateServicioRequest = {
  nombre: string
  descripcion?: string
  precioBaseSugerido: number
  imagenUrl?: string | null
  imagenPublicId?: string | null
}
