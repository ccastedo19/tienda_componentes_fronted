import { apiRequest } from "@/lib/api/client"
import type { AperturaCajaRequest, Caja, CierreCajaRequest } from "@/types/caja"

export async function getCajaActiva(): Promise<Caja | null> {
  try {
    return await apiRequest<Caja>("/caja/activa", {
      method: "GET",
    })
  } catch {
    return null
  }
}

export async function abrirCaja(payload: AperturaCajaRequest): Promise<Caja> {
  return apiRequest<Caja>("/caja/apertura", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function cerrarCaja(payload: CierreCajaRequest): Promise<Caja> {
  return apiRequest<Caja>("/caja/cierre", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getAlertasCaja(): Promise<Caja[]> {
  return apiRequest<Caja[]>("/caja/alertas", {
    method: "GET",
  })
}

export async function getHistorialCajas(): Promise<Caja[]> {
  return apiRequest<Caja[]>("/caja/historial", {
    method: "GET",
  })
}
