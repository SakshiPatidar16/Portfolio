import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  addSkill,
  addProject,
  deleteProfileImage,
  deleteSkill,
  deleteProject,
  deleteResume,
  getProfileImage,
  getSkillGroups,
  getProjectGroups,
  getResume,
  initDb,
  upsertProfileImage,
  updateProject,
  upsertResume
} from './db.js'
import { requireAdmin } from './auth.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 4000)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')
const projectImagesDir = path.join(uploadsDir, 'projects')
const profileImagesDir = path.join(uploadsDir, 'profile')

fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(projectImagesDir, { recursive: true })
fs.mkdirSync(profileImagesDir, { recursive: true })

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf'
      const safeBase = path
        .basename(file.originalname || 'resume', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 80) || 'resume'
      cb(null, `${Date.now()}-${safeBase}${ext}`)
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf'
    const isPdfExt = path.extname(file.originalname || '').toLowerCase() === '.pdf'
    if (isPdfMime && isPdfExt) return cb(null, true)
    return cb(new Error('Only PDF files are allowed.'))
  }
})

const projectImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, projectImagesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
      const safeBase = path
        .basename(file.originalname || 'project-image', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 80) || 'project-image'
      cb(null, `${Date.now()}-${safeBase}${ext}`)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = path.extname(file.originalname || '').toLowerCase()

    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
      return cb(null, true)
    }

    return cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.'))
  }
})

const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileImagesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
      const safeBase = path
        .basename(file.originalname || 'profile-image', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 80) || 'profile-image'
      cb(null, `${Date.now()}-${safeBase}${ext}`)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = path.extname(file.originalname || '').toLowerCase()

    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
      return cb(null, true)
    }

    return cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.'))
  }
})

app.use(cors({ origin: frontendOrigin }))
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/resume', async (_req, res) => {
  const resume = await getResume()
  res.json({ resume })
})

app.get('/api/profile-image', async (_req, res) => {
  const profileImage = await getProfileImage()
  res.json({ profileImage })
})

app.post('/api/profile-image', requireAdmin, (req, res) => {
  profileImageUpload.single('profileImage')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Profile image upload failed.' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Profile image file is required.' })
    }

    try {
      const existing = await getProfileImage()
      const saved = await upsertProfileImage({
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        urlPath: `/uploads/profile/${req.file.filename}`
      })

      if (existing && existing.storedName && existing.storedName !== req.file.filename) {
        const oldPath = path.join(profileImagesDir, existing.storedName)
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      return res.status(201).json({ profileImage: saved })
    } catch (saveError) {
      const newPath = path.join(profileImagesDir, req.file.filename)
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath)
      }
      return res.status(500).json({ message: 'Could not save profile image.' })
    }
  })
})

app.delete('/api/profile-image', requireAdmin, async (_req, res) => {
  const removed = await deleteProfileImage()
  if (!removed) {
    return res.status(404).json({ message: 'No profile image found.' })
  }

  const imagePath = path.join(profileImagesDir, removed.storedName)
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath)
  }

  return res.status(204).send()
})

app.post('/api/resume', requireAdmin, (req, res) => {
  resumeUpload.single('resume')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Resume upload failed.' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' })
    }

    try {
      const existing = await getResume()
      const saved = await upsertResume({
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        urlPath: `/uploads/${req.file.filename}`
      })

      if (existing && existing.storedName && existing.storedName !== req.file.filename) {
        const oldPath = path.join(uploadsDir, existing.storedName)
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      return res.status(201).json({ resume: saved })
    } catch (saveError) {
      const newPath = path.join(uploadsDir, req.file.filename)
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath)
      }
      return res.status(500).json({ message: 'Could not save resume.' })
    }
  })
})

app.delete('/api/resume', requireAdmin, async (_req, res) => {
  const removed = await deleteResume()
  if (!removed) {
    return res.status(404).json({ message: 'No resume found.' })
  }

  const resumePath = path.join(uploadsDir, removed.storedName)
  if (fs.existsSync(resumePath)) {
    fs.unlinkSync(resumePath)
  }

  return res.status(204).send()
})

app.get('/api/projects', async (_req, res) => {
  const groups = await getProjectGroups()
  res.json(groups)
})

app.get('/api/skills', async (_req, res) => {
  const groups = await getSkillGroups()
  res.json(groups)
})

app.post('/api/skills', requireAdmin, async (req, res) => {
  const { groupTitle, name } = req.body || {}

  const safeGroupTitle = typeof groupTitle === 'string' ? groupTitle.trim() : ''
  const safeName = typeof name === 'string' ? name.trim() : ''

  if (!safeGroupTitle || !safeName) {
    return res.status(400).json({ message: 'groupTitle and name are required.' })
  }

  const skillId = await addSkill({
    groupTitle: safeGroupTitle,
    name: safeName
  })

  res.status(201).json({ id: skillId })
})

app.delete('/api/skills/:id', requireAdmin, async (req, res) => {
  const skillId = String(req.params.id)

  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    return res.status(400).json({ message: 'Invalid skill id.' })
  }

  const result = await deleteSkill(skillId)

  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Skill not found.' })
  }

  return res.status(204).send()
})

