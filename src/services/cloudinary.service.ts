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

export async function uploadImage(file: File, folder = "productos"): Promise<CloudinaryUploadResponse> {
  const token = getToken()
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)

  const response = await fetch(`${API_BASE_URL}/cloudinary/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Error al subir imagen a Cloudinary (${response.status})`)
  }

  return response.json()
}

export async function deleteImage(publicId: string): Promise<{ result: string }> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/cloudinary/delete/${encodeURIComponent(publicId)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error(`Error al eliminar imagen de Cloudinary (${response.status})`)
  }

  return response.json()
}
