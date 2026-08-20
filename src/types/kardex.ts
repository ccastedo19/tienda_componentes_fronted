export type KardexMovimiento = {
  id: string
  productoId: string
  productoNombre?: string
  usuarioNombre?: string
  fechaHora: string
  tipoMovimiento: string
  cantidad: number
  saldoExistencias: number
  costoUnitario?: number
  costoTotal?: number
}
