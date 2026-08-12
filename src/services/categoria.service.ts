import { apiRequest } from "@/lib/api/client"
import type { Categoria, CreateCategoriaRequest } from "@/types/categoria"

export async function getCategorias(): Promise<Categoria[]> {
  return apiRequest<Categoria[]>("/categorias", {
    method: "GET",
  })
}

export async function getCategoriaById(id: string): Promise<Categoria> {
  return apiRequest<Categoria>(`/categorias/${id}`, {
    method: "GET",
  })
}

export async function createCategoria(payload: CreateCategoriaRequest): Promise<Categoria> {
  return apiRequest<Categoria>("/categorias", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateCategoria(id: string, payload: CreateCategoriaRequest): Promise<Categoria> {
  return apiRequest<Categoria>(`/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteCategoria(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/categorias/${id}`, {
    method: "DELETE",
  })
}
