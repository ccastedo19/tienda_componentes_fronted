import { apiRequest } from "@/lib/api/client"
import type {
  CreateProductoRequest,
  Producto,
  ProductoSerie,
  UpdateProductoRequest,
} from "@/types/producto"

export async function getProductos(): Promise<Producto[]> {
  return apiRequest<Producto[]>("/productos", {
    method: "GET",
  })
}

export async function getProductoById(id: string): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}`, {
    method: "GET",
  })
}

export async function createProducto(payload: CreateProductoRequest): Promise<Producto> {
  return apiRequest<Producto>("/productos", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateProducto(id: string, payload: UpdateProductoRequest): Promise<Producto> {
  return apiRequest<Producto>(`/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteProducto(id: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/productos/${id}`, {
    method: "DELETE",
  })
}

export async function getSeriesByProducto(productoId: string): Promise<ProductoSerie[]> {
  return apiRequest<ProductoSerie[]>(`/productos/${productoId}/series`, {
    method: "GET",
  })
}

export async function addSerieToProducto(
  productoId: string,
  payload: { numeroSerieAlfanumerico: string; productoId?: string }
): Promise<ProductoSerie> {
  return apiRequest<ProductoSerie>(`/productos/${productoId}/series`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      productoId,
    }),
  })
}
