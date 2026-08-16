import { apiRequest } from "@/lib/api/client"
import type { EmpresaConfig } from "@/types/empresa"

let cachedEmpresaConfig: EmpresaConfig | null = null

export function getCachedEmpresaConfig(): EmpresaConfig | null {
  return cachedEmpresaConfig
}

export async function getEmpresaConfig(): Promise<EmpresaConfig> {
  const data = await apiRequest<EmpresaConfig>("/empresa", {
    method: "GET",
  })
  cachedEmpresaConfig = data
  return data
}

export async function saveEmpresaConfig(config: EmpresaConfig): Promise<EmpresaConfig> {
  const saved = await apiRequest<EmpresaConfig>("/empresa", {
    method: "PUT",
    body: JSON.stringify(config),
  })

  cachedEmpresaConfig = saved
  window.dispatchEvent(new CustomEvent("empresa-config-changed", { detail: saved }))
  return saved
}
