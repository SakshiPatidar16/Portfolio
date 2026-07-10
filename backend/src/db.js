import mongoose from 'mongoose'
import { defaultProjectGroups } from './seedData.js'

const defaultSkillGroups = [
  { title: 'Frontend & Backend', items: ['React.js', 'Node.js', 'Express.js', 'JavaScript', 'HTML & CSS', 'Tailwind CSS'] },
  { title: 'Databases', items: ['MongoDB', 'MySQL'] },
  { title: 'Soft Skills', items: ['Problem Solving', 'Multi-tasking', 'Time Management', 'Decision Making'] }
]

const projectSchema = new mongoose.Schema(
  {
    groupTitle: { type: String, required: true, trim: true },
    groupKind: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    link: { type: String, default: '#', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    imageStoredName: { type: String, default: '', trim: true },
    stack: [{ type: String, trim: true }],
    caseStudy: [{ type: String, trim: true }]
  },
  {
    timestamps: true
  }
)

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)

const skillSchema = new mongoose.Schema(
  {
    groupTitle: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
)

const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema)

const resumeSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    urlPath: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
)

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema)

const profileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    urlPath: { type: String, required: true, trim: true }
  },
  {
    timestamps: true
  }
)

const ProfileImage = mongoose.models.ProfileImage || mongoose.model('ProfileImage', profileSchema)

export async function initDb() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio_db'
  await mongoose.connect(mongoUri)

  const projectCount = await Project.countDocuments()
  if (projectCount === 0) await seedDefaultProjects()

  const skillCount = await Skill.countDocuments()
  if (skillCount === 0) await seedDefaultSkills()
}

async function seedDefaultProjects() {
  const docs = []
  defaultProjectGroups.forEach((group) => {
    group.items.forEach((project) => {
      docs.push({
        groupTitle: group.title,
        groupKind: group.kind,
        title: project.title,
        desc: project.desc,
        link: project.link || '#',
        stack: project.stack || ['React.js'],
        caseStudy: project.caseStudy || ['Project details will be added soon.']
      })
    })
  })

  await Project.insertMany(docs)
}

async function seedDefaultSkills() {
  const docs = []

  defaultSkillGroups.forEach((group) => {
    group.items.forEach((item) => {
      docs.push({
        groupTitle: group.title,
        name: item
      })
    })
  })

  await Skill.insertMany(docs)
}

export async function getProjectGroups() {
  const projects = await Project.find({}).sort({ createdAt: -1, _id: -1 }).lean()

  const groups = new Map()

  projects.forEach((project) => {
    if (!groups.has(project.groupTitle)) {
      groups.set(project.groupTitle, {
        title: project.groupTitle,
        kind: project.groupKind,
        items: []
      })
    }

    groups.get(project.groupTitle).items.push({
      id: project._id.toString(),
      title: project.title,
      desc: project.desc,
      link: project.link,
      imageUrl: project.imageUrl || '',
      stack: Array.isArray(project.stack) ? project.stack : [],
      caseStudy: Array.isArray(project.caseStudy) ? project.caseStudy : []
    })
  })

  return Array.from(groups.values())
}

export async function addProject(projectInput) {
  const project = await Project.create({
    groupTitle: projectInput.groupTitle,
    groupKind: projectInput.groupKind,
    title: projectInput.title,
    desc: projectInput.desc,
    link: projectInput.link || '#',
    imageUrl: projectInput.imageUrl || '',
    imageStoredName: projectInput.imageStoredName || '',
    stack: projectInput.stack,
    caseStudy: projectInput.caseStudy
  })

  return project._id.toString()
}

export async function updateProject(projectId, projectInput) {
  const existing = await Project.findById(projectId).lean()
  if (!existing) {
    return null
  }

  await Project.updateOne(
    { _id: projectId },
    {
      groupTitle: projectInput.groupTitle,
      groupKind: projectInput.groupKind,
      title: projectInput.title,
      desc: projectInput.desc,
      link: projectInput.link || '#',
      imageUrl: projectInput.imageUrl || existing.imageUrl || '',
      imageStoredName: projectInput.imageStoredName || existing.imageStoredName || '',
      stack: projectInput.stack,
      caseStudy: projectInput.caseStudy
    }
  )

  return {
    id: existing._id.toString(),
    previousImageStoredName: existing.imageStoredName || ''
  }
}

