import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  List,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { ModalCategoria } from "@/components/Modal/ModalCategoria"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ApiRequestError } from "@/lib/api/client"
import { deleteCategoria, getCategorias } from "@/services/categoria.service"
import type { Categoria } from "@/types/categoria"

type ViewMode = "lista" | "arbol"

type CategoriaNode = Categoria & {
  children: CategoriaNode[]
}

function buildCategoriaTree(categorias: Categoria[]): CategoriaNode[] {
  const byId = new Map<string, CategoriaNode>()

  for (const c of categorias) {
    byId.set(c.id, { ...c, children: [] })
  }

  const roots: CategoriaNode[] = []

  for (const node of byId.values()) {
    const padreId = node.categoriaPadreId
    if (padreId && byId.has(padreId)) {
      byId.get(padreId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: CategoriaNode[]) => {
    nodes.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    for (const n of nodes) sortNodes(n.children)
  }

  sortNodes(roots)
  return roots
}

function filterTree(nodes: CategoriaNode[], search: string): CategoriaNode[] {
  const q = search.trim().toLowerCase()
  if (!q) return nodes

  const walk = (list: CategoriaNode[]): CategoriaNode[] => {
    const result: CategoriaNode[] = []
    for (const node of list) {
      const children = walk(node.children)
      const matches = node.nombre.toLowerCase().includes(q)
      if (matches || children.length > 0) {
        result.push({ ...node, children })
      }
    }
    return result
  }

  return walk(nodes)
}

function collectExpandableIds(nodes: CategoriaNode[]): Set<string> {
  const ids = new Set<string>()
  const walk = (list: CategoriaNode[]) => {
    for (const n of list) {
      if (n.children.length > 0) {
        ids.add(n.id)
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return ids
}

type TreeRowProps = {
  node: CategoriaNode
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onEdit: (c: Categoria) => void
  onDelete: (c: Categoria) => void
  onAddChild: (c: Categoria) => void
}

function TreeRow({
  node,
  depth,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-1 border-b border-border/60 px-2 py-1.5 last:border-b-0 hover:bg-muted/40",
          depth === 0 && "bg-muted/15"
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
      >
        <button
          type="button"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground",
            hasChildren
              ? "hover:bg-muted hover:text-foreground cursor-pointer"
              : "invisible"
          )}
          onClick={() => hasChildren && onToggle(node.id)}
          aria-label={isExpanded ? "Colapsar" : "Expandir"}
          tabIndex={hasChildren ? 0 : -1}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>

        <FolderTree className="size-3.5 shrink-0 text-muted-foreground" />

        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {node.nombre}
        </span>

        {depth === 0 && (
          <Badge variant="outline" className="hidden shrink-0 text-[10px] sm:inline-flex">
            Raíz
          </Badge>
        )}

        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onAddChild(node)}
            title="Agregar subcategoría"
            className="cursor-pointer text-primary hover:bg-primary/10"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(node)}
            title="Editar categoría"
            className="cursor-pointer"
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(node)}
            title="Eliminar categoría"
            className="cursor-pointer text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </>
  )
}

