import dotenv from 'dotenv'

dotenv.config()

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio_db'
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'sakshi.ptr7@gmail.com'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sakshi@3313'
export const PORT = Number(process.env.PORT || 4000)
const rawFrontendOrigins = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

export const FRONTEND_ORIGINS = rawFrontendOrigins
	.split(',')
	.map((s) => String(s || '').trim())
	.filter(Boolean)

export const FRONTEND_ORIGIN = FRONTEND_ORIGINS[0]
export const MAIL_TO = process.env.MAIL_TO || 'sakshi.ptr16@gmail.com'
