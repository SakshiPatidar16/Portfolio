import dotenv from 'dotenv'

dotenv.config()

export const DEFAULT_ADMIN_USERNAME = 'sakshi.ptr7@gmail.com'
export const DEFAULT_ADMIN_PASSWORD = 'sakshi@3313'

export function getExpectedAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  }
}

export function requireAdmin(req, res, next) {
  const username = req.get('x-admin-username')
  const password = req.get('x-admin-password')
  const { username: expectedUsername, password: expectedPassword } = getExpectedAdminCredentials()

  if (!username || !password) {
    return res.status(401).json({ message: 'Admin authentication required.' })
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid admin credentials.' })
  }

  next()
}
