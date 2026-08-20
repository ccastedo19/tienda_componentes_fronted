export type Caja = {
  id: string
  usuarioId: string
  usuarioNombre: string
  usuarioCierreId?: string | null
  usuarioCierreNombre?: string | null
  fechaHoraApertura: string
  fechaHoraCierre: string | null
  montoInicial: number
  montoEsperado: number
  montoEsperadoEfectivo?: number
  montoEsperadoQr?: number
  recuentoFisico: number | null
  recuentoQr?: number | null
  diferenciaMonto: number
  diferenciaEfectivo?: number
  diferenciaQr?: number
  totalVentasEfectivo?: number
  totalVentasQr?: number
  totalMermasEfectivo?: number
  estado: "Abierta" | "Cerrada" | "Caja Cuadrada" | "Faltante" | "Sobrante"
}

export type AperturaCajaRequest = {
  montoInicial: number
}

export type CierreCajaRequest = {
  recuentoFisico: number
  recuentoQr: number
}
