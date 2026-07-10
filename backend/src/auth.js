export function requireAdmin(req, res, next) {
  const username = req.get('x-admin-username')
  const password = req.get('x-admin-password')

  const expectedUsername = process.env.ADMIN_USERNAME || ''
  const expectedPassword = process.env.ADMIN_PASSWORD || ''

  if (!username || !password) {
    return res.status(401).json({ message: 'Admin authentication required.' })
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({ message: 'Invalid admin credentials.' })
  }

  next()
}
