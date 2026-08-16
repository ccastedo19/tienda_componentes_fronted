export type Caja = {
  id: string
  usuarioId: string
  usuarioNombre: string
  fechaHoraApertura: string
  fechaHoraCierre: string | null
  montoInicial: number
  montoEsperado: number
  recuentoFisico: number | null
  diferenciaMonto: number
  estado: "Abierta" | "Cerrada" | "Caja Cuadrada" | "Faltante" | "Sobrante"
}

export type AperturaCajaRequest = {
  montoInicial: number
}

export type CierreCajaRequest = {
  recuentoFisico: number
}