export const Categorias = () => {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("arbol")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [defaultPadreId, setDefaultPadreId] = useState<string | null>(null)
  const [lockParent, setLockParent] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [catToDelete, setCatToDelete] = useState<Categoria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCategorias = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudieron cargar las categorías. Intenta nuevamente."
      setError(msg)
      setCategorias([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCategorias()
  }, [])

  const tree = useMemo(() => buildCategoriaTree(categorias), [categorias])
  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search])

  useEffect(() => {
    if (search.trim()) {
      setExpandedIds(collectExpandableIds(filteredTree))
    }
  }, [search, filteredTree])

  useEffect(() => {
    if (categorias.length === 0) return
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev
      return new Set(buildCategoriaTree(categorias).map((n) => n.id))
    })
  }, [categorias])

  const handleOpenCreateRoot = () => {
    setSelectedCategoria(null)
    setDefaultPadreId(null)
    setLockParent(true)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenCreateChild = (padre: Categoria) => {
    setSelectedCategoria(null)
    setDefaultPadreId(padre.id)
    setLockParent(true)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenCreateFlexible = () => {
    setSelectedCategoria(null)
    setDefaultPadreId(null)
    setLockParent(false)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: Categoria) => {
    setSelectedCategoria(c)
    setDefaultPadreId(c.categoriaPadreId ?? null)
    setLockParent(false)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirmDelete = async () => {
    if (!catToDelete) return
    setIsDeleting(true)

    try {
      await deleteCategoria(catToDelete.id)
      setCategorias((prev) => prev.filter((c) => c.id !== catToDelete.id))
      setIsDeleteDialogOpen(false)
      setCatToDelete(null)
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Error al eliminar la categoría."
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<Categoria, unknown>[]>(
    () => [
      {
        id: "numero",
        header: "N°",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination
          return pageIndex * pageSize + row.index + 1
        },
        enableSorting: false,
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre de Categoría" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.nombre}</span>
        ),
      },
      {
        accessorKey: "categoriaPadreNombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Jerarquía / Padre" />
        ),
        cell: ({ row }) => {
          const padre = row.original.categoriaPadreNombre
          return padre ? (
            <Badge variant="outline" className="gap-1">
              <FolderTree className="size-3" />
              {padre}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Categoría Principal</span>
          )
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenCreateChild(c)}
                title="Agregar subcategoría"
                className="cursor-pointer text-primary hover:bg-primary/10"
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleOpenEdit(c)}
                title="Editar categoría"
                className="cursor-pointer"
              >
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setCatToDelete(c)
                  setIsDeleteDialogOpen(true)
                }}
                title="Eliminar categoría"
                className="cursor-pointer text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <FolderTree className="size-6" />
          Categorías del Catálogo
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Estructura y clasificación jerárquica de componentes y productos (SRS-CAT-007).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar categoría..."
          />

          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "arbol" ? "secondary" : "ghost"}
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => setViewMode("arbol")}
            >
              <FolderTree className="size-3.5" />
              Árbol
            </Button>
            <Button
              type="button"
              variant={viewMode === "lista" ? "secondary" : "ghost"}
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => setViewMode("lista")}
            >
              <List className="size-3.5" />
              Lista
            </Button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {viewMode === "arbol" ? (
            <Button
              type="button"
              className="w-full cursor-pointer sm:w-auto"
              onClick={handleOpenCreateRoot}
            >
              <Plus className="size-4" />
              Agregar Categoría Principal
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full cursor-pointer sm:w-auto"
              onClick={handleOpenCreateFlexible}
            >
              <Plus className="size-4" />
              Nueva Categoría
            </Button>
          )}
        </div>
      </div>

      <ModalCategoria
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        categoria={selectedCategoria}
        categoriasDisponibles={categorias}
        defaultCategoriaPadreId={defaultPadreId}
        lockParent={lockParent}
        onSuccess={() => void loadCategorias()}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la categoría{" "}
              <strong>{catToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCategorias()}
            className="w-full sm:w-auto"
          >
            Reintentar
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : viewMode === "arbol" ? (
        <div className="overflow-hidden rounded-lg border border-border">
          {filteredTree.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {search.trim()
                ? "No se encontraron categorías con ese criterio."
                : "No hay categorías. Agrega una raíz para comenzar."}
            </div>
          ) : (
            filteredTree.map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggle={handleToggleExpand}
                onEdit={handleOpenEdit}
                onDelete={(c) => {
                  setCatToDelete(c)
                  setIsDeleteDialogOpen(true)
                }}
                onAddChild={handleOpenCreateChild}
              />
            ))
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categorias}
          searchValue={search}
          searchKeys={["nombre", "categoriaPadreNombre"]}
          emptyMessage="No se encontraron categorías registradas."
        />
      )}
    </div>
  )
}
