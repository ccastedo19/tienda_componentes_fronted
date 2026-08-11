const TOKEN_KEY = "cc_auth_token"
const LEGACY_USER_KEY = "cc_auth_user"

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
