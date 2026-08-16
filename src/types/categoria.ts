export type Categoria = {
  id: string
  nombre: string
  categoriaPadreId?: string | null
  categoriaPadreNombre?: string | null
}

export type CreateCategoriaRequest = {
  nombre: string
  categoriaPadreId?: string | null
}
