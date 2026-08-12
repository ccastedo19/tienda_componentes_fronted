import { useEffect, useState } from "react"

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
import { createCliente } from "@/services/cliente.service"
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
  if (telefono && telefono.length < 8) {
    errors.telefono = "El teléfono debe tener al menos 8 caracteres"
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
        ci: cliente.ci,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: cliente.telefono,
        email: cliente.email,
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

    if (isEdit) {
      setErrors({
        api: "La edición de clientes aún no está disponible.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createCliente({
        ci: values.ci.trim(),
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        telefono: values.telefono.trim(),
        email: values.email.trim(),
      })

      onSuccess?.(created)
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
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
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos del cliente seleccionado."
              : "Completa los datos para registrar un nuevo cliente."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {errors.api ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.api}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className="mb-1.5" htmlFor="cliente-ci">CI</Label>
            <Input
              className="mb-1"
              id="cliente-ci"
              name="ci"
              value={values.ci}
              aria-invalid={!!errors.ci}
              placeholder="Ej. 8654153"
              onChange={(event) => updateField("ci", event.target.value)}
            />
            {errors.ci ? (
              <p className="text-sm text-destructive">{errors.ci}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="mb-1.5" htmlFor="cliente-nombre">Nombre</Label>
              <Input
                className="mb-1"
                id="cliente-nombre"
                name="nombre"
                value={values.nombre}
                aria-invalid={!!errors.nombre}
                placeholder="Nombre"
                onChange={(event) => updateField("nombre", event.target.value)}
              />
              {errors.nombre ? (
                <p className="text-sm text-destructive">{errors.nombre}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="mb-1.5" htmlFor="cliente-apellido">Apellido</Label>
              <Input
                className="mb-1"
                id="cliente-apellido"
                name="apellido"
                value={values.apellido}
                aria-invalid={!!errors.apellido}
                placeholder="Apellido"
                onChange={(event) =>
                  updateField("apellido", event.target.value)
                }
              />
              {errors.apellido ? (
                <p className="text-sm text-destructive">{errors.apellido}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="mb-1.5" htmlFor="cliente-telefono">Teléfono</Label>
            <Input
              id="cliente-telefono"
              name="telefono"
              value={values.telefono}
              aria-invalid={!!errors.telefono}
              placeholder="Opcional"
              onChange={(event) => updateField("telefono", event.target.value)}
            />
            {errors.telefono ? (
              <p className="text-sm text-destructive">{errors.telefono}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="mb-1.5" htmlFor="cliente-email">Correo</Label>
            <Input
              id="cliente-email"
              name="email"
              type="email"
              value={values.email}
              aria-invalid={!!errors.email}
              placeholder="Opcional"
              onChange={(event) => updateField("email", event.target.value)}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email}</p>
            ) : null}
          </div>

          <DialogFooter className="pt-2 pb-2">
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
                  ? "Guardar cambios"
                  : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
