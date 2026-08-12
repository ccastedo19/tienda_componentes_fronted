export type Usuario = {
  id: string
  email: string
  username: string
  nombre: string
  apellido: string
  rol: "Administrador" | "Vendedor"
  estado: number // 0 = Eliminado, 1 = Activo, 2 = Inactivo
  createdAt?: string
}

export type CreateUsuarioRequest = {
  email: string
  password: string
  nombre: string
  apellido: string
  rol: "Administrador" | "Vendedor"
}

export type UpdateUsuarioRequest = {
  nombre?: string
  apellido?: string
  rol?: "Administrador" | "Vendedor"
  estado?: number
}
