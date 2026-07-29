import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apiRoutes from './routes/apiRoutes.js'
import { initDb } from './db.js'
import { FRONTEND_ORIGINS, PORT } from './config/dbConfig.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')
const projectImagesDir = path.join(uploadsDir, 'projects')
const profileImagesDir = path.join(uploadsDir, 'profile')

fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(projectImagesDir, { recursive: true })
fs.mkdirSync(profileImagesDir, { recursive: true })

const app = express()

// Configure CORS to support multiple allowed origins via FRONTEND_ORIGINS env
const allowedOrigins = Array.isArray(FRONTEND_ORIGINS) ? FRONTEND_ORIGINS : [String(FRONTEND_ORIGINS || '')]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server or curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('CORS policy: This origin is not allowed'))
    }
  })
)
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))
app.use(apiRoutes)

async function start() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`Backend API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start backend:', error)
    process.exit(1)
  }
}

start()
