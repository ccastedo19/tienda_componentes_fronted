export type Proveedor = {
  id: string
  nombreProveedor: string
  telefono: string
  email?: string | null
  direccion?: string | null
  estado: "Activo" | "Inactivo"
  createdAt?: string
}

export type CreateProveedorRequest = {
  nombreProveedor: string
  telefono: string
  email?: string | null
  direccion?: string | null
  estado?: "Activo" | "Inactivo"
}
