import { useState, useEffect } from "react"
import { Image as ImageIcon, X } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { uploadImage } from "@/services/cloudinary.service"
import { createServicio, updateServicio } from "@/services/servicio.service"
import type { Servicio } from "@/types/servicio"

interface ModalServicioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  servicio?: Servicio | null
  onSuccess: () => void
}

export function ModalServicio({
  open,
  onOpenChange,
  mode,
  servicio,
  onSuccess,
}: ModalServicioProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioBaseSugerido, setPrecioBaseSugerido] = useState("")
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [imagenPublicId, setImagenPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (servicio && mode === "edit") {
      setNombre(servicio.nombre)
      setDescripcion(servicio.descripcion || "")
      setPrecioBaseSugerido(String(servicio.precioBaseSugerido))
      setImagenUrl(servicio.imagenUrl || null)
      setImagenPublicId(servicio.imagenPublicId || null)
    } else {
      setNombre("")
      setDescripcion("")
      setPrecioBaseSugerido("")
      setImagenUrl(null)
      setImagenPublicId(null)
    }
    setError(null)
  }, [servicio, mode, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const res = await uploadImage(file, "servicios")
      setImagenUrl(res.secure_url || res.url)
      setImagenPublicId(res.public_id)
    } catch {
      setError("No se pudo subir la imagen a Cloudinary.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError("El nombre del servicio es obligatorio.")
      return
    }

    const precio = parseFloat(precioBaseSugerido)
    if (isNaN(precio) || precio < 0) {
      setError("El precio base sugerido debe ser mayor o igual a 0.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "create") {
        await createServicio({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precioBaseSugerido: precio,
          imagenUrl,
          imagenPublicId,
        })
      } else if (servicio) {
        await updateServicio(servicio.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precioBaseSugerido: precio,
          imagenUrl,
          imagenPublicId,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al guardar el servicio."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo Servicio Técnico" : "Editar Servicio Técnico"}
          </DialogTitle>
          <DialogDescription>
            SRS-CAT-005: Registro y mantenimiento de mano de obra y servicios intangibles.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre del Servicio *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mantenimiento, Soldadura"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del servicio..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="precio">Precio Base Sugerido (Bs.) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Bs.
              </span>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={precioBaseSugerido}
                onChange={(e) => setPrecioBaseSugerido(e.target.value)}
                placeholder="0.00"
                className="pl-9"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              SRS-POS-009: Este precio se sugiere por defecto, pero el operador podrá ajustarlo en el carrito de venta.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Imagen del Servicio (Opcional)</Label>
            {imagenUrl ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img src={imagenUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImagenUrl(null)
                    setImagenPublicId(null)
                  }}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-black"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                {isUploading ? (
                  <span className="text-xs text-muted-foreground">Subiendo imagen...</span>
                ) : (
                  <>
                    <ImageIcon className="size-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Subir imagen a Cloudinary</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? "Guardando..." : mode === "create" ? "Crear Servicio" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
