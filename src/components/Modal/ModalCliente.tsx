import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiRequestError } from "@/lib/api/client"
import { createCliente, updateCliente } from "@/services/cliente.service"
import type { Cliente } from "@/types/cliente"

type ModalClienteMode = "create" | "edit"

type FormValues = {
  ci: string
  nombre: string
  apellido: string
  telefono: string
  email: string
}

type FormErrors = Partial<Record<keyof FormValues | "api", string>>

type ModalClienteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: ModalClienteMode
  cliente?: Cliente | null
  onSuccess?: (cliente: Cliente) => void
}

const EMPTY_FORM: FormValues = {
  ci: "",
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.ci.trim()) {
    errors.ci = "La CI es obligatoria"
  }

  if (!values.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio"
  }

  if (!values.apellido.trim()) {
    errors.apellido = "El apellido es obligatorio"
  }

  const telefono = values.telefono.trim()
  if (telefono && telefono.length < 7) {
    errors.telefono = "El teléfono debe tener al menos 7 caracteres"
  }

  return errors
}

export function ModalCliente({
  open,
  onOpenChange,
  mode = "create",
  cliente = null,
  onSuccess,
}: ModalClienteProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEdit = mode === "edit"

  useEffect(() => {
    if (!open) {
      return
    }

    if (isEdit && cliente) {
      setValues({
        ci: cliente.ci || "",
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
      })
    } else {
      setValues(EMPTY_FORM)
    }

    setErrors({})
    setIsSubmitting(false)
  }, [open, isEdit, cliente])

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      api: undefined,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isEdit && cliente) {
        const updated = await updateCliente(cliente.id, {
          ci: values.ci.trim(),
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          telefono: values.telefono.trim(),
          email: values.email.trim().toLowerCase(),
        })
        onSuccess?.(updated)
      } else {
        const created = await createCliente({
          ci: values.ci.trim(),
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          telefono: values.telefono.trim(),
          email: values.email.trim().toLowerCase(),
        })
        onSuccess?.(created)
      }
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : isEdit
          ? "No se pudo actualizar el cliente. Intenta nuevamente."
          : "No se pudo crear el cliente. Intenta nuevamente."

      setErrors({ api: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del cliente seleccionado."
              : "Completa los datos para registrar un nuevo cliente en el sistema."}
          </DialogDescription>
        </DialogHeader>

        {errors.api && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{errors.api}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="cliente-ci">Cédula de Identidad (CI) *</Label>
            <Input
              id="cliente-ci"
              name="ci"
              value={values.ci}
              placeholder="Ej: 8654153"
              onChange={(event) => updateField("ci", event.target.value)}
              required
            />
            {errors.ci && <p className="text-xs text-destructive">{errors.ci}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cliente-nombre">Nombre *</Label>
              <Input
                id="cliente-nombre"
                name="nombre"
                value={values.nombre}
                placeholder="Nombre"
                onChange={(event) => updateField("nombre", event.target.value)}
                required
              />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cliente-apellido">Apellido *</Label>
              <Input
                id="cliente-apellido"
                name="apellido"
                value={values.apellido}
                placeholder="Apellido"
                onChange={(event) => updateField("apellido", event.target.value)}
                required
              />
              {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-telefono">Teléfono</Label>
            <Input
              id="cliente-telefono"
              name="telefono"
              value={values.telefono}
              placeholder="Ej: 71234567"
              onChange={(event) => updateField("telefono", event.target.value)}
            />
            {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-email">Correo Electrónico</Label>
            <Input
              id="cliente-email"
              name="email"
              type="email"
              value={values.email}
              placeholder="cliente@ejemplo.com"
              onChange={(event) => updateField("email", event.target.value)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button
              className="cursor-pointer"
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button className="cursor-pointer" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Guardando..."
                  : "Creando..."
                : isEdit
                ? "Guardar Cambios"
                : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
