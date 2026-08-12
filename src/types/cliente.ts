export type Cliente = {
  id: string
  ci: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  createdAt: string
  updatedAt: string
}

export type CreateClienteRequest = {
  ci: string
  nombre: string
  apellido: string
  telefono: string
  email: string
}
