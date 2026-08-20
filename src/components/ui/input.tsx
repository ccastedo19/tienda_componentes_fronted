import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function isNumericZero(value: unknown) {
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return value === 0
  const normalized = String(value).trim().replace(",", ".")
  if (normalized === "") return false
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed === 0
}

function Input({
  className,
  type,
  onFocus,
  onClick,
  onChange,
  value,
  ...props
}: React.ComponentProps<"input">) {
  const clearZeroIfNeeded = (
    event: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>
  ) => {
    if (type !== "number") return

    const currentValue =
      value !== undefined ? value : event.currentTarget.value

    if (!isNumericZero(currentValue)) return

    // Vacía el campo para que el usuario escriba el número directo
    if (onChange) {
      onChange({
        ...event,
        target: { ...event.target, value: "" },
        currentTarget: { ...event.currentTarget, value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    } else {
      event.currentTarget.value = ""
    }
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      value={value}
      onChange={onChange}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onFocus={(event) => {
        clearZeroIfNeeded(event)
        onFocus?.(event)
      }}
      onClick={(event) => {
        clearZeroIfNeeded(event)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export { Input }
