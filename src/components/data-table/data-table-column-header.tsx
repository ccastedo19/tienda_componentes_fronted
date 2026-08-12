import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  const handleSort = () => {
    if (sorted === "asc") {
      column.toggleSorting(true)
    } else if (sorted === "desc") {
      column.clearSorting()
    } else {
      column.toggleSorting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 px-2 font-medium", className)}
      onClick={handleSort}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="size-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="size-4" />
      ) : (
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      )}
    </Button>
  )
}