import { apiRequest } from "@/lib/api/client"
import type { CreateServicioRequest, Servicio } from "@/types/servicio"

export async function getServicios(): Promise<Servicio[]> {
  return apiRequest<Servicio[]>("/servicios", {
    method: "GET",
  })
}

export async function getServicioById(id: string): Promise<Servicio> {
  return apiRequest<Servicio>(`/servicios/${id}`, {
    method: "GET",
  })
}

export async function createServicio(payload: CreateServicioRequest): Promise<Servicio> {
  return apiRequest<Servicio>("/servicios", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateServicio(id: string, payload: CreateServicioRequest): Promise<Servicio> {
  return apiRequest<Servicio>(`/servicios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteServicio(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/servicios/${id}`, {
    method: "DELETE",
  })
}
