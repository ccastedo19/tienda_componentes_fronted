export type ApiError = {
  code: string
  message: string
  timestamp: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  message: string
}

export type AuthUser = {
  id: string
  email: string
  username: string
  nombre: string
  apellido: string
  rol: string
  estado: string
}

export type LogoutResponse = {
  status: string
  message: string
}
