import React, { useEffect, useState } from 'react'
import { getAdminCredentials } from '../utils/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function getAdminHeaders() {
  const creds = getAdminCredentials()
  return {
    'x-admin-username': creds.username,
    'x-admin-password': creds.password,
  }
}

const INITIAL_SKILL_GROUPS = [
  { title: 'Frontend & Backend', items: [{ id: 'default-1', name: 'React.js' }] },
  { title: 'Databases', items: [{ id: 'default-2', name: 'MongoDB' }] },
  { title: 'Soft Skills', items: [{ id: 'default-3', name: 'Problem Solving' }] },
]

export default function Skills({ isLoggedIn }) {
  const [skillGroups, setSkillGroups] = useState(INITIAL_SKILL_GROUPS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [form, setForm] = useState({
    groupTitle: 'Frontend & Backend',
    name: '',
  })

  const resetSkillForm = (shouldCloseModal = true) => {
    setForm({
      groupTitle: 'Frontend & Backend',
      name: '',
    })

    if (shouldCloseModal) {
      setIsSkillModalOpen(false)
    }
  }

  const openAddSkillModal = () => {
    resetSkillForm(false)
    setIsSkillModalOpen(true)
  }

  const fetchSkills = async () => {
    setIsLoading(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills`)
      if (!response.ok) {
        throw new Error('Could not load skills from server.')
      }

      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setSkillGroups(data)
      }
    } catch (error) {
      setApiError(error.message || 'Could not load skills.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  const addSkill = async (e) => {
    e.preventDefault()

    const name = form.name.trim()
    if (!name) return

    setIsSaving(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          groupTitle: form.groupTitle,
          name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not add skill.')
      }

      await fetchSkills()
      resetSkillForm()
    } catch (error) {
      setApiError(error.message || 'Could not add skill.')
    } finally {
      setIsSaving(false)
    }
  }

  const removeSkill = async (skillId) => {
    setIsSaving(true)
    setApiError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Could not remove skill.')
      }

      await fetchSkills()
    } catch (error) {
      setApiError(error.message || 'Could not remove skill.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="skills" className="section-block">
      <div className="container">
        <div className="mb-10">
          <h3 className="section-heading">Skills</h3>
          <p className="skills-subtitle">
            Technical and professional skills built through real-world internships and full-time development work.
          </p>
          {apiError ? <p className="skills-subtitle" role="alert">{apiError}</p> : null}
        </div>

        {isLoggedIn ? (
          <div className="project-admin-panel">
            <div className="project-admin-header-row">
              <h4 className="project-group-title">Manage Skills</h4>
              <button type="button" className="btn" onClick={openAddSkillModal} disabled={isSaving}>
                Add Skill
              </button>
            </div>
          </div>
        ) : null}

        {isLoggedIn && isSkillModalOpen ? (
          <div className="project-modal-backdrop" onClick={() => resetSkillForm()}>
            <div className="project-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <div className="project-modal-header">
                <h4 className="project-group-title">Add Skill</h4>
                <button type="button" className="project-modal-close" onClick={() => resetSkillForm()}>
                  Close
                </button>
              </div>

              <form className="project-admin-form" onSubmit={addSkill}>
                <select
                  value={form.groupTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, groupTitle: e.target.value }))}
                  disabled={isSaving}
                >
                  {skillGroups.map((group) => (
                    <option key={group.title} value={group.title}>{group.title}</option>
                  ))}
                </select>

                <input
                  placeholder="Skill name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={isSaving}
                  required
                />

                <button type="submit" className="btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Add Skill'}
                </button>

                <button type="button" className="btn-outline" disabled={isSaving} onClick={() => resetSkillForm()}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {isLoading ? <p className="skills-subtitle">Loading skills...</p> : null}

        <div className="skills-grid">
          {!isLoading && skillGroups.map((g, idx) => (
            <article key={g.title} className="skills-card" style={{ '--skill-index': idx }}>
              <header className="skills-card-header">
                <h4 className="skills-card-title">{g.title}</h4>
                <span className="skills-count">{g.items.length} items</span>
              </header>

              <div className="skills-chip-wrap">
                {g.items.map((it) => (
                  <span key={it.id || it.name} className="skills-chip">
                    {it.name}
                    {isLoggedIn && it.id ? (
                      <button
                        type="button"
                        className="skills-remove-btn"
                        onClick={() => removeSkill(it.id)}
                        disabled={isSaving}
                      >
                        Remove
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
