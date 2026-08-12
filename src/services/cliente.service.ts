import { apiRequest } from "@/lib/api/client"
import type { Cliente, CreateClienteRequest } from "@/types/cliente"

export async function getClientes(): Promise<Cliente[]> {
  return apiRequest<Cliente[]>("/clientes", {
    method: "GET",
  })
}

export async function createCliente(
  payload: CreateClienteRequest
): Promise<Cliente> {
  return apiRequest<Cliente>("/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
