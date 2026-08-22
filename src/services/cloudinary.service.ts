import { API_BASE_URL } from "@/lib/api/config"
import { getToken } from "@/lib/auth/storage"

export type CloudinaryUploadResponse = {
  url: string
  secure_url: string
  public_id: string
  format: string
  resource_type: string
  [key: string]: unknown
}

/**
 * Optimiza/comprime imágenes pesadas (> 1.5MB) en el cliente antes de enviarlas al servidor.
 */
export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1.5 * 1024 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(file)

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        "image/jpeg",
        quality
      )
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

export async function uploadImage(file: File, folder = "productos"): Promise<CloudinaryUploadResponse> {
  const token = getToken()
  const fileToUpload = await compressImageIfNeeded(file)
  const formData = new FormData()
  formData.append("file", fileToUpload)
  formData.append("folder", folder)

  const uploadEndpoint = API_BASE_URL.startsWith("http")
    ? `${API_BASE_URL}/cloudinary/upload`
    : `http://localhost:8080/api/v1/cloudinary/upload`

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    let errorMsg = `Error al subir imagen (${response.status})`
    try {
      const errData = (await response.json()) as { message?: string }
      if (errData?.message) errorMsg = errData.message
    } catch {
      // Ignorar error al parsear JSON
    }
    throw new Error(errorMsg)
  }

  return response.json()
}

export async function deleteImage(publicId: string): Promise<{ result: string }> {
  const token = getToken()
  const deleteEndpoint = API_BASE_URL.startsWith("http")
    ? `${API_BASE_URL}/cloudinary/delete/${encodeURIComponent(publicId)}`
    : `http://localhost:8080/api/v1/cloudinary/delete/${encodeURIComponent(publicId)}`

  const response = await fetch(deleteEndpoint, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    let errorMsg = `Error al eliminar imagen (${response.status})`
    try {
      const errData = (await response.json()) as { message?: string }
      if (errData?.message) errorMsg = errData.message
    } catch {
      // Ignorar error al parsear JSON
    }
    throw new Error(errorMsg)
  }

  return response.json()
}