app.post('/api/projects', requireAdmin, (req, res) => {
  projectImageUpload.single('image')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Project image upload failed.' })
    }

    const { groupTitle, title, desc, link, stack, caseStudy } = req.body || {}

    const safeGroupTitle = typeof groupTitle === 'string' ? groupTitle.trim() : ''
    const safeTitle = typeof title === 'string' ? title.trim() : ''
    const safeDesc = typeof desc === 'string' ? desc.trim() : ''
    const safeLink = typeof link === 'string' ? link.trim() : '#'

    if (!safeGroupTitle || !safeTitle || !safeDesc) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    const groupKind = safeGroupTitle === 'Company Projects' ? 'Company' : 'Self'

    let safeStack = []
    if (typeof stack === 'string' && stack.trim()) {
      try {
        const parsed = JSON.parse(stack)
        if (Array.isArray(parsed)) {
          safeStack = parsed.map((item) => String(item).trim()).filter(Boolean)
        }
      } catch (_e) {}
    }

    let safeCaseStudy = []
    if (typeof caseStudy === 'string' && caseStudy.trim()) {
      try {
        const parsed = JSON.parse(caseStudy)
        if (Array.isArray(parsed)) {
          safeCaseStudy = parsed.map((item) => String(item).trim()).filter(Boolean)
        }
      } catch (_e) {}
    }

    try {
      const projectId = await addProject({
        groupTitle: safeGroupTitle,
        groupKind,
        title: safeTitle,
        desc: safeDesc,
        link: safeLink || '#',
        imageUrl: req.file ? `/uploads/projects/${req.file.filename}` : '',
        imageStoredName: req.file ? req.file.filename : '',
        stack: safeStack.length ? safeStack : ['React.js'],
        caseStudy: safeCaseStudy.length ? safeCaseStudy : ['Project details will be added soon.']
      })

      return res.status(201).json({ id: projectId })
    } catch (saveError) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(500).json({ message: 'Could not save project.' })
    }
  })
})

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  const projectId = String(req.params.id)

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: 'Invalid project id.' })
  }

  const removed = await deleteProject(projectId)

  if (!removed) {
    return res.status(404).json({ message: 'Project not found.' })
  }

  if (removed.imageStoredName) {
    const imagePath = path.join(projectImagesDir, removed.imageStoredName)
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
  }

  return res.status(204).send()
})

app.put('/api/projects/:id', requireAdmin, (req, res) => {
  projectImageUpload.single('image')(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Project image upload failed.' })
    }

    const projectId = String(req.params.id)
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'Invalid project id.' })
    }

    const { groupTitle, title, desc, link, stack, caseStudy } = req.body || {}
    const safeGroupTitle = typeof groupTitle === 'string' ? groupTitle.trim() : ''
    const safeTitle = typeof title === 'string' ? title.trim() : ''
    const safeDesc = typeof desc === 'string' ? desc.trim() : ''
    const safeLink = typeof link === 'string' ? link.trim() : '#'

    if (!safeGroupTitle || !safeTitle || !safeDesc) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    const groupKind = safeGroupTitle === 'Company Projects' ? 'Company' : 'Self'

    let safeStack = []
    if (typeof stack === 'string' && stack.trim()) {
      try {
        const parsed = JSON.parse(stack)
        if (Array.isArray(parsed)) {
          safeStack = parsed.map((item) => String(item).trim()).filter(Boolean)
        }
      } catch (_e) {}
    }

    let safeCaseStudy = []
    if (typeof caseStudy === 'string' && caseStudy.trim()) {
      try {
        const parsed = JSON.parse(caseStudy)
        if (Array.isArray(parsed)) {
          safeCaseStudy = parsed.map((item) => String(item).trim()).filter(Boolean)
        }
      } catch (_e) {}
    }

    try {
      const updated = await updateProject(projectId, {
        groupTitle: safeGroupTitle,
        groupKind,
        title: safeTitle,
        desc: safeDesc,
        link: safeLink || '#',
        imageUrl: req.file ? `/uploads/projects/${req.file.filename}` : '',
        imageStoredName: req.file ? req.file.filename : '',
        stack: safeStack.length ? safeStack : ['React.js'],
        caseStudy: safeCaseStudy.length ? safeCaseStudy : ['Project details will be added soon.']
      })

      if (!updated) {
        if (req.file) {
          const newPath = path.join(projectImagesDir, req.file.filename)
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
        }
        return res.status(404).json({ message: 'Project not found.' })
      }

      if (req.file && updated.previousImageStoredName && updated.previousImageStoredName !== req.file.filename) {
        const oldPath = path.join(projectImagesDir, updated.previousImageStoredName)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }

      return res.status(200).json({ id: updated.id })
    } catch (saveError) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(500).json({ message: 'Could not update project.' })
    }
  })
})

async function start() {
  try {
    await initDb()
    app.listen(port, () => {
      console.log(`Backend API running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start backend:', error)
    process.exit(1)
  }
}

start()
