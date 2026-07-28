import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../config/dbConfig.js'

export function requireAdmin(req, res, next) {
  const username = req.get('x-admin-username')
  const password = req.get('x-admin-password')

  if (!username || !password) {
    return res.status(401).json({ message: 'Admin authentication required.' })
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials.' })
  }

  next()
}
