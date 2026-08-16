import { apiRequest } from "@/lib/api/client"
import type { KardexMovimiento } from "@/types/kardex"

export async function getKardexByProducto(productoId: string): Promise<KardexMovimiento[]> {
  return apiRequest<KardexMovimiento[]>(`/kardex/producto/${productoId}`, {
    method: "GET",
  })
}

export async function getKardexGeneral(): Promise<KardexMovimiento[]> {
  return apiRequest<KardexMovimiento[]>("/kardex", {
    method: "GET",
  })
}
