import { apiRequest } from "@/lib/api/client"
import { API_BASE_URL } from "@/lib/api/config"
import { getToken } from "@/lib/auth/storage"
import type { CheckoutRequest, Venta } from "@/types/venta"

export async function getVentas(): Promise<Venta[]> {
  return apiRequest<Venta[]>("/ventas", {
    method: "GET",
  })
}

export async function getVentaById(id: string): Promise<Venta> {
  return apiRequest<Venta>(`/ventas/${id}`, {
    method: "GET",
  })
}

export async function procesarCheckout(payload: CheckoutRequest): Promise<Venta> {
  return apiRequest<Venta>("/ventas/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

async function fetchNotaVentaPdfBlob(id: string): Promise<Blob> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/ventas/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error("No se pudo obtener el comprobante de venta")
  }

  return response.blob()
}

export async function getNotaVentaPdfObjectUrl(id: string): Promise<string> {
  const blob = await fetchNotaVentaPdfBlob(id)
  return window.URL.createObjectURL(blob)
}

export async function descargarNotaVentaPdf(id: string, codigo: string): Promise<void> {
  const blob = await fetchNotaVentaPdfBlob(id)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `nota_venta_${codigo}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
