import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
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
  upsertProfileImage,
  updateProject,
  upsertResume
} from '../db.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { MAIL_TO } from '../config/dbConfig.js'

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
const projectImagesDir = path.join(uploadsDir, 'projects')
const profileImagesDir = path.join(uploadsDir, 'profile')

fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(projectImagesDir, { recursive: true })
fs.mkdirSync(profileImagesDir, { recursive: true })

function safeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeJsonArray(value) {
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
  } catch (_e) {
    return []
  }
}

function fileStorage(destinationDir, defaultExt) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destinationDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || defaultExt
      const safeBase = path
        .basename(file.originalname || 'upload', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 80) || 'upload'
      cb(null, `${Date.now()}-${safeBase}${ext}`)
    }
  })
}

const resumeUpload = multer({
  storage: fileStorage(uploadsDir, '.pdf'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    if (file.mimetype === 'application/pdf' && ext === '.pdf') return cb(null, true)
    cb(new Error('Only PDF files are allowed.'))
  }
})

const projectImageUpload = multer({
  storage: fileStorage(projectImagesDir, '.jpg'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = path.extname(file.originalname || '').toLowerCase()
    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) return cb(null, true)
    cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.'))
  }
})

const profileImageUpload = multer({
  storage: fileStorage(profileImagesDir, '.jpg'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = path.extname(file.originalname || '').toLowerCase()
    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) return cb(null, true)
    cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.'))
  }
})

function createProjectData(body, file) {
  const groupTitle = safeString(body?.groupTitle)
  const title = safeString(body?.title)
  const desc = safeString(body?.desc)
  const link = safeString(body?.link) || '#'

  return {
    groupTitle,
    title,
    desc,
    link,
    groupKind: groupTitle === 'Company Projects' ? 'Company' : 'Self',
    imageUrl: file ? `/uploads/projects/${file.filename}` : '',
    imageStoredName: file ? file.filename : '',
    stack: safeJsonArray(body?.stack).length ? safeJsonArray(body?.stack) : ['React.js'],
    caseStudy: safeJsonArray(body?.caseStudy).length ? safeJsonArray(body?.caseStudy) : ['Project details will be added soon.']
  }
}

router.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

router.get('/api/resume', async (_req, res) => {
  const resume = await getResume()
  res.json({ resume })
})

router.get('/api/profile-image', async (_req, res) => {
  const profileImage = await getProfileImage()
  res.json({ profileImage })
})

router.post('/api/profile-image', requireAdmin, (req, res) => {
  profileImageUpload.single('profileImage')(req, res, async (error) => {
    if (error) return res.status(400).json({ message: error.message || 'Profile image upload failed.' })
    if (!req.file) return res.status(400).json({ message: 'Profile image file is required.' })

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
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }

      res.status(201).json({ profileImage: saved })
    } catch (_saveError) {
      const newPath = path.join(profileImagesDir, req.file.filename)
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      res.status(500).json({ message: 'Could not save profile image.' })
    }
  })
})

router.delete('/api/profile-image', requireAdmin, async (_req, res) => {
  const removed = await deleteProfileImage()
  if (!removed) return res.status(404).json({ message: 'No profile image found.' })

  const imagePath = path.join(profileImagesDir, removed.storedName)
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)

  res.status(204).send()
})

router.post('/api/resume', requireAdmin, (req, res) => {
  resumeUpload.single('resume')(req, res, async (error) => {
    if (error) return res.status(400).json({ message: error.message || 'Resume upload failed.' })
    if (!req.file) return res.status(400).json({ message: 'Resume file is required.' })

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
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }

      res.status(201).json({ resume: saved })
    } catch (_saveError) {
      const newPath = path.join(uploadsDir, req.file.filename)
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      res.status(500).json({ message: 'Could not save resume.' })
    }
  })
})

router.delete('/api/resume', requireAdmin, async (_req, res) => {
  const removed = await deleteResume()
  if (!removed) return res.status(404).json({ message: 'No resume found.' })

  const resumePath = path.join(uploadsDir, removed.storedName)
  if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath)

  res.status(204).send()
})

router.get('/api/projects', async (_req, res) => {
  const groups = await getProjectGroups()
  res.json(groups)
})

