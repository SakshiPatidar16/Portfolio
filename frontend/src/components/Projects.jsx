import React, { useEffect, useState } from 'react'
import { getAdminCredentials } from '../utils/auth'

const INITIAL_PROJECT_GROUPS = [
  {
    title: 'Company Projects',
    kind: 'Company',
    items: [
      {
        title: 'Lexstar.com - Doctor Appointment Booking Platform',
        desc: 'Contributed to a healthcare platform where users can find trusted doctors and dentists, book appointments, and manage their care journey in one place.',
        caseStudy: [
          'Built patient-facing booking flows for in-person and Telehealth consultations.',
          'Implemented doctor search and specialty discovery for faster appointment matching.',
          'Worked on HIPAA-focused privacy and secure patient data handling experiences.',
          'Supported trusted provider network UX and onboarding journeys.',
        ],
        stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB'],
        link: 'https://lexstar.com/',
      },
      {
        title: 'Invoice Management System',
        desc: 'Developed a full-stack invoice processing system with responsive frontend and API-driven backend for billing workflows.',
        caseStudy: [
          'Built frontend using React and Tailwind CSS for responsive invoice workflows.',
          'Implemented backend using Node.js, Express.js, and MongoDB.',
          'Added pending invoice tracking and easy-to-use financial record management.',
        ],
        stack: ['React.js', 'Tailwind CSS', 'Node.js', 'Express.js', 'MongoDB'],
        link: '#',
      },
    ],
  },
  {
    title: 'Self Projects',
    kind: 'Self',
    items: [
      {
        title: 'Online Doctor Appointment System',
        desc: 'Created a platform where patients can book, reschedule, and cancel appointments with registered doctors.',
        caseStudy: [
          'Implemented three dedicated panels: Patient, Doctor, and Admin.',
          'Handled appointment booking flow and doctor-side schedule management.',
          'Added admin controls for managing users and appointment data.',
        ],
        stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB'],
        link: '#',
      },
    ],
  },
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function getAdminHeaders() {
  const creds = getAdminCredentials()
  return {
    'x-admin-username': creds.username,
    'x-admin-password': creds.password,
  }
}

export default function Projects({ isLoggedIn }) {
  const [projectGroups, setProjectGroups] = useState(INITIAL_PROJECT_GROUPS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [editingProject, setEditingProject] = useState(null)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  const [openCaseStudy, setOpenCaseStudy] = useState({})
  const [form, setForm] = useState({
    groupTitle: 'Company Projects',
    title: '',
    desc: '',
    link: '',
    stack: '',
    caseStudy: '',
  })
  const [projectImageFile, setProjectImageFile] = useState(null)

  const resetProjectForm = (shouldCloseModal = true) => {
    setForm({
      groupTitle: 'Company Projects',
      title: '',
      desc: '',
      link: '',
      stack: '',
      caseStudy: '',
    })
    setProjectImageFile(null)
    setEditingProject(null)
    if (shouldCloseModal) {
      setIsProjectModalOpen(false)
    }
  }

  const openAddProjectModal = () => {
    resetProjectForm(false)
    setIsProjectModalOpen(true)
  }

  const fetchProjects = async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`)
      if (!response.ok) {
        throw new Error('Could not load projects from server.')
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setProjectGroups(data)
      }
    } catch (error) {
      setApiError(error.message || 'Could not load projects.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const toggleCaseStudy = (key) => {
    setOpenCaseStudy((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const addProject = async (e) => {
    e.preventDefault()

    const title = form.title.trim()
    const desc = form.desc.trim()
    if (!title || !desc) return

    const stack = form.stack
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const caseStudy = form.caseStudy
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    const newProject = {
      groupTitle: form.groupTitle,
      title,
      desc,
      caseStudy: caseStudy.length ? caseStudy : ['Project details will be added soon.'],
      stack: stack.length ? stack : ['React.js'],
      link: form.link.trim() || '#',
    }

    setIsSaving(true)
    setApiError('')

    try {
      const formData = new FormData()
      formData.append('groupTitle', newProject.groupTitle)
      formData.append('title', newProject.title)
      formData.append('desc', newProject.desc)
      formData.append('link', newProject.link)
      formData.append('stack', JSON.stringify(newProject.stack))
      formData.append('caseStudy', JSON.stringify(newProject.caseStudy))
      if (projectImageFile) {
        const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
        const lowerName = projectImageFile.name.toLowerCase()
        const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
        const hasAllowedExt = allowedExt.some((ext) => lowerName.endsWith(ext))

        if (!allowedMime.includes(projectImageFile.type) || !hasAllowedExt) {
          throw new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed.')
        }

        formData.append('image', projectImageFile)
      }

      const endpoint = editingProject
        ? `${API_BASE_URL}/api/projects/${editingProject.id}`
        : `${API_BASE_URL}/api/projects`

      const response = await fetch(endpoint, {
        method: editingProject ? 'PUT' : 'POST',
        headers: {
          ...getAdminHeaders(),
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not save project.')
      }

      await fetchProjects()

      resetProjectForm()
    } catch (error) {
      setApiError(error.message || 'Could not save project.')
    } finally {
      setIsSaving(false)
    }
  }

  const startEditProject = (groupTitle, project) => {
    setEditingProject({ id: project.id })
    setProjectImageFile(null)
    setForm({
      groupTitle,
      title: project.title || '',
      desc: project.desc || '',
      link: project.link || '',
      stack: Array.isArray(project.stack) ? project.stack.join(', ') : '',
      caseStudy: Array.isArray(project.caseStudy) ? project.caseStudy.join('\n') : '',
    })
    setIsProjectModalOpen(true)
  }

  const removeProject = async (projectId) => {
    setIsSaving(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not remove project.')
      }

      await fetchProjects()
    } catch (error) {
      setApiError(error.message || 'Could not remove project.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="projects" className="section-block projects-section">
      <div className="container">
        <div className="mb-10">
          <h3 className="section-heading">Projects</h3>
          <p className="projects-subtitle">
            Projects built during internship, full-time experience, and self-practice in full-stack development.
          </p>
          {apiError ? <p className="projects-subtitle" role="alert">{apiError}</p> : null}
        </div>

        {isLoggedIn ? (
          <div className="project-admin-panel">
            <div className="project-admin-header-row">
              <h4 className="project-group-title">Manage Projects</h4>
              <button type="button" className="btn" onClick={openAddProjectModal} disabled={isSaving}>
                Add Project
              </button>
            </div>
          </div>
        ) : null}

        {isLoggedIn && isProjectModalOpen ? (
          <div className="project-modal-backdrop" onClick={() => resetProjectForm()}>
            <div className="project-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="project-modal-header">
                <h4 className="project-group-title">{editingProject ? 'Edit Project' : 'Add Project'}</h4>
                <button type="button" className="project-modal-close" onClick={() => resetProjectForm()}>
                  Close
                </button>
              </div>

              <form className="project-admin-form" onSubmit={addProject}>
                <select
                  value={form.groupTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, groupTitle: e.target.value }))}
                  disabled={isSaving}
                >
                  {projectGroups.map((group) => (
                    <option key={group.title} value={group.title}>{group.title}</option>
                  ))}
                </select>

                <input
                  placeholder="Project title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  disabled={isSaving}
                  required
                />

                <textarea
                  placeholder="Project description"
                  value={form.desc}
                  onChange={(e) => setForm((prev) => ({ ...prev, desc: e.target.value }))}
                  rows={3}
                  disabled={isSaving}
                  required
                />

                <input
                  placeholder="Project URL (optional)"
                  value={form.link}
                  onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                  disabled={isSaving}
                />

                <input
                  placeholder="Stack (comma separated)"
                  value={form.stack}
                  onChange={(e) => setForm((prev) => ({ ...prev, stack: e.target.value }))}
                  disabled={isSaving}
                />

                <textarea
                  placeholder="Case Study Points (one point per line)"
                  value={form.caseStudy}
                  onChange={(e) => setForm((prev) => ({ ...prev, caseStudy: e.target.value }))}
                  rows={4}
                  disabled={isSaving}
                />

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setProjectImageFile(e.target.files?.[0] || null)}
                  disabled={isSaving}
                />

                <button type="submit" className="btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
                </button>

                <button type="button" className="btn-outline" disabled={isSaving} onClick={() => resetProjectForm()}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {isLoading ? <p className="projects-subtitle">Loading projects...</p> : null}

        {!isLoading && projectGroups.map((group) => (
          <div key={group.title} className="project-group">
            <h4 className="project-group-title">{group.title}</h4>

            <div className="projects-grid">
              {group.items.map((p, i) => {
                const caseKey = `${group.title}-${p.id || p.title}`
                const caseId = `case-study-${caseKey}`.replace(/\s+/g, '-').toLowerCase()

                return (
                <article key={p.id || p.title} className="project-card" style={{ '--project-index': i }}>
                  <div className="project-media">
                    {p.imageUrl ? (
                      <img
                        src={`${API_BASE_URL}${p.imageUrl}`}
                        alt={`${p.title} preview`}
                        className="project-media-image"
                      />
                    ) : null}
                    <button
                      type="button"
                      className="project-media-label"
                      onClick={() => toggleCaseStudy(caseKey)}
                      aria-expanded={Boolean(openCaseStudy[caseKey])}
                      aria-controls={caseId}
                    >
                      {openCaseStudy[caseKey] ? 'Hide Case Study' : 'Case Study'}
                    </button>
                  </div>

                  <div className="project-body">
                    <span className="project-kind">{group.kind}</span>
                    {isLoggedIn ? (
                      <button
                        type="button"
                        className="project-edit-btn"
                        onClick={() => startEditProject(group.title, p)}
                        disabled={isSaving || !p.id}
                      >
                        Edit
                      </button>
                    ) : null}
                    {isLoggedIn ? (
                      <button
                        type="button"
                        className="project-remove-btn"
                        onClick={() => removeProject(p.id)}
                        disabled={isSaving || !p.id}
                      >
                        Remove
                      </button>
                    ) : null}
                    <h4 className="project-title">{p.title}</h4>
                    <p className="project-description">{p.desc}</p>

                    {openCaseStudy[caseKey] && (
                      <div className="project-case-study" id={caseId}>
                        <p className="project-case-study-title">Case Study Details</p>
                        <ul>
                          {p.caseStudy.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="project-tags">
                      {p.stack.map((tech) => (
                        <span key={tech} className="project-tag">{tech}</span>
                      ))}
                    </div>

                    <a href={p.link} className="btn project-link-btn text-sm">View Project</a>
                  </div>
                </article>
              )})}
            </div>
          </div>
        ))}

      </div>
    </section>
  )
}
