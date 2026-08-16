import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

export type SmartComboboxOption = {
  value: string
  label: string
  description?: string
  keywords?: string
}

type SmartComboboxProps = {
  options: SmartComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  showClear?: boolean
  /** Si es true, limpia el valor al hacer focus/click (para buscar más fácil). */
  clearOnFocus?: boolean
  /** Si se define, solo limpia en focus cuando el value actual coincide. */
  clearOnFocusWhen?: string
  onOpenChange?: (open: boolean) => void
}

function optionSearchText(option: SmartComboboxOption) {
  return [option.label, option.description, option.keywords]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function SmartCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  className,
  disabled = false,
  showClear = true,
  clearOnFocus = false,
  clearOnFocusWhen,
  onOpenChange,
}: SmartComboboxProps) {
  const selected =
    options.find((option) => option.value === value) ?? null

  const shouldClearOnInteract = () => {
    if (!value) return false
    if (clearOnFocusWhen) return value === clearOnFocusWhen
    return clearOnFocus
  }

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(next) => {
        onValueChange(next?.value ?? null)
      }}
      onOpenChange={onOpenChange}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(item, query) => {
        if (!query.trim()) return true
        return optionSearchText(item).includes(query.trim().toLowerCase())
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showClear={showClear}
        className={cn("w-full", className)}
        onFocus={() => {
          if (shouldClearOnInteract()) {
            onValueChange(null)
          }
        }}
        onClick={() => {
          if (shouldClearOnInteract()) {
            onValueChange(null)
          }
        }}
      />
      <ComboboxContent className="w-(--anchor-width)">
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{item.label}</span>
                {item.description ? (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                ) : null}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
