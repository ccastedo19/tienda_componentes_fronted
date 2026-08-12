import { apiRequest } from "@/lib/api/client"
import type { Compra, CreateCompraRequest } from "@/types/compra"

export async function getCompras(): Promise<Compra[]> {
  return apiRequest<Compra[]>("/compras", {
    method: "GET",
  })
}

export async function createCompra(payload: CreateCompraRequest): Promise<Compra> {
  return apiRequest<Compra>("/compras", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
