import { apiRequest } from "@/lib/api/client"
import type { CreateProveedorRequest, Proveedor } from "@/types/proveedor"

export async function getProveedores(): Promise<Proveedor[]> {
  return apiRequest<Proveedor[]>("/proveedores", {
    method: "GET",
  })
}

export async function getProveedorById(id: string): Promise<Proveedor> {
  return apiRequest<Proveedor>(`/proveedores/${id}`, {
    method: "GET",
  })
}

export async function createProveedor(payload: CreateProveedorRequest): Promise<Proveedor> {
  return apiRequest<Proveedor>("/proveedores", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateProveedor(
  id: string,
  payload: CreateProveedorRequest
): Promise<Proveedor> {
  return apiRequest<Proveedor>(`/proveedores/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteProveedor(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/proveedores/${id}`, {
    method: "DELETE",
  })
}

export async function changeProveedorStatus(
  id: string,
  estado: "Activo" | "Inactivo"
): Promise<Proveedor> {
  return apiRequest<Proveedor>(`/proveedores/${id}/estado?estado=${estado}`, {
    method: "PATCH",
  })
}