export async function deleteProject(projectId) {
  const deleted = await Project.findOneAndDelete({ _id: projectId }).lean()
  if (!deleted) {
    return null
  }

  return {
    id: deleted._id.toString(),
    imageStoredName: deleted.imageStoredName || ''
  }
}

export async function getSkillGroups() {
  const skills = await Skill.find({}).sort({ createdAt: -1, _id: -1 }).lean()

  const groups = new Map()

  skills.forEach((skill) => {
    if (!groups.has(skill.groupTitle)) {
      groups.set(skill.groupTitle, {
        title: skill.groupTitle,
        items: []
      })
    }

    groups.get(skill.groupTitle).items.push({
      id: skill._id.toString(),
      name: skill.name
    })
  })

  return Array.from(groups.values())
}

export async function addSkill(skillInput) {
  const skill = await Skill.create({
    groupTitle: skillInput.groupTitle,
    name: skillInput.name
  })

  return skill._id.toString()
}

export async function deleteSkill(skillId) {
  return Skill.deleteOne({ _id: skillId })
}

export async function getResume() {
  const resume = await Resume.findOne({}).sort({ updatedAt: -1, _id: -1 }).lean()
  if (!resume) return null

  return {
    id: resume._id.toString(),
    originalName: resume.originalName,
    storedName: resume.storedName,
    mimeType: resume.mimeType,
    size: resume.size,
    urlPath: resume.urlPath,
    updatedAt: resume.updatedAt
  }
}

export async function upsertResume(resumeInput) {
  const resume = await Resume.findOneAndUpdate(
    {},
    {
      originalName: resumeInput.originalName,
      storedName: resumeInput.storedName,
      mimeType: resumeInput.mimeType,
      size: resumeInput.size,
      urlPath: resumeInput.urlPath
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean()

  return {
    id: resume._id.toString(),
    originalName: resume.originalName,
    storedName: resume.storedName,
    mimeType: resume.mimeType,
    size: resume.size,
    urlPath: resume.urlPath,
    updatedAt: resume.updatedAt
  }
}

export async function deleteResume() {
  const existing = await Resume.findOne({}).sort({ updatedAt: -1, _id: -1 }).lean()
  if (!existing) return null

  await Resume.deleteOne({ _id: existing._id })

  return {
    id: existing._id.toString(),
    originalName: existing.originalName,
    storedName: existing.storedName,
    mimeType: existing.mimeType,
    size: existing.size,
    urlPath: existing.urlPath,
    updatedAt: existing.updatedAt
  }
}

export async function getProfileImage() {
  const profile = await ProfileImage.findOne({}).sort({ updatedAt: -1, _id: -1 }).lean()
  if (!profile) return null

  return {
    id: profile._id.toString(),
    originalName: profile.originalName,
    storedName: profile.storedName,
    mimeType: profile.mimeType,
    size: profile.size,
    urlPath: profile.urlPath,
    updatedAt: profile.updatedAt
  }
}

export async function upsertProfileImage(profileInput) {
  const profile = await ProfileImage.findOneAndUpdate(
    {},
    {
      originalName: profileInput.originalName,
      storedName: profileInput.storedName,
      mimeType: profileInput.mimeType,
      size: profileInput.size,
      urlPath: profileInput.urlPath
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).lean()

  return {
    id: profile._id.toString(),
    originalName: profile.originalName,
    storedName: profile.storedName,
    mimeType: profile.mimeType,
    size: profile.size,
    urlPath: profile.urlPath,
    updatedAt: profile.updatedAt
  }
}

export async function deleteProfileImage() {
  const existing = await ProfileImage.findOne({}).sort({ updatedAt: -1, _id: -1 }).lean()
  if (!existing) return null

  await ProfileImage.deleteOne({ _id: existing._id })

  return {
    id: existing._id.toString(),
    originalName: existing.originalName,
    storedName: existing.storedName,
    mimeType: existing.mimeType,
    size: existing.size,
    urlPath: existing.urlPath,
    updatedAt: existing.updatedAt
  }
}
