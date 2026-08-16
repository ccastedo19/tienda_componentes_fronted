import { apiRequest } from "@/lib/api/client"
import { API_BASE_URL } from "@/lib/api/config"
import { getToken } from "@/lib/auth/storage"
import type { Cotizacion, CreateCotizacionRequest } from "@/types/cotizacion"

export async function getCotizaciones(): Promise<Cotizacion[]> {
  return apiRequest<Cotizacion[]>("/cotizaciones", {
    method: "GET",
  })
}

export async function getCotizacionById(id: string): Promise<Cotizacion> {
  return apiRequest<Cotizacion>(`/cotizaciones/${id}`, {
    method: "GET",
  })
}

export async function buscarCotizacionesPorCi(ci: string): Promise<Cotizacion[]> {
  return apiRequest<Cotizacion[]>(`/cotizaciones/buscar?ci=${encodeURIComponent(ci)}`, {
    method: "GET",
  })
}

export async function createCotizacion(payload: CreateCotizacionRequest): Promise<Cotizacion> {
  return apiRequest<Cotizacion>("/cotizaciones", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function descargarCotizacionPdf(id: string, codigo: string): Promise<void> {
  const blob = await fetchCotizacionPdfBlob(id)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `proforma_${codigo}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

async function fetchCotizacionPdfBlob(id: string): Promise<Blob> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/cotizaciones/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error("No se pudo obtener el PDF de la cotización")
  }

  return response.blob()
}

export async function getCotizacionPdfObjectUrl(id: string): Promise<string> {
  const blob = await fetchCotizacionPdfBlob(id)
  return window.URL.createObjectURL(blob)
}
