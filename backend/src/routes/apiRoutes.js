import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
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
import { MAIL_TO, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/dbConfig.js'

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

const router = Router()

let emailTransporter = null

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter

  const gmailUser = process.env.GMAIL_USER || ''
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || ''

  if (!gmailUser || !gmailAppPassword) return null

  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
    pool: true,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  return emailTransporter
}

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

function fileExtension(filename) {
  const idx = (filename || '').lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'portfolio/resumes', resource_type: 'raw' },
})

const projectImageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'portfolio/projects', resource_type: 'image' },
})

const profileImageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'portfolio/profile', resource_type: 'image' },
})

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = fileExtension(file.originalname)
    if (file.mimetype === 'application/pdf' && ext === '.pdf') return cb(null, true)
    cb(new Error('Only PDF files are allowed.'))
  }
})

const projectImageUpload = multer({
  storage: projectImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = fileExtension(file.originalname)
    if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) return cb(null, true)
    cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.'))
  }
})

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
    const ext = fileExtension(file.originalname)
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
    imageUrl: file ? file.path : '',
    imageStoredName: file ? file.filename : '',
    cloudinaryPublicId: file ? file.filename : '',
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
        urlPath: req.file.path,
        cloudinaryPublicId: req.file.filename
      })

      if (existing?.cloudinaryPublicId && existing.cloudinaryPublicId !== req.file.filename) {
        cloudinary.uploader.destroy(existing.cloudinaryPublicId).catch(console.error)
      }

      res.status(201).json({ profileImage: saved })
    } catch (saveError) {
      console.error('Profile image save error:', saveError)
      cloudinary.uploader.destroy(req.file.filename).catch(console.error)
      res.status(500).json({ message: 'Could not save profile image.' })
    }
  })
})

router.delete('/api/profile-image', requireAdmin, async (_req, res) => {
  const removed = await deleteProfileImage()
  if (!removed) return res.status(404).json({ message: 'No profile image found.' })

  if (removed.cloudinaryPublicId) {
    cloudinary.uploader.destroy(removed.cloudinaryPublicId).catch(console.error)
  }

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
        urlPath: req.file.path,
        cloudinaryPublicId: req.file.filename
      })

      if (existing?.cloudinaryPublicId && existing.cloudinaryPublicId !== req.file.filename) {
        cloudinary.uploader.destroy(existing.cloudinaryPublicId, { resource_type: 'raw' }).catch(console.error)
      }

      res.status(201).json({ resume: saved })
    } catch (saveError) {
      console.error('Resume save error:', saveError)
      cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' }).catch(console.error)
      res.status(500).json({ message: 'Could not save resume.' })
    }
  })
})

router.delete('/api/resume', requireAdmin, async (_req, res) => {
  const removed = await deleteResume()
  if (!removed) return res.status(404).json({ message: 'No resume found.' })

  if (removed.cloudinaryPublicId) {
    cloudinary.uploader.destroy(removed.cloudinaryPublicId, { resource_type: 'raw' }).catch(console.error)
  }

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
      if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    try {
      const projectId = await addProject(projectData)
      res.status(201).json({ id: projectId })
    } catch (saveError) {
      console.error('Project save error:', saveError)
      if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
      res.status(500).json({ message: 'Could not save project.' })
    }
  })
})

router.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  const projectId = safeString(req.params.id)
  if (!projectId) return res.status(400).json({ message: 'Invalid project id.' })
  const removed = await deleteProject(projectId)
  if (!removed) return res.status(404).json({ message: 'Project not found.' })

  if (removed.cloudinaryPublicId) {
    cloudinary.uploader.destroy(removed.cloudinaryPublicId).catch(console.error)
  }

  res.status(204).send()
})

router.put('/api/projects/:id', requireAdmin, (req, res) => {
  projectImageUpload.single('image')(req, res, async (error) => {
    if (error) return res.status(400).json({ message: error.message || 'Project image upload failed.' })

    const projectId = safeString(req.params.id)
    if (!projectId) {
      if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
      return res.status(400).json({ message: 'Invalid project id.' })
    }

    const projectData = createProjectData(req.body, req.file)
    if (!projectData.groupTitle || !projectData.title || !projectData.desc) {
      if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
      return res.status(400).json({ message: 'groupTitle, title and desc are required.' })
    }

    try {
      const updated = await updateProject(projectId, projectData)
      if (!updated) {
        if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
        return res.status(404).json({ message: 'Project not found.' })
      }

      if (req.file && updated.previousCloudinaryPublicId && updated.previousCloudinaryPublicId !== req.file.filename) {
        cloudinary.uploader.destroy(updated.previousCloudinaryPublicId).catch(console.error)
      }

      res.status(200).json({ id: updated.id })
    } catch (saveError) {
      console.error('Project update error:', saveError)
      if (req.file) cloudinary.uploader.destroy(req.file.filename).catch(console.error)
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

  const mailTo = MAIL_TO
  const transporter = getEmailTransporter()

  if (!transporter || !mailTo) {
    return res.status(500).json({ message: 'Email configuration is missing. Please set GMAIL_USER, GMAIL_APP_PASSWORD, and MAIL_TO.' })
  }

  try {
    transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.GMAIL_USER}>`,
      to: mailTo,
      replyTo: safeEmail,
      subject: `Job Opportunity – ${safeName || safeEmail}`,
      text: `Name: ${safeName || 'N/A'}\nEmail: ${safeEmail}\nPhone: ${safePhone || 'N/A'}\nCompany: ${safeCompany || 'N/A'}\nRole: ${safeRole || 'N/A'}\nLocation/Work Mode: ${safeLocation || 'Not specified'}\n\n${safeMessage || 'No message provided.'}`,
      headers: { 'X-User-Email': safeEmail }
    }).catch((err) => {
      console.error('Background contact email error:', err)
    })

    res.json({ ok: true, queued: true })
  } catch (err) {
    console.error('Contact email error:', err)
    res.status(500).json({ message: 'Failed to send email. Please try again later.' })
  }
})

export default router
