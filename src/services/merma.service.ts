import { apiRequest } from "@/lib/api/client"
import type { CreateMermaRequest, Merma } from "@/types/merma"

export async function getMermas(): Promise<Merma[]> {
  return apiRequest<Merma[]>("/mermas", {
    method: "GET",
  })
}

export async function createMerma(payload: CreateMermaRequest): Promise<Merma> {
  return apiRequest<Merma>("/mermas", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
