import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type DataTableSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: DataTableSearchProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  )
}
