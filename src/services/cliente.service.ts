import { apiRequest } from "@/lib/api/client"
import type { Cliente, CreateClienteRequest, UpdateClienteRequest } from "@/types/cliente"

export async function getClientes(estado?: string, incluirEliminados = false): Promise<Cliente[]> {
  const params = new URLSearchParams()
  if (estado) params.append("estado", estado)
  if (incluirEliminados) params.append("incluirEliminados", "true")
  const query = params.toString() ? `?${params.toString()}` : ""

  return apiRequest<Cliente[]>(`/clientes${query}`, {
    method: "GET",
  })
}

export async function getClienteById(id: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`, {
    method: "GET",
  })
}

export async function findClienteByCi(ci: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/buscar?ci=${encodeURIComponent(ci)}`, {
    method: "GET",
  })
}

export async function createCliente(payload: CreateClienteRequest): Promise<Cliente> {
  return apiRequest<Cliente>("/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateCliente(id: string, payload: UpdateClienteRequest): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deactivateCliente(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/clientes/${id}`, {
    method: "DELETE",
  })
}

export async function changeClienteEstado(id: string, estado: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}/estado?estado=${encodeURIComponent(estado)}`, {
    method: "PATCH",
  })
}
