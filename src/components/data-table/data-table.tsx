import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchKeys?: (keyof TData)[]
  pageSizeOptions?: number[]
  emptyMessage?: string
  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  searchValue = "",
  searchKeys,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  emptyMessage = "No se encontraron registros.",
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const filteredData = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    if (!query) {
      return data
    }

    return data.filter((row) => {
      if (searchKeys?.length) {
        return searchKeys.some((key) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(query)
        )
      }

      return Object.values(row as Record<string, unknown>).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      )
    })
  }, [data, searchKeys, searchValue])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSizeOptions[0] ?? 10,
      },
    },
  })

  const pageSize = table.getState().pagination.pageSize
  const pageIndex = table.getState().pagination.pageIndex
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const pageEnd = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalRows === 0
            ? "0 registros"
            : `Mostrando ${pageStart}-${pageEnd} de ${totalRows} registros`}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              Filas por página
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Primera página"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-24 text-center text-sm">
              Página {pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Última página"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
