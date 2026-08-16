export type KardexMovimiento = {
  id: string
  productoId: string
  usuarioNombre?: string
  fechaHora: string
  tipoMovimiento: string
  cantidad: number
  saldoExistencias: number
}
