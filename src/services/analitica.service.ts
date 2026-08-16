import { apiRequest } from "@/lib/api/client"
import type {
  DashboardMetrics,
  ProductividadOperador,
  RentabilidadMetrics,
  RoiTaller,
  StockMuerto,
  ProveedorRendimiento,
  VentaTendencia,
} from "@/types/analitica"

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiRequest<DashboardMetrics>("/analitica/dashboard", {
    method: "GET",
  })
}

export async function getRentabilidad(): Promise<RentabilidadMetrics> {
  return apiRequest<RentabilidadMetrics>("/analitica/rentabilidad", {
    method: "GET",
  })
}

export async function getProductividad(): Promise<ProductividadOperador[]> {
  return apiRequest<ProductividadOperador[]>("/analitica/productividad", {
    method: "GET",
  })
}

export async function getTendenciasVentas(periodo: "dia" | "mes" = "dia"): Promise<VentaTendencia[]> {
  return apiRequest<VentaTendencia[]>(`/analitica/ventas-tendencias?periodo=${periodo}`, {
    method: "GET",
  })
}

export async function getRendimientoProveedores(): Promise<ProveedorRendimiento[]> {
  return apiRequest<ProveedorRendimiento[]>("/analitica/proveedores", {
    method: "GET",
  })
}

export async function getStockMuerto(): Promise<StockMuerto[]> {
  return apiRequest<StockMuerto[]>("/analitica/stock-muerto", {
    method: "GET",
  })
}

export async function getRoiTaller(): Promise<RoiTaller> {
  return apiRequest<RoiTaller>("/analitica/roi-taller", {
    method: "GET",
  })
}
