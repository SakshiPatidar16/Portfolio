import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apiRoutes from './routes/apiRoutes.js'
import { initDb } from './db.js'
import { FRONTEND_ORIGIN, PORT } from './config/dbConfig.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')
const projectImagesDir = path.join(uploadsDir, 'projects')
const profileImagesDir = path.join(uploadsDir, 'profile')

fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(projectImagesDir, { recursive: true })
fs.mkdirSync(profileImagesDir, { recursive: true })

const app = express()

app.use(cors({ origin: FRONTEND_ORIGIN }))
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
