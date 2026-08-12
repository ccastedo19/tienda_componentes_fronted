import { apiRequest } from "@/lib/api/client"
import type { Cliente, CreateClienteRequest } from "@/types/cliente"

export async function getClientes(estado?: string): Promise<Cliente[]> {
  const query = estado ? `?estado=${estado}` : ""
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

export async function updateCliente(id: string, payload: Partial<CreateClienteRequest> & { estado?: string }): Promise<Cliente> {
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
