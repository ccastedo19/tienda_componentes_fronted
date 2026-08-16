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
import { SmartCombobox } from "@/components/ui/smart-combobox"
import { Textarea } from "@/components/ui/textarea"
import { ApiRequestError } from "@/lib/api/client"
import { uploadImage } from "@/services/cloudinary.service"
import { createProducto, updateProducto } from "@/services/producto.service"
import type { Categoria } from "@/types/categoria"
import type { Producto } from "@/types/producto"

interface ModalProductoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  producto?: Producto | null
  categorias: Categoria[]
  onSuccess: () => void
}

export function ModalProducto({
  open,
  onOpenChange,
  mode,
  producto,
  categorias,
  onSuccess,
}: ModalProductoProps) {
  const [skuUnico, setSkuUnico] = useState("")
  const [nombreComercial, setNombreComercial] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [precioCosto, setPrecioCosto] = useState("0")
  const [precioVenta, setPrecioVenta] = useState("0")
  const [umbralStockMinimo, setUmbralStockMinimo] = useState("5")
  const [stockActual, setStockActual] = useState("0")
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [imagenPublicId, setImagenPublicId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (producto && mode === "edit") {
      setSkuUnico(producto.skuUnico)
      setNombreComercial(producto.nombreComercial)
      setDescripcion(producto.descripcion || "")
      setCategoriaId(producto.categoriaId)
      setPrecioCosto(String(producto.precioCosto))
      setPrecioVenta(String(producto.precioVenta))
      setUmbralStockMinimo(String(producto.umbralStockMinimo))
      setStockActual(String(producto.stockActual))
      setImagenUrl(producto.imagenUrl || null)
      setImagenPublicId(producto.imagenPublicId || null)
    } else {
      setSkuUnico("")
      setNombreComercial("")
      setDescripcion("")
      setCategoriaId(categorias[0]?.id || "")
      setPrecioCosto("0")
      setPrecioVenta("0")
      setUmbralStockMinimo("5")
      setStockActual("0")
      setImagenUrl(null)
      setImagenPublicId(null)
    }
    setError(null)
  }, [producto, mode, categorias, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const res = await uploadImage(file, "productos")
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
    if (!skuUnico.trim() || !nombreComercial.trim() || !categoriaId) {
      setError("SRS-CAT-001: SKU, Nombre Comercial y Categoría son campos obligatorios.")
      return
    }

    const costo = parseFloat(precioCosto)
    const venta = parseFloat(precioVenta)
    const umbral = parseInt(umbralStockMinimo, 10)
    const stock = parseInt(stockActual, 10)

    if (isNaN(costo) || isNaN(venta) || isNaN(umbral)) {
      setError("Valores numéricos de costo, precio o stock inválidos.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "create") {
        await createProducto({
          skuUnico: skuUnico.trim().toUpperCase(),
          nombreComercial: nombreComercial.trim(),
          descripcion: descripcion.trim(),
          categoriaId,
          precioCosto: costo,
          precioVenta: venta,
          umbralStockMinimo: umbral,
          stockActual: isNaN(stock) ? 0 : stock,
          imagenUrl,
          imagenPublicId,
        })
      } else if (producto) {
        await updateProducto(producto.id, {
          nombreComercial: nombreComercial.trim(),
          descripcion: descripcion.trim(),
          categoriaId,
          precioCosto: costo,
          precioVenta: venta,
          umbralStockMinimo: umbral,
          stockActual: isNaN(stock) ? 0 : stock,
          imagenUrl,
          imagenPublicId,
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Error al guardar el producto."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Registrar Artículo en Catálogo" : "Editar Producto"}
          </DialogTitle>
          <DialogDescription>
            SRS-CAT-001: Almacenamiento de especificaciones, costos, precios y umbrales de stock mínimo.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku">Código Único *</Label>
              <Input
                id="sku"
                value={skuUnico}
                onChange={(e) => setSkuUnico(e.target.value.toUpperCase())}
                placeholder="Ej: ESP32-WROOM, CAB-USB-2M"
                disabled={mode === "edit"}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría *</Label>
              <SmartCombobox
                options={categorias.map((c) => ({
                  value: c.id,
                  label: c.nombre,
                  description: c.categoriaPadreNombre ? `Padre: ${c.categoriaPadreNombre}` : "Categoría Principal",
                  keywords: `${c.nombre} ${c.categoriaPadreNombre || ""}`,
                }))}
                value={categoriaId || null}
                onValueChange={(val) => setCategoriaId(val ?? "")}
                placeholder="Buscar categoría..."
                emptyMessage="No se encontraron categorías."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre Comercial *</Label>
            <Input
              id="nombre"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
              placeholder="Ej: Módulo ESP32 Wi-Fi + Bluetooth CP2102"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción Técnica</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Especificaciones, voltaje de operación, pines, etc."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="costo">Precio Costo (Bs.) *</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Bs.
                </span>
                <Input
                  id="costo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venta">Precio Venta (Bs.) *</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Bs.
                </span>
                <Input
                  id="venta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="umbral">Stock Mínimo *</Label>
              <Input
                id="umbral"
                type="number"
                min="0"
                value={umbralStockMinimo}
                onChange={(e) => setUmbralStockMinimo(e.target.value)}
                required
              />
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Inicial (Existencias Físicas)</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
              />
            </div>
          )}

          {/* Cloudinary Image Upload */}
          <div className="space-y-1.5">
            <Label>Imagen del Producto (Cloudinary SRS-CAT-009)</Label>
            {imagenUrl ? (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border">
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
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                {isUploading ? (
                  <span className="text-xs text-muted-foreground">Subiendo imagen a Cloudinary...</span>
                ) : (
                  <>
                    <ImageIcon className="size-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-foreground">Subir imagen</span>
                    <span className="text-[11px] text-muted-foreground">PNG, JPG o WebP</span>
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
              {isLoading ? "Guardando..." : mode === "create" ? "Registrar Producto" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
