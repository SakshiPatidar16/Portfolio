export const AUTH_STORAGE_KEY = 'portfolio_admin_auth'

const ADMIN_USERNAME = 'sakshi.ptr7@gmail.com'
const ADMIN_PASSWORD = 'sakshi@3313'

export function getAdminCredentials() {
  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  }
}

export function isAuthenticated() {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  } catch (e) {
    return false
  }
}

export function login(username, password) {
  const ok = username === ADMIN_USERNAME && password === ADMIN_PASSWORD

  if (!ok) {
    return false
  }

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true')
  } catch (e) {}

  return true
}

export function logout() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (e) {}
}
