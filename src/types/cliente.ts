export type Cliente = {
  id: string
  ci: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  estado?: "Activo" | "Inactivo" | "Eliminado" | string
  createdAt: string
  updatedAt: string
}

export type CreateClienteRequest = {
  ci: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
}

export type UpdateClienteRequest = Partial<CreateClienteRequest> & {
  estado?: string
}
