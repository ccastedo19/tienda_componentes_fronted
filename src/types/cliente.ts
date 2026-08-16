export type Cliente = {
  id: string
  ci?: string | null
  nombre: string
  apellido: string
  telefono?: string | null
  email?: string | null
  estado?: "Activo" | "Inactivo" | "Eliminado" | string
  createdAt: string
  updatedAt: string
}

export type CreateClienteRequest = {
  ci?: string | null
  nombre: string
  apellido: string
  telefono?: string | null
  email?: string | null
}

export type UpdateClienteRequest = Partial<CreateClienteRequest> & {
  estado?: string
}
