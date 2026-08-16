import { apiRequest } from "@/lib/api/client"
import type { CreateOrdenTecnicaRequest, OrdenTecnica } from "@/types/ordenTecnica"

export async function getOrdenesTecnicas(): Promise<OrdenTecnica[]> {
  return apiRequest<OrdenTecnica[]>("/ordenes-tecnicas", {
    method: "GET",
  })
}

export async function getOrdenTecnicaById(id: string): Promise<OrdenTecnica> {
  return apiRequest<OrdenTecnica>(`/ordenes-tecnicas/${id}`, {
    method: "GET",
  })
}

export async function createOrdenTecnica(payload: CreateOrdenTecnicaRequest): Promise<OrdenTecnica> {
  return apiRequest<OrdenTecnica>("/ordenes-tecnicas", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateOrdenTecnicaEstado(
  id: string,
  nuevoEstado: "Pendiente" | "En Proceso" | "Finalizada" | "Cancelada"
): Promise<OrdenTecnica> {
  return apiRequest<OrdenTecnica>(`/ordenes-tecnicas/${id}/estado?nuevoEstado=${nuevoEstado}`, {
    method: "PATCH",
  })
}

export async function updateOrdenTecnicaTecnico(
  id: string,
  tecnicoId: string | null
): Promise<OrdenTecnica> {
  const query = tecnicoId ? `?tecnicoId=${encodeURIComponent(tecnicoId)}` : ""
  return apiRequest<OrdenTecnica>(`/ordenes-tecnicas/${id}/tecnico${query}`, {
    method: "PATCH",
  })
}