router.get('/api/skills', async (_req, res) => {
  const groups = await getSkillGroups()
  res.json(groups)
})

router.post('/api/skills', requireAdmin, async (req, res) => {
  const groupTitle = safeString(req.body?.groupTitle)
  const name = safeString(req.body?.name)
  if (!groupTitle || !name) return res.status(400).json({ message: 'groupTitle and name are required.' })
  const skillId = await addSkill({ groupTitle, name })
  res.status(201).json({ id: skillId })
})

router.delete('/api/skills/:id', requireAdmin, async (req, res) => {
  const skillId = safeString(req.params.id)
  if (!skillId) return res.status(400).json({ message: 'Invalid skill id.' })
  const result = await deleteSkill(skillId)
  if (!result.deletedCount) return res.status(404).json({ message: 'Skill not found.' })
  res.status(204).send()
})

router.post('/api/projects', requireAdmin, (req, res) => {
  projectImageUpload.single('image')(req, res, async (error) => {
    if (error) return res.status(400).json({ message: error.message || 'Project image upload failed.' })

    const projectData = createProjectData(req.body, req.file)
    if (!projectData.groupTitle || !projectData.title || !projectData.desc) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    try {
      const projectId = await addProject(projectData)
      res.status(201).json({ id: projectId })
    } catch (_saveError) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      res.status(500).json({ message: 'Could not save project.' })
    }
  })
})

router.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  const projectId = safeString(req.params.id)
  if (!projectId) return res.status(400).json({ message: 'Invalid project id.' })
  const removed = await deleteProject(projectId)
  if (!removed) return res.status(404).json({ message: 'Project not found.' })

  if (removed.imageStoredName) {
    const imagePath = path.join(projectImagesDir, removed.imageStoredName)
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath)
  }

  res.status(204).send()
})

router.put('/api/projects/:id', requireAdmin, (req, res) => {
  projectImageUpload.single('image')(req, res, async (error) => {
    if (error) return res.status(400).json({ message: error.message || 'Project image upload failed.' })

    const projectId = safeString(req.params.id)
    if (!projectId) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'Invalid project id.' })
    }

    const projectData = createProjectData(req.body, req.file)
    if (!projectData.groupTitle || !projectData.title || !projectData.desc) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    try {
      const updated = await updateProject(projectId, projectData)
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

      res.status(200).json({ id: updated.id })
    } catch (_saveError) {
      if (req.file) {
        const newPath = path.join(projectImagesDir, req.file.filename)
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
      }
      res.status(500).json({ message: 'Could not update project.' })
    }
  })
})

router.post('/api/contact', async (req, res) => {
  const safeName = safeString(req.body?.name)
  const safeEmail = safeString(req.body?.email)
  const safePhone = safeString(req.body?.phone)
  const safeCompany = safeString(req.body?.company)
  const safeRole = safeString(req.body?.role)
  const safeLocation = safeString(req.body?.location)
  const safeMessage = safeString(req.body?.message)

  if (!safeEmail) {
    return res.status(400).json({ message: 'Email is required.' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(safeEmail)) {
    return res.status(400).json({ message: 'Invalid email address.' })
  }

  const gmailUser = process.env.GMAIL_USER || ''
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || ''
  const mailTo = MAIL_TO

  if (!gmailUser || !gmailAppPassword || !mailTo) {
    return res.status(500).json({ message: 'Email configuration is missing. Please set GMAIL_USER, GMAIL_APP_PASSWORD, and MAIL_TO.' })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword }
    })

    await transporter.sendMail({
      from: `"Portfolio Contact" <${gmailUser}>`,
      to: mailTo,
      replyTo: safeEmail,
      subject: `Job Opportunity – ${safeName || safeEmail}`,
      text: `Name: ${safeName || 'N/A'}\nEmail: ${safeEmail}\nPhone: ${safePhone || 'N/A'}\nCompany: ${safeCompany || 'N/A'}\nRole: ${safeRole || 'N/A'}\nLocation/Work Mode: ${safeLocation || 'Not specified'}\n\n${safeMessage || 'No message provided.'}`,
      headers: { 'X-User-Email': safeEmail }
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('Contact email error:', err)
    res.status(500).json({ message: 'Failed to send email. Please try again later.' })
  }
})

export default router
